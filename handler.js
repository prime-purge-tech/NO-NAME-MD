import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, "config.json");

let CONFIG = { owner: "24165818144", creator: "24165818144", mode: "public" };
if (fs.existsSync(configPath)) {
  CONFIG = JSON.parse(fs.readFileSync(configPath, "utf-8"));
} else {
  fs.writeFileSync(configPath, JSON.stringify(CONFIG, null, 2));
}

// --- Chargement des commandes ---
const commands = new Map();
const commandsPath = path.join(__dirname, "commands");
const files = fs.readdirSync(commandsPath);

for (const file of files) {
  if (file.endsWith(".js")) {
    const commandName = file.replace(".js", "");
    try {
      const module = await import(`./commands/${file}`);
      const fn = module.default || module[`${commandName}Command`];
      if (typeof fn === "function") {
        commands.set(commandName, fn);
        console.log(`✅ Commande chargée : .${commandName}`);
      } else {
        console.warn(`⚠️ Commande ignorée (export invalide) : ${file}`);
      }
    } catch (err) {
      console.error(`❌ Erreur chargement commande ${file} :`, err.message);
    }
  }
}

let react = null;
try { const r = await import("./commands/react.js"); react = r.default || r.reactCommand; } catch (_) {}

let welcomeHandler = null;
try { const wm = await import("./commands/welcome.js"); welcomeHandler = wm.welcomeHandler || wm.default; console.log("✅ welcome.js chargé"); } catch (_) { console.warn("⚠️ welcome.js introuvable"); }

let goodbyeHandler = null;
try { const gm = await import("./commands/goodbye.js"); goodbyeHandler = gm.goodbyeHandler || gm.default; console.log("✅ goodbye.js chargé"); } catch (_) { console.warn("⚠️ goodbye.js introuvable"); }

let handleAntiDemote = null;
try { const ad = await import("./commands/antidemote.js"); handleAntiDemote = ad.handleAntiDemote; console.log("✅ antidemote.js chargé"); } catch (_) { console.warn("⚠️ antidemote.js introuvable"); }

let handleAntiLink = null;
try { const al = await import("./commands/antilink.js"); handleAntiLink = al.handleAntiLink; console.log("✅ antilink.js chargé"); } catch (_) { console.warn("⚠️ antilink.js introuvable"); }

let saveViewOnce = null;
try { const vv = await import("./commands/vv.js"); saveViewOnce = vv.saveViewOnce; console.log("✅ vv.js chargé"); } catch (_) { console.warn("⚠️ vv.js introuvable"); }

let handleAutoMsg = null;
try { const am = await import("./commands/automsg.js"); handleAutoMsg = am.handleAutoMsg; console.log("✅ automsg.js chargé"); } catch (_) { console.warn("⚠️ automsg.js introuvable"); }

// ✅ TicTacToe
let handleTicTacToeMove = null;
try { const tt = await import("./commands/tictactoe.js"); handleTicTacToeMove = tt.handleTicTacToeMove; console.log("✅ tictactoe.js chargé"); } catch (_) { console.warn("⚠️ tictactoe.js introuvable"); }

export async function setOwnerOnConnect(client) {
  if (!CONFIG.owner) {
    const me = client.user?.id || client.user?.jid;
    if (me) {
      CONFIG.owner = me.replace(/[^0-9]/g, "");
      fs.writeFileSync(configPath, JSON.stringify(CONFIG, null, 2));
    }
  }
}

function getSenderNumber(message) {
  let senderJid = "";
  if (message.key.fromMe) senderJid = CONFIG.owner + "@s.whatsapp.net";
  else if (message.key.participant) senderJid = message.key.participant;
  else senderJid = message.key.remoteJid;
  return senderJid.replace(/[^0-9]/g, "");
}

function getTargetUser(message, args) {
  const ctx = message.message?.extendedTextMessage?.contextInfo;
  const mentions = ctx?.mentionedJid || [];
  if (ctx?.participant) return ctx.participant.replace(/[^0-9]/g, "");
  if (mentions.length > 0) return mentions[0].replace(/[^0-9]/g, "");
  if (args[0]) return args[0].replace(/[^0-9]/g, "");
  return null;
}

function extractText(message) {
  return (
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    message.message?.imageMessage?.caption ||
    message.message?.videoMessage?.caption ||
    message.message?.documentMessage?.caption || ""
  );
}

function logMessage(message, type = "IN") {
  const remoteJid = message.key.remoteJid;
  const isGroup = remoteJid.endsWith("@g.us");
  const sender = getSenderNumber(message);
  const senderName = message.pushName || "Unknown";
  const text = extractText(message);
  if (isGroup) console.log(`[${type}] GROUPE (${remoteJid}) | ${senderName} (${sender}) → ${text}`);
  else console.log(`[${type}] DM | ${senderName} (${sender}) → ${text}`);
}

export function registerGroupEvents(client) {
  client.ev.on("group-participants.update", async ({ id, participants, action, author }) => {
    try {
      if (action === "add" && welcomeHandler) await welcomeHandler(id, participants, client);
      else if ((action === "remove" || action === "leave") && goodbyeHandler) await goodbyeHandler(id, participants, client);
      else if (action === "demote" && handleAntiDemote && author) await handleAntiDemote(id, author, participants, client);
    } catch (err) { console.error("Erreur group-participants.update :", err); }
  });
  console.log("✅ Événements groupe enregistrés");
}

export async function handleCommand(message, client) {
  try {
    logMessage(message, "IN");

    if (saveViewOnce && !message.key.fromMe) await saveViewOnce(message, client);
    if (handleAntiLink && !message.key.fromMe) await handleAntiLink(message, client);

    const text = extractText(message);
    const prefix = ".";

    // ✅ Gestion des mouvements TicTacToe (avant auto-msg et commandes)
    if (handleTicTacToeMove && !message.key.fromMe && !text.startsWith(prefix)) {
      await handleTicTacToeMove(message, client);
    }

    // Auto-msg sur les messages sans commande
    if (handleAutoMsg && !message.key.fromMe && !text.startsWith(prefix)) {
      await handleAutoMsg(message, client);
      return;
    }

    if (!text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const sender = getSenderNumber(message);
    const isOwner = sender === CONFIG.owner;
    const isCreator = sender === CONFIG.creator;

    if (CONFIG.mode === "private" && !isOwner) return;

    if (commands.has(command)) {
      if (react) { try { await react(message, client); } catch (_) {} }

      const cmd = commands.get(command);
      const target = getTargetUser(message, args);

      await cmd(message, client, {
        sender, target, args, isOwner, isCreator,
        config: CONFIG,
        updateConfig: (newConfig) => {
          CONFIG = { ...CONFIG, ...newConfig };
          fs.writeFileSync(configPath, JSON.stringify(CONFIG, null, 2));
        },
      });

      logMessage({ key: message.key, message: { conversation: `Commande ${command} exécutée` }, pushName: message.pushName }, "OUT");
    }
  } catch (e) {
    console.error("Erreur handleCommand:", e);
  }
}