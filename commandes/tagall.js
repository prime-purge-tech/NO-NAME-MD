// commands/tagall.js
import config from "../config.js";
import { getThemePhoto, getThemeStyle, formatThemedMessage } from "./theme.js";

export default async function tagallCommand(message, client) {
  try {
    const remoteJid = message.key.remoteJid;
    const metadata = await client.groupMetadata(remoteJid).catch(() => null);
    if (!metadata) return client.sendMessage(remoteJid, { text: "❌ Cette commande ne fonctionne que dans un groupe." });

    const style = getThemeStyle(remoteJid);
    const photo = getThemePhoto(remoteJid);
    
    let i = 1;
    const membersList = metadata.participants.map(p => `${style.item} *${i++}.* @${p.id.split("@")[0]}`).join("\n");

    const extraInfo = {
      botName: config.BotName,
      dev: config.nameCreator,
      theme: style.nom,
      members: metadata.participants.length
    };
    
    const caption = formatThemedMessage(remoteJid, "TAG ALL", [membersList], extraInfo);

    await client.sendMessage(remoteJid, {
      image: { url: photo },
      caption: caption,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: config.Newsletter,
          newsletterName: config.BotName,
          serverMessageId: 143
        },
        mentionedJid: metadata.participants.map(p => p.id)
      }
    }, { quoted: message });

  } catch (err) {
    console.error("Erreur tagall:", err);
    await client.sendMessage(message.key.remoteJid, { text: "⚠️ Erreur lors du tagall." });
  }
}