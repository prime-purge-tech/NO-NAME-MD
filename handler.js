import fs from "fs";
import path from "path";
import url from "url";
import { Sessions } from "./lib/db.js";
import { activeSessions } from "./lib/sessionManager.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const commands = new Map();
const commandsPath = path.join(__dirname, "commands");

const files = fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

for (const file of files) {
  try {
    const mod = await import(`./commands/${file}`);
    const fn = mod.default || mod[file.replace(".js", "") + "Command"];
    if (typeof fn === "function") {
      commands.set(file.replace(".js", ""), fn);
      console.log(`✅ Command loaded: .${file.replace(".js", "")}`);
    } else {
      console.warn(`⚠️ Skipped (invalid export): ${file}`);
    }
  } catch (err) {
    console.error(`❌ Error loading ${file}:`, err.message);
  }
}

async function tryImport(filePath, exportName) {
  try {
    const mod = await import(filePath);
    return mod[exportName] || mod.default || null;
  } catch {
    return null;
  }
}

const react = await tryImport("./commands/react.js", "reactCommand");
const welcomeHandler = await tryImport("./commands/welcome.js", "welcomeHandler");
const goodbyeHandler = await tryImport("./commands/goodbye.js", "goodbyeHandler");
const handleAntiDemote = await tryImport("./commands/antidemote.js", "handleAntiDemote");
const handleAntiLink = await tryImport("./commands/antilink.js", "handleAntiLink");
const saveViewOnce = await tryImport("./commands/vv.js", "saveViewOnce");
const handleAutoMsg = await tryImport("./commands/automsg.js", "handleAutoMsg");
const handleTicTacToeMove = await tryImport("./commands/tictactoe.js", "handleTicTacToeMove");

function extractText(message) {
  return (
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    message.message?.imageMessage?.caption ||
    message.message?.videoMessage?.caption ||
    message.message?.documentMessage?.caption ||
    ""
  );
}

function getSenderNumber(message, ownerNumber) {
  if (message.key.fromMe) return ownerNumber;
  if (message.key.participant) return message.key.participant.replace(/[^0-9]/g, "");
  return message.key.remoteJid.replace(/[^0-9]/g, "");
}

function getTargetUser(message, args) {
  const ctx = message.message?.extendedTextMessage?.contextInfo;
  const mentions = ctx?.mentionedJid || [];
  if (ctx?.participant) return ctx.participant.replace(/[^0-9]/g, "");
  if (mentions.length > 0) return mentions[0].replace(/[^0-9]/g, "");
  if (args[0]) return args[0].replace(/[^0-9]/g, "");
  return null;
}

export function registerGroupEvents(client, numero) {
  client.ev.on(
    "group-participants.update",
    async ({ id, participants, action, author }) => {
      try {
        if (action === "add" && welcomeHandler)
          await welcomeHandler(id, participants, client);
        else if ((action === "remove" || action === "leave") && goodbyeHandler)
          await goodbyeHandler(id, participants, client);
        else if (action === "demote" && handleAntiDemote && author)
          await handleAntiDemote(id, author, participants, client);
      } catch (err) {
        console.error(`[GroupEvents] +${numero}:`, err.message);
      }
    }
  );
  console.log(`✅ Group events registered for +${numero}`);
}

export async function handleCommand(message, client, numero) {
  try {
    const sessionEntry = activeSessions.get(numero);
    let CONFIG = sessionEntry?.config;
    if (!CONFIG) {
      CONFIG = await Sessions.getConfig(numero);
      if (sessionEntry) sessionEntry.config = CONFIG;
    }

    const ownerNumber = CONFIG.owner || numero;

    if (saveViewOnce && !message.key.fromMe)
      await saveViewOnce(message, client);
    if (handleAntiLink && !message.key.fromMe)
      await handleAntiLink(message, client);

    const text = extractText(message);
    const PREFIX = CONFIG.prefix || ".";

    if (handleTicTacToeMove && !message.key.fromMe && !text.startsWith(PREFIX)) {
      await handleTicTacToeMove(message, client);
    }

    if (handleAutoMsg && !message.key.fromMe && !text.startsWith(PREFIX)) {
      await handleAutoMsg(message, client);
      return;
    }

    if (!text.startsWith(PREFIX)) return;

    const args = text.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const sender = getSenderNumber(message, ownerNumber);
    const isOwner = sender === ownerNumber;
    const isCreator = sender === ownerNumber;

    if (CONFIG.mode === "private" && !isOwner) return;

    if (!commands.has(command)) return;

    if (react) {
      try {
        await react(message, client);
      } catch (_) {}
    }

    const cmd = commands.get(command);
    const target = getTargetUser(message, args);

    await cmd(message, client, {
      sender,
      target,
      args,
      isOwner,
      isCreator,
      config: CONFIG,
      numero,
      updateConfig: async (newConfig) => {
        const merged = { ...CONFIG, ...newConfig };
        CONFIG = merged;
        if (sessionEntry) sessionEntry.config = merged;
        await Sessions.saveConfig(numero, merged);
      },
    });
  } catch (err) {
    console.error(`[Handler] Error in +${numero}:`, err.message);
  }
}
