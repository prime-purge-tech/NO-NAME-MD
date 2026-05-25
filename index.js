import http from "http";
import fs from "fs";
import path from "path";
import url from "url";
import { fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import makeWASocket from "@whiskeysockets/baileys";
import pino from "pino";
import { Boom } from "@hapi/boom";
import { connectDB, Sessions } from "./lib/db.js";
import { useMongoAuthState } from "./lib/mongoAuthState.js";
import {
  startSession,
  stopSession,
  reloadValidatedSessions,
  forceReconnectSession,
  forceReconnectAll,
  getStats,
  activeSessions,
} from "./lib/sessionManager.js";
import config from "./config.js";

const __dirname  = path.dirname(url.fileURLToPath(import.meta.url));
const WEB_PORT   = process.env.PORT || 8077;
const PUBLIC_DIR = path.join(__dirname, "public");

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    req.on("error", reject);
  });
}

function json(res, code, data) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function serveFile(res, filePath, contentType) {
  if (!fs.existsSync(filePath)) { res.writeHead(404); return res.end("Not Found"); }
  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
}

const pairingQueue = new Map();

async function createTempClientForPairing(numero) {
  if (pairingQueue.has(numero)) {
    try { pairingQueue.get(numero).end(); } catch (_) {}
    pairingQueue.delete(numero);
  }

  const { state, saveCreds } = await useMongoAuthState(`__temp__${numero}`);
  const { version } = await fetchLatestBaileysVersion();

  const client = makeWASocket({
    version,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    logger: pino({ level: "silent" }),
    auth: state,
    connectTimeoutMs: 30000,
  });

  client.ev.on("creds.update", saveCreds);

  client.ev.on("connection.update", async (update) => {
    if (update.connection === "open") {
      console.log(`✅ [Pair] +${numero} paired — starting real session...`);
      pairingQueue.delete(numero);
      await Sessions.save(numero, { status: "pending" });
      await Sessions.saveConfig(numero, { owner: numero, mode: "public" });
      const { clearAll } = await useMongoAuthState(`__temp__${numero}`);
      await clearAll();
      await startSession(numero);
    } else if (update.connection === "close") {
      pairingQueue.delete(numero);
    }
  });

  pairingQueue.set(numero, client);
  return client;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const parsed   = new URL(req.url, `http://localhost:${WEB_PORT}`);
  const pathname = parsed.pathname;

  if (req.method === "GET") {
    if (pathname === "/" || pathname === "/index.html") {
      res.writeHead(302, { Location: "/pair" });
      return res.end();
    }
    if (pathname === "/pair" || pathname === "/pair.html") {
      return serveFile(res, path.join(PUBLIC_DIR, "pair.html"), "text/html; charset=utf-8");
    }
    if (pathname === "/dashboard" || pathname === "/dashboard.html") {
      return serveFile(res, path.join(PUBLIC_DIR, "dashboard.html"), "text/html; charset=utf-8");
    }
    const staticPath = path.join(PUBLIC_DIR, pathname);
    if (staticPath.startsWith(PUBLIC_DIR) && fs.existsSync(staticPath)) {
      const ext   = path.extname(staticPath);
      const types = { ".css": "text/css", ".js": "application/javascript", ".png": "image/png", ".ico": "image/x-icon" };
      return serveFile(res, staticPath, types[ext] || "application/octet-stream");
    }
  }

  if (req.method === "GET" && pathname === "/api/status") {
    const stats = getStats();
    return json(res, 200, { ok: true, bot: config.BotName, uptime: process.uptime(), ...stats });
  }

  if (req.method === "GET" && pathname === "/api/sessions") {
    const docs = await Sessions.getAll();
    const list = await Promise.all(docs.map(async (d) => {
      const live = activeSessions.get(d.numero);
      const stats = getStats();
      const liveEntry = stats.sessions?.find(s => s.numero === d.numero);
      return {
        numero:       d.numero,
        status:       live?.status || d.status,
        owner:        d.config?.owner || d.numero,
        mode:         d.config?.mode  || "public",
        retries:      liveEntry?.retries || 0,
        lastActivity: liveEntry?.lastActivity || null,
        uptime:       liveEntry?.uptime || null,
        createdAt:    d.createdAt,
      };
    }));
    return json(res, 200, { ok: true, sessions: list });
  }

  if (req.method === "GET" && pathname.startsWith("/api/session/") && !pathname.includes("/stop") && !pathname.includes("/restart") && !pathname.includes("/reconnect")) {
    const numero = pathname.split("/")[3];
    const doc    = await Sessions.get(numero);
    if (!doc) return json(res, 404, { ok: false, error: "Session not found" });
    const live   = activeSessions.get(numero);
    const stats  = getStats();
    const entry  = stats.sessions?.find(s => s.numero === numero);
    return json(res, 200, {
      ok:           true,
      numero:       doc.numero,
      status:       live?.status || doc.status,
      config:       doc.config,
      retries:      entry?.retries || 0,
      lastActivity: entry?.lastActivity || null,
      uptime:       entry?.uptime || null,
      createdAt:    doc.createdAt,
    });
  }

  if (req.method === "POST" && pathname === "/api/pair") {
    const body   = await readBody(req);
    const numero = (body.numero || "").replace(/[^0-9]/g, "");
    if (!numero || numero.length < 7 || numero.length > 15) {
      return json(res, 400, { ok: false, error: "Invalid number" });
    }
    const live = activeSessions.get(numero);
    if (live?.status === "connected") {
      return json(res, 200, { ok: false, error: "Already connected!" });
    }
    try {
      const tempClient = await createTempClientForPairing(numero);
      await new Promise(r => setTimeout(r, 2500));
      const code = await tempClient.requestPairingCode(numero);
      return json(res, 200, { ok: true, code, numero });
    } catch (err) {
      return json(res, 500, { ok: false, error: err.message });
    }
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/session/")) {
    const numero = pathname.split("/")[3];
    await stopSession(numero, true);
    return json(res, 200, { ok: true, message: `+${numero} deleted` });
  }

  if (req.method === "POST" && pathname.match(/^\/api\/session\/\d+\/stop$/)) {
    const numero = pathname.split("/")[3];
    await stopSession(numero, false);
    return json(res, 200, { ok: true, message: `+${numero} stopped` });
  }

  if (req.method === "POST" && pathname.match(/^\/api\/session\/\d+\/restart$/)) {
    const numero = pathname.split("/")[3];
    const doc    = await Sessions.get(numero);
    if (!doc) return json(res, 404, { ok: false, error: "Session not found" });
    await startSession(numero);
    return json(res, 200, { ok: true, message: `+${numero} restarting` });
  }

  if (req.method === "POST" && pathname.match(/^\/api\/session\/\d+\/reconnect$/)) {
    const numero = pathname.split("/")[3];
    const doc    = await Sessions.get(numero);
    if (!doc) return json(res, 404, { ok: false, error: "Session not found" });
    await forceReconnectSession(numero);
    return json(res, 200, { ok: true, message: `+${numero} force reconnecting` });
  }

  if (req.method === "POST" && pathname === "/api/reconnect-all") {
    forceReconnectAll().catch(console.error);
    return json(res, 200, { ok: true, message: "Force reconnecting all weak sessions" });
  }

  res.writeHead(404);
  res.end("Not Found");
});

