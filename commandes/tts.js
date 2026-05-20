// commands/tts.js - Text To Speech (convertir texte en audio)
import config from "../config.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

// Dossier temporaire pour les fichiers audio
const TEMP_DIR = path.join(process.cwd(), "temp_audio");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Image pour la commande
const TTS_IMAGE = "https://i.imgur.com/9K4x8L2.jpg";

// Langues disponibles
const LANGUAGES = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  ar: "العربية",
  ru: "Русский",
  ja: "日本語",
  zh: "中文",
  hi: "हिन्दी",
  ko: "한국어"
};

function bold(text) {
  return `*${text}*`;
}

function getNumero(jid = "") {
  return jid.replace(/[^0-9]/g, "");
}

// Nettoyer les fichiers temporaires
function cleanTempFiles() {
  const files = fs.readdirSync(TEMP_DIR);
  const now = Date.now();
  for (const file of files) {
    const filePath = path.join(TEMP_DIR, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > 10 * 60 * 1000) { // Plus de 10 minutes
      try {
        fs.unlinkSync(filePath);
      } catch (_) {}
    }
  }
}
setInterval(cleanTempFiles, 30 * 60 * 1000); // Nettoyage toutes les 30 min

// Convertir texte en audio avec Google TTS (gratuit)
async function textToSpeech(text, lang = "fr") {
  try {
    // Utiliser l'API Google Translate TTS (gratuite)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
    
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const fileName = `tts_${Date.now()}.mp3`;
    const filePath = path.join(TEMP_DIR, fileName);
    fs.writeFileSync(filePath, response.data);
    
    return filePath;
  } catch (err) {
    console.error("Erreur TTS:", err.message);
    return null;
  }
}

export default async function ttsCommand(message, client, { args }) {
  const remoteJid = message.key.remoteJid;
  const isGroup = remoteJid.endsWith("@g.us");
  const sender = message.key.participant || message.key.remoteJid;
  
  // Récupérer le message cité
  const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  let texte = "";
  let langue = "fr";
  
  // Vérifier si un argument est un code de langue
  const possibleLang = args[0]?.toLowerCase();
  if (possibleLang && LANGUAGES[possibleLang]) {
    langue = possibleLang;
    args.shift(); // Enlever la langue des arguments
  }
  
  // === .tts list ===
  if (args[0]?.toLowerCase() === "list") {
    let langList = `╭━〔 🎤 LANGUES DISPONIBLES 〕━⬣\n┃\n`;
    let i = 1;
    for (const [code, name] of Object.entries(LANGUAGES)) {
      langList += `┃ ${i++}. ${bold(code)} → ${name}\n`;
    }
    langList += `┃\n┃ 📌 .tts fr Bonjour le monde\n┃ 📌 .tts en Hello world\n┃ 📌 .tts es Hola mundo\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
    
    await client.sendMessage(remoteJid, { text: langList });
    return;
  }
  
  // Récupérer le texte
  if (quotedMsg) {
    // Si message cité
    texte = quotedMsg.conversation || 
            quotedMsg.extendedTextMessage?.text ||
            quotedMsg.imageMessage?.caption ||
            quotedMsg.videoMessage?.caption ||
            "";
  } else if (args.length > 0) {
    // Si texte direct
    texte = args.join(" ");
  }
  
  if (!texte || texte.trim() === "") {
    await client.sendMessage(remoteJid, {
      image: { url: TTS_IMAGE },
      caption: `╭━〔 🎤 COMMANDE .TTS 〕━⬣
┃ 
┃ 📌 *.tts [langue] texte*
┃    → Convertit le texte en audio
┃ 
┃ 📌 *.tts list*
┃    → Voir les langues disponibles
┃ 
┃ 📌 *.tts [langue] (répondre à un message)*
┃    → Lit le message cité
┃ 
┃ 📖 Exemples :
┃ *.tts fr Bonjour tout le monde*
┃ *.tts en Hello everyone*
┃ 
┃ 🎤 Langues : fr, en, es, de, it, pt, ar, ru, ja, zh, hi, ko
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
    return;
  }
  
  // Limiter la longueur du texte
  if (texte.length > 500) {
    await client.sendMessage(remoteJid, {
      text: `╭━〔 ❌ ERREUR 〕━⬣
┃ Texte trop long ! (max 500 caractères)
┃ Actuellement: ${texte.length} caractères
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
    return;
  }
  
  // Envoyer un message d'attente
  await client.sendMessage(remoteJid, {
    text: `╭━〔 🎤 GÉNÉRATION AUDIO 〕━⬣
┃ 
┃ 📝 Texte: "${texte.substring(0, 50)}${texte.length > 50 ? "..." : ""}"
┃ 🌐 Langue: ${LANGUAGES[langue] || "Français"} (${langue})
┃ ⏳ Génération en cours...
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
  });
  
  try {
    // Générer l'audio
    const audioPath = await textToSpeech(texte, langue);
    
    if (!audioPath) {
      throw new Error("Impossible de générer l'audio");
    }
    
    // Envoyer l'audio
    await client.sendMessage(remoteJid, {
      audio: { url: audioPath },
      mimetype: "audio/mpeg",
      ptt: true, // Mode message vocal
      caption: `🎤 ${bold(LANGUAGES[langue] || "Français")}\n📝 "${texte.substring(0, 100)}${texte.length > 100 ? "..." : ""}"`
    });
    
    // Supprimer le fichier temporaire après envoi
    setTimeout(() => {
      try {
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      } catch (_) {}
    }, 5000);
    
  } catch (err) {
    console.error("Erreur TTS:", err);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 ❌ ERREUR TTS 〕━⬣
┃ 
┃ Impossible de générer l'audio.
┃ 
┃ 📌 Vérifiez votre connexion
┃ 📌 Réessayez plus tard
┃ 
┃ Erreur: ${err.message}
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
  }
}