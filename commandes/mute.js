// commands/mute.js
import config from "../config.js";
import { getThemePhoto, getThemeStyle, formatThemedMessage, sendThemedMessage, sendThemedText } from "./theme.js";

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

export default async function muteCommand(message, client) {
  const remoteJid = message.key.remoteJid;
  const photo = getThemePhoto(remoteJid);
  const style = getThemeStyle(remoteJid);

  if (!remoteJid.endsWith("@g.us")) {
    return await sendThemedMessage(client, remoteJid, photo, formatThemedMessage(remoteJid, "MUTE", ["❌ Uniquement dans un groupe !"]), [], message);
  }

  try {
    const meta = await client.groupMetadata(remoteJid);
    const senderJid = message.key.participant || message.key.remoteJid;
    const senderNumero = getNumero(senderJid);
    const senderInfo = meta.participants.find(p => getNumero(p.id) === senderNumero);
    const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";

    if (!estAdmin) {
      return await sendThemedMessage(client, remoteJid, photo, formatThemedMessage(remoteJid, "MUTE", ["❌ Réservé aux *admins du groupe* !"]), [], message);
    }

    await client.groupSettingUpdate(remoteJid, "announcement");

    await sendThemedMessage(client, remoteJid, photo, formatThemedMessage(remoteJid, "MUTE", [
      "✅ Groupe *muté* !",
      "🔒 Seuls les admins peuvent écrire",
      `👑 Dev : ${config.nameCreator}`
    ]), [], message);

  } catch (err) {
    console.error("Erreur muteCommand:", err.message);
    await sendThemedMessage(client, remoteJid, photo, formatThemedMessage(remoteJid, "MUTE", [
      `⚠️ Erreur : ${err.message}`,
      "Vérifie que le bot est *admin* !"
    ]), [], message);
  }
}