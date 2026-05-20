// commands/menu.js
import config from "../config.js";
import { getThemePhoto, getThemeStyle, formatThemedMessage } from "./theme.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, "./");

// Catégories et leurs commandes
const categories = {
  "🎮 JEUX": [".quiz", ".manga", ".family", ".kamui", ".tictactoe", "wheel"],
  "🎵 MEDIA": [".play", ".tts", ".vv", ".s"],
  "🤖 INTELLIGENCE": [".ai", ".automsg"],
  "🛡️ GROUPE": [".antilink", ".antidemote", ".welcome", ".goodbye", ".bye"],
  "👮 ADMINISTRATION": [".kick", ".kickall", ".mute", ".unmute", ".promote", ".demote", ".demoteall", ".tag", ".tagall"],
  "🔧 OUTILS": [".ping", ".fancy", ".pair", ".channel", ".repo", ".theme", ".menu"],
  "😈 NO NAME": [".no", ".noname"],
  "📞 CONTACT": [".owner", ".telegramm"]
};

export default async function menuCommand(message, client) {
  try {
    const remoteJid = message.key.remoteJid;
    const style = getThemeStyle(remoteJid);
    const photo = getThemePhoto(remoteJid);
    const pushName = message.pushName || "Invité";
    
    // Construire les items du menu
    let allItems = [];
    
    for (const [category, commands] of Object.entries(categories)) {
      allItems.push(`${category}`);
      for (const cmd of commands) {
        allItems.push(`  ${cmd}`);
      }
      allItems.push(``);
    }
    
    // Ajouter les infos
    const extraInfo = {
      userName: pushName,
      botName: config.BotName,
      dev: config.nameCreator,
      theme: style.nom
    };
    
    const menuText = formatThemedMessage(remoteJid, "MENU", allItems, extraInfo);
    
    await client.sendMessage(remoteJid, {
      image: { url: photo },
      caption: menuText,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: config.Newsletter,
          newsletterName: config.BotName,
          serverMessageId: 143
        }
      }
    }, { quoted: message });

    // Audio
    await client.sendMessage(remoteJid, {
      audio: { url: "https://files.catbox.moe/yv595u.m4a" },
      mimetype: "audio/mp4",
      ptt: true,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: config.Newsletter,
          newsletterName: config.BotName,
          serverMessageId: 143
        }
      }
    });

  } catch (err) {
    console.error("Erreur menuCommand:", err.message);
  }
}