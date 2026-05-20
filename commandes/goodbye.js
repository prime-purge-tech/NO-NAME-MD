// commands/goodbye.js
import config from "../config.js";
import { getThemePhoto, getThemeStyle, formatThemedMessage, goodbyeGroups } from "./theme.js";

export default async function goodbyeCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;
  const style = getThemeStyle(remoteJid);

  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, { text: `❌ Uniquement dans un groupe !` }, { quoted: message });
  }

  const meta = await client.groupMetadata(remoteJid);
  const senderJidBrut = message.key.participant || message.key.remoteJid;
  const senderNumero = senderJidBrut.replace(/@.+/, "").replace(/:.*/, "");
  const senderInfo = meta.participants.find(p => p.id.replace(/@.+/, "").replace(/:.*/, "") === senderNumero);
  const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";

  const option = args[0]?.toLowerCase();

  if (option === "on" || option === "off") {
    if (!estAdmin) {
      return await client.sendMessage(remoteJid, { text: `❌ Seul un *admin* peut activer/désactiver !` }, { quoted: message });
    }
    if (option === "on") {
      goodbyeGroups.set(remoteJid, true);
      await client.sendMessage(remoteJid, { text: formatThemedMessage(remoteJid, "GOODBYE", ["✅ Message d'au revoir ACTIVÉ !"]) }, { quoted: message });
    } else if (option === "off") {
      goodbyeGroups.delete(remoteJid);
      await client.sendMessage(remoteJid, { text: formatThemedMessage(remoteJid, "GOODBYE", ["❌ Message d'au revoir DÉSACTIVÉ"]) }, { quoted: message });
    }
    return;
  }

  const statut = goodbyeGroups.has(remoteJid) ? "✅ ACTIVÉ" : "❌ DÉSACTIVÉ";
  await client.sendMessage(remoteJid, { text: formatThemedMessage(remoteJid, "GOODBYE", [`📊 Statut : ${statut}`, "📌 .goodbye on pour activer (admin)", "📌 .goodbye off pour désactiver (admin)"]) }, { quoted: message });
}

export async function goodbyeHandler(groupJid, participants, client) {
  if (!goodbyeGroups.has(groupJid)) return;

  try {
    const photo = getThemePhoto(groupJid);
    const style = getThemeStyle(groupJid);
    let groupName = "le groupe";
    try {
      const meta = await client.groupMetadata(groupJid);
      groupName = meta.subject || "le groupe";
    } catch (_) {}

    for (const participant of participants) {
      const number = participant.replace(/[^0-9]/g, "");
      
      const goodbyeText = formatThemedMessage(groupJid, "AU REVOIR", [
        `👋 @${number} nous a quitté...`,
        `🏠 Groupe : ${groupName}`,
        `😔 On te souhaite bonne route !`,
        `🌟 Tu resteras dans nos cœurs`,
        `🔄 Reviens quand tu veux !`,
        `👑 Dev : ${config.nameCreator}`
      ]);
      
      await client.sendMessage(groupJid, {
        image: { url: photo },
        caption: goodbyeText,
        mentions: [participant],
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
    }
  } catch (err) {
    console.error("Erreur goodbyeHandler:", err);
  }
}