function startGlobalHealthMonitor() {
  const GLOBAL_CHECK_INTERVAL = 2 * 60 * 1000;

  setInterval(async () => {
    try {
      const docs = await Sessions.getAll({
        status: { $in: ["validated", "connected", "reconnecting", "pending"] },
      });

      for (const doc of docs) {
        const live = activeSessions.get(doc.numero);
        if (!live) {
          console.log(`[HealthMonitor] +${doc.numero} missing from memory — relaunching`);
          startSession(doc.numero).catch(() => {});
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    } catch (err) {
      console.error("[HealthMonitor] Error:", err.message);
    }
  }, GLOBAL_CHECK_INTERVAL);

  console.log(`🔍 [HealthMonitor] Running every ${GLOBAL_CHECK_INTERVAL / 1000}s`);
}

async function boot() {
  console.log(`\n🚀 ═══════════════════════════════`);
  console.log(`   ${config.BotName} — MULTI SESSION`);
  console.log(`🚀 ═══════════════════════════════\n`);

  await connectDB();

  await new Promise(resolve =>
    server.listen(WEB_PORT, "0.0.0.0", () => {
      console.log(`🌐 Server     : http://localhost:${WEB_PORT}`);
      console.log(`📄 Pair page  : http://localhost:${WEB_PORT}/pair`);
      console.log(`📊 Dashboard  : http://localhost:${WEB_PORT}/dashboard`);
      resolve();
    })
  );

  await reloadValidatedSessions();
  startGlobalHealthMonitor();

  console.log(`\n✅ ${config.BotName} ready.\n`);
}

boot().catch(err => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
