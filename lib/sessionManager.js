import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { Boom } from "@hapi/boom";
import { useMongoAuthState } from "./mongoAuthState.js";
import { Sessions } from "./db.js";
import { handleCommand, registerGroupEvents } from "../handler.js";
import config from "../config.js";

export const activeSessions = new Map();

const RECONNECT_DELAYS = [5000, 10000, 20000, 40000, 60000];
const MAX_RETRIES = 10;
const KEEPALIVE_INTERVAL = 25000;
const HEALTH_CHECK_INTERVAL = 60000;
const SILENCE_THRESHOLD = 5 * 60 * 1000;

const sessionRetries   = new Map();
const sessionTimers    = new Map();
const lastActivityTime = new Map();

function getRetryDelay(numero) {
  const retries = sessionRetries.get(numero) || 0;
  return RECONNECT_DELAYS[Math.min(retries, RECONNECT_DELAYS.length - 1)];
}

function incrementRetry(numero) {
  const retries = sessionRetries.get(numero) || 0;
  sessionRetries.set(numero, retries + 1);
  return retries + 1;
}

function resetRetry(numero) {
  sessionRetries.delete(numero);
}

function clearSessionTimers(numero) {
  const timers = sessionTimers.get(numero) || {};
  if (timers.keepalive) clearInterval(timers.keepalive);
  if (timers.reconnect) clearTimeout(timers.reconnect);
  if (timers.watchdog) clearInterval(timers.watchdog);
  sessionTimers.delete(numero);
}

function setSessionTimer(numero, key, timer) {
  const timers = sessionTimers.get(numero) || {};
  timers[key] = timer;
  sessionTimers.set(numero, timers);
}

function touchActivity(numero) {
  lastActivityTime.set(numero, Date.now());
}

async function followNewsletters(client) {
  const newsJids = [
    config.Newsletter,
    config.Newsletter2,
    config.Newsletter3,
    config.Newsletter4,
    config.Newsletter5,
    config.Newsletter6,
  ].filter(Boolean);
  for (const jid of newsJids) {
    try { await client.subscribeToNewsletter(jid); } catch (_) {}
  }
}

function startKeepalive(client, numero) {
  clearSessionTimers(numero);

  const keepalive = setInterval(async () => {
    const entry = activeSessions.get(numero);
    if (!entry || entry.status !== "connected") {
      clearInterval(keepalive);
      return;
    }
    try {
      await client.sendPresenceUpdate("available");
      touchActivity(numero);
    } catch (err) {
      console.warn(`[Keepalive] +${numero} failed: ${err.message}`);
    }
  }, KEEPALIVE_INTERVAL);

  const watchdog = setInterval(async () => {
    const entry = activeSessions.get(numero);
    if (!entry) { clearInterval(watchdog); return; }
    if (entry.status !== "connected") return;

    const lastSeen = lastActivityTime.get(numero) || 0;
    const silent = Date.now() - lastSeen;

    if (silent > SILENCE_THRESHOLD) {
      console.warn(`[Watchdog] +${numero} silent for ${Math.round(silent / 1000)}s — forcing reconnect`);
      try { client.end(); } catch (_) {}
    }
  }, HEALTH_CHECK_INTERVAL);

  setSessionTimer(numero, "keepalive", keepalive);
  setSessionTimer(numero, "watchdog", watchdog);
}

