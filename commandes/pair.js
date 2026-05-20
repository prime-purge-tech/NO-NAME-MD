// commands/pair.js
import config from "../config.js";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import path from "path";
import { Boom } from "@hapi/boom";
import { getThemePhoto, getThemeName, sendThemedMessage, sendThemedText } from "./theme.js";

// Dossier des sessions (identique à index.js)
const SESSIONS_DIR = "./sessions";
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// Stockage des sessions de pairage
const pairingSessions = new Map();

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function nettoyerSession(sessionId) {
  const s = pairingSessions.get(sessionId);
  if (s?.timeout) clearTimeout(s.timeout);
  if (s?.client) {
    try { 
      s.client.end(); 
    } catch (_) {}
  }
  pairingSessions.delete(sessionId);
}

export default async function pairCommand(message, client, { args, sender } = {}) {
  const remoteJid = message.key.remoteJid;
  const userNumber = sender;
  const sub = args?.[0]?.toLowerCase();
  const themePhoto = getThemePhoto(remoteJid);
  const themeName = getThemeName(remoteJid);

  // ── .pair stop ──
  if (sub === "stop") {
    const id = args[1];
    if (id && pairingSessions.has(id)) {
      const s = pairingSessions.get(id);
      if (s.userNumber !== userNumber) {
        return await sendThemedText(client, remoteJid, `╭━〔 ⛔ 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ❌ Session introuvable !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
      }
      nettoyerSession(id);
      return await sendThemedText(client, remoteJid, `╭━〔 ✅ 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ✅ Session arrêtée !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
    }
    
    let count = 0;
    for (const [id, s] of pairingSessions) {
      if (s.userNumber === userNumber) {
        nettoyerSession(id);
        count++;
      }
    }
    return await sendThemedText(client, remoteJid, `╭━〔 ✅ 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ✅ *${count}* session(s) arrêtée(s)\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ── .pair list ──
  if (sub === "list") {
    const mes = [...pairingSessions.values()].filter(s => s.userNumber === userNumber);
    if (mes.length === 0) {
      return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 📱 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ⚠️ Aucune session active\n┃ 📌 Ex: *.pair 2250701234567*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
    }
    let txt = `╭━〔 📱 𝐏𝐀𝐈𝐑 〕━⬣\n`;
    let i = 1;
    for (const [id, s] of pairingSessions) {
      if (s.userNumber !== userNumber) continue;
      txt += `┃ ${i++}. 📞 *${s.numero}*\n┃    🆔 \`${id}\`\n┃\n`;
    }
    txt += `┃ 📌 *.pair stop [id]*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
    return await sendThemedText(client, remoteJid, txt, [], message);
  }

  // ── .pair status ──
  if (sub === "status") {
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 📊 𝐏𝐀𝐈𝐑 〕━⬣
┃ ✅ Service *actif*
┃ 📱 Pairages en cours : *${pairingSessions.size}*
┣━━━━━━━━━━━━━━━━━━━━⬣
┃ 📌 *.pair 2250701234567*
┃ 📌 *.pair list*
┃ 📌 *.pair stop*
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ── .pair [numéro] ──
  const numero = args?.[0]?.replace(/[^0-9]/g, "") || null;

  if (!numero) {
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🔗 𝐏𝐀𝐈𝐑 〕━⬣
┃ 📌 *.pair 2250701234567*
┃ 📌 *.pair list*
┃ 📌 *.pair stop*
┃ 📌 *.pair status*
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  if (numero.length < 7 || numero.length > 15) {
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 ❌ 𝐏𝐀𝐈𝐑 〕━⬣
┃ ❌ Numéro invalide !
┃ 📌 Ex: *.pair 2250701234567*
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // Message de chargement
  await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🔗 𝐏𝐀𝐈𝐑 〕━⬣
┃ 📞 *+${numero}*
┃ ⏳ Génération du code...
┃ 🎨 Thème : ${themeName}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);

  const sessionId = genId();
  let tempClient = null;

  try {
    // Créer une session TEMPORAIRE (pas startUserBot pour éviter conflit)
    const sessionDir = path.join(SESSIONS_DIR, `temp_${sessionId}`);
    fs.mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    tempClient = makeWASocket({
      version,
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      logger: pino({ level: "silent" }),
      auth: state,
    });

    // NE PAS enregistrer les handlers pour éviter conflit
    tempClient.ev.on("creds.update", saveCreds);

    // Timeout
    const timeout = setTimeout(() => {
      nettoyerSession(sessionId);
      if (tempClient) {
        try { tempClient.end(); } catch (_) {}
      }
      try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (_) {}
    }, 60000);

    pairingSessions.set(sessionId, {
      numero,
      userNumber,
      timeout,
      sessionDir
    });

    // Attendre
    await new Promise(r => setTimeout(r, 2000));
    
    // Demander le code
    const code = await tempClient.requestPairingCode(numero);
    console.log(`📱 [PAIR] Code pour +${numero} : ${code}`);

    // Envoyer le code
    await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🔑 𝐂𝐎𝐃𝐄 𝐃𝐄 𝐏𝐀𝐈𝐑𝐀𝐆𝐄 〕━⬣
┃
┃ 📞 Numéro : *+${numero}*
┃ 🔑 Code   : *${code}*
┃ ⏱️ Valable : *2 minutes*
┃ 🎨 Thème : ${themeName}
┃
┣━━〔 📲 COMMENT L'UTILISER 〕━⬣
┃
┃ 1️⃣ Ouvre *WhatsApp*
┃ 2️⃣ Paramètres → Appareils liés
┃ 3️⃣ Lier un appareil
┃ 4️⃣ Entrer le code manuellement
┃ 5️⃣ Tape : *${code}*
┃
┣━━〔 ⚡ ${config.BotName} 〕━⬣
┃ 👑 Dev : ${config.nameCreator}
╰━━━━━━━━━━━━━━━━━━━━⬣`, [], message);

    // Nettoyer après envoi
    setTimeout(() => {
      nettoyerSession(sessionId);
      try { tempClient?.end(); } catch (_) {}
      try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (_) {}
    }, 180000);

  } catch (err) {
    console.error("Erreur pairCommand:", err.message);
    nettoyerSession(sessionId);
    if (tempClient) {
      try { tempClient.end(); } catch (_) {}
    }
    await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 ❌ 𝐏𝐀𝐈𝐑 〕━⬣
┃ ⚠️ Erreur : ${err.message}
┃ 📌 Réessaie : *.pair ${numero}*
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }
}