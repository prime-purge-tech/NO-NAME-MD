// commands/antilink.js
import config from "../config.js";
import { getThemePhoto, getThemeName, sendThemedMessage, sendThemedText } from "./theme.js";

// ─── Modes : "off" | "on" | "war" ───
// "on"  = supprime le message + avertissement
// "war" = supprime + expulse directement
export const antilinkGroups = new Map(); // groupJid → "on" | "war"

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

// ─── Détection de liens ───
function contiensLien(texte = "") {
  const regex = /(?:https?:\/\/|www\.|chat\.whatsapp\.com|t\.me\/|bit\.ly|tinyurl|youtu\.be|discord\.gg|telegram\.me|wa\.me|instagram\.com|facebook\.com|tiktok\.com)[^\s]*/gi;
  return regex.test(texte);
}

// ─── Commande .antilink on/off/war ───
export default async function antilinkCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  if (!remoteJid.endsWith("@g.us")) {
    return await sendThemedText(client, remoteJid, `╭━〔 🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊 〕━⬣\n┃ ❌ Uniquement dans un groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // Vérif admin
  const meta = await client.groupMetadata(remoteJid);
  const senderJid = message.key.participant || message.key.remoteJid;
  const senderNumero = getNumero(senderJid);
  const senderInfo = meta.participants.find(p => getNumero(p.id) === senderNumero);
  const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";

  if (!estAdmin) {
    return await sendThemedText(client, remoteJid, `╭━〔 🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊 〕━⬣\n┃ ❌ Réservé aux *admins du groupe* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  const option = args[0]?.toLowerCase();
  const themeName = getThemeName(remoteJid);
  const photo = getThemePhoto(remoteJid);

  if (option === "on") {
    antilinkGroups.set(remoteJid, "on");
    return await sendThemedMessage(client, remoteJid, photo, `╭━〔 🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊 〕━⬣
┃ ✅ Anti-lien *ACTIVÉ* !
┃ 🚫 Les liens seront supprimés
┃ ⚠️ + avertissement envoyé
┃ 🎨 Thème : ${themeName}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);

  } else if (option === "war") {
    antilinkGroups.set(remoteJid, "war");
    return await sendThemedMessage(client, remoteJid, photo, `╭━〔 🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊 〕━⬣
┃ ⚔️ Mode *WAR ACTIVÉ* !
┃ 💀 Tout lien = expulsion directe
┃ 🚫 Aucun avertissement !
┃ 🎨 Thème : ${themeName}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);

  } else if (option === "off") {
    antilinkGroups.delete(remoteJid);
    return await sendThemedMessage(client, remoteJid, photo, `╭━〔 🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊 〕━⬣
┃ ❌ Anti-lien *DÉSACTIVÉ*
┃ 🎨 Thème : ${themeName}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);

  } else {
    const mode = antilinkGroups.get(remoteJid);
    const statut = !mode ? "❌ DÉSACTIVÉ" : mode === "war" ? "⚔️ WAR" : "✅ ON";
    return await sendThemedMessage(client, remoteJid, photo, `╭━〔 🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊 〕━⬣
┃ 📊 Mode actuel : *${statut}*
┣━━━━━━━━━━━━━━━━━━━━⬣
┃ 📌 *.antilink on* → supprime le lien
┃ 📌 *.antilink war* → supprime + expulse
┃ 📌 *.antilink off* → désactiver
┃ 🎨 Thème : ${themeName}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }
}

// ─── Handler appelé depuis handler.js sur chaque message ───
export async function handleAntiLink(message, client) {
  const remoteJid = message.key.remoteJid;

  if (!remoteJid.endsWith("@g.us")) return;

  const mode = antilinkGroups.get(remoteJid);
  if (!mode) return;

  // Récupère le texte du message
  const texte =
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    message.message?.imageMessage?.caption ||
    message.message?.videoMessage?.caption ||
    "";

  if (!contiensLien(texte)) return;

  // Infos expéditeur
  const senderJid = message.key.participant || message.key.remoteJid;
  if (message.key.fromMe) return; // Ignore les messages du bot lui-même

  const senderNumero = getNumero(senderJid);
  const themeName = getThemeName(remoteJid);
  const photo = getThemePhoto(remoteJid);

  try {
    const meta = await client.groupMetadata(remoteJid);
    const botNumero = getNumero(client.user.id);

    // Ignore si l'expéditeur est admin
    const senderInfo = meta.participants.find(p => getNumero(p.id) === senderNumero);
    const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";
    if (estAdmin) return;

    // ─── Supprime le message ───
    try {
      await client.sendMessage(remoteJid, {
        delete: message.key
      });
    } catch (e) {
      console.log("❌ Impossible de supprimer le message:", e.message);
    }

    if (mode === "on") {
      // ─── Mode ON : avertissement ───
      await sendThemedMessage(client, remoteJid, photo, `╭━〔 🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊 〕━⬣
┃ ⚠️ @${senderNumero} !
┃ 🚫 Les liens sont *interdits* ici !
┃ 📌 Prochaine fois = expulsion !
┃ 🎨 Thème : ${themeName}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [senderJid]);

    } else if (mode === "war") {
      // ─── Mode WAR : expulsion directe ───
      await sendThemedMessage(client, remoteJid, photo, `╭━〔 ⚔️ 𝐖𝐀𝐑 𝐌𝐎𝐃𝐄 〕━⬣
┃ 💀 @${senderNumero} *EXPULSÉ* !
┃ 🔗 Lien envoyé = sortie directe !
┃ 🚫 Aucun avertissement ici !
┃ 🎨 Thème : ${themeName}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [senderJid]);

      await new Promise(r => setTimeout(r, 500));

      try {
        await client.groupParticipantsUpdate(remoteJid, [senderJid], "remove");
        console.log(`✅ Expulsé (lien en mode war) : ${senderJid}`);
      } catch (e) {
        console.log("❌ Impossible d'expulser:", e.message);
      }
    }

  } catch (err) {
    console.error("Erreur handleAntiLink:", err.message);
  }
}