export async function startSession(numero, options = {}) {
  const existing = activeSessions.get(numero);
  if (existing?.status === "connected") {
    return existing.client;
  }

  const retries = sessionRetries.get(numero) || 0;
  if (retries >= MAX_RETRIES) {
    console.error(`[SessionManager] +${numero} exceeded max retries (${MAX_RETRIES}), giving up.`);
    await Sessions.setStatus(numero, "failed");
    sessionRetries.delete(numero);
    return null;
  }

  console.log(`[SessionManager] Starting +${numero} (attempt ${retries + 1})...`);

  const { state, saveCreds } = await useMongoAuthState(numero);
  const { version } = await fetchLatestBaileysVersion();
  const sessionConfig = await Sessions.getConfig(numero);

  const client = makeWASocket({
    version,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    logger: pino({ level: "silent" }),
    auth: state,
    connectTimeoutMs: 30000,
    defaultQueryTimeoutMs: 30000,
    keepAliveIntervalMs: KEEPALIVE_INTERVAL,
    retryRequestDelayMs: 2000,
    maxMsgRetryCount: 5,
    getMessage: async () => ({ conversation: "" }),
  });

  activeSessions.set(numero, {
    client,
    status: "pending",
    startedAt: Date.now(),
    config: sessionConfig,
    retries,
  });

  touchActivity(numero);
  await Sessions.setStatus(numero, "pending");
  registerGroupEvents(client, numero);

  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, receivedPendingNotifications } = update;

    if (connection === "open") {
      resetRetry(numero);
      touchActivity(numero);

      const entry = activeSessions.get(numero);
      if (entry) {
        entry.status = "connected";
        entry.connectedAt = Date.now();
      }

      const me = client.user?.id || "";
      const detectedOwner = me.replace(/[^0-9]/g, "");
      if (detectedOwner && !sessionConfig.owner) {
        sessionConfig.owner = detectedOwner;
        await Sessions.saveConfig(numero, sessionConfig);
      }

      await Sessions.validate(numero);
      console.log(`✅ [Session] +${numero} CONNECTED`);

      startKeepalive(client, numero);
      await followNewsletters(client);
      return;
    }

    if (connection === "close") {
      clearSessionTimers(numero);
      activeSessions.delete(numero);

      const boom = new Boom(lastDisconnect?.error);
      const reason = boom?.output?.statusCode;

      if (reason === DisconnectReason.loggedOut || reason === 401) {
        console.log(`❌ [Session] +${numero} logged out — clearing auth`);
        await Sessions.setStatus(numero, "logged_out");
        const { clearAll } = await useMongoAuthState(numero);
        await clearAll();
        sessionRetries.delete(numero);
        return;
      }

      if (reason === DisconnectReason.badSession || reason === 500) {
        console.log(`🗑️ [Session] +${numero} bad session — clearing auth and re-pairing needed`);
        await Sessions.setStatus(numero, "bad_session");
        const { clearAll } = await useMongoAuthState(numero);
        await clearAll();
        sessionRetries.delete(numero);
        return;
      }

      const retryCount = incrementRetry(numero);
      const delay = getRetryDelay(numero);

      console.log(`⚠️ [Session] +${numero} disconnected (reason: ${reason}) — retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s`);
      await Sessions.setStatus(numero, "reconnecting");

      const reconnectTimer = setTimeout(() => startSession(numero), delay);
      setSessionTimer(numero, "reconnect", reconnectTimer);
    }
  });

  client.ev.on("messages.upsert", async (chatUpdate) => {
    touchActivity(numero);
    const msg = chatUpdate.messages[0];
    if (!msg?.message) return;
    if (msg.key.remoteJid === "status@broadcast") return;
    await handleCommand(msg, client, numero);
  });

  client.ev.on("messages.reaction", () => touchActivity(numero));
  client.ev.on("presence.update",   () => touchActivity(numero));
  client.ev.on("chats.update",      () => touchActivity(numero));
  client.ev.on("creds.update", saveCreds);

  return client;
}

export async function stopSession(numero, deleteFromDB = false) {
  clearSessionTimers(numero);
  sessionRetries.delete(numero);
  lastActivityTime.delete(numero);

  const entry = activeSessions.get(numero);
  if (entry?.client) {
    try { entry.client.end(); } catch (_) {}
  }
  activeSessions.delete(numero);

  if (deleteFromDB) {
    await Sessions.delete(numero);
    const { clearAll } = await useMongoAuthState(numero);
    await clearAll();
    console.log(`🗑️ [Session] +${numero} deleted`);
  } else {
    await Sessions.setStatus(numero, "stopped");
  }
}

export async function reloadValidatedSessions() {
  console.log("[SessionManager] Restoring sessions from MongoDB...");

  const docs = await Sessions.getAll({
    status: { $in: ["validated", "connected", "reconnecting", "pending"] },
  });

  if (docs.length === 0) {
    console.log("[SessionManager] No sessions to restore.");
    return;
  }

  console.log(`[SessionManager] Restoring ${docs.length} session(s)...`);

  for (const doc of docs) {
    try {
      await startSession(doc.numero);
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`[SessionManager] Failed to restore +${doc.numero}: ${err.message}`);
    }
  }

  console.log("[SessionManager] All sessions queued for restore.");
}

export async function forceReconnectSession(numero) {
  console.log(`[SessionManager] Force reconnect +${numero}`);
  clearSessionTimers(numero);
  resetRetry(numero);

  const entry = activeSessions.get(numero);
  if (entry?.client) {
    try { entry.client.end(); } catch (_) {}
  }
  activeSessions.delete(numero);

  await new Promise(r => setTimeout(r, 1000));
  return startSession(numero);
}

export async function forceReconnectAll() {
  console.log("[SessionManager] Force reconnecting ALL sessions...");
  const docs = await Sessions.getAll({
    status: { $in: ["validated", "connected", "reconnecting", "pending", "stopped"] },
  });

  for (const doc of docs) {
    const entry = activeSessions.get(doc.numero);
    if (entry?.status === "connected") continue;
    try {
      resetRetry(doc.numero);
      await startSession(doc.numero);
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`[SessionManager] ForceReconnectAll +${doc.numero}: ${err.message}`);
    }
  }
}

export function getStats() {
  const all = [...activeSessions.entries()];
  const connected = all.filter(([, s]) => s.status === "connected").length;
  const pending   = all.filter(([, s]) => s.status === "pending").length;
  const reconnecting = all.filter(([, s]) => s.status === "reconnecting").length;
  return {
    total: activeSessions.size,
    connected,
    pending,
    reconnecting,
    sessions: all.map(([numero, s]) => ({
      numero,
      status: s.status,
      retries: sessionRetries.get(numero) || 0,
      lastActivity: lastActivityTime.get(numero) || null,
      uptime: s.connectedAt ? Date.now() - s.connectedAt : null,
    })),
  };
}
