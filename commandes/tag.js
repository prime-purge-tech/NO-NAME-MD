// commands/tag.js
import config from "../config.js";
import { sendThemedText } from "./theme.js";

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

export default async function tagCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  if (!remoteJid.endsWith("@g.us")) {
    return await sendThemedText(client, remoteJid, `╭━〔 📢 𝐓𝐀𝐆 〕━⬣\n┃ ❌ Uniquement dans un groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  try {
    const metadata = await client.groupMetadata(remoteJid);
    const senderJid = message.key.participant || message.key.remoteJid;
    const senderNumero = getNumero(senderJid);

    const mentionText = args.join(" ") || "📢 Message important !";

    // Taguer TOUS les membres
    const tousLesMembres = metadata.participants.map(p => p.id);
    const mentionsText = tousLesMembres.map(j => `@${getNumero(j)}`).join(" ");

    const caption = `╭━〔 📢 𝐓𝐀𝐆 𝐆𝐄𝐍𝐄𝐑𝐀𝐋 〕━⬣
┃
┃ ${mentionsText}
┃
┣━━〔 💬 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 〕━⬣
┃
┃ 📌 ${mentionText}
┃
┣━━〔 📊 𝐈𝐍𝐅𝐎𝐒 〕━⬣
┃ 👥 Membres : ${metadata.participants.length}
┃ 👑 Admin : @${senderNumero}
┃ 🤖 Bot : ${config.BotName}
┃
╰━━〔 ⚡ 𝐍𝐎 𝐍𝐀𝐌𝐄 𝐌𝐃 〕━⬣`;

    await sendThemedText(client, remoteJid, caption, tousLesMembres, message);

  } catch (err) {
    console.error("Erreur tagCommand:", err);
    await sendThemedText(client, remoteJid, `╭━〔 📢 𝐓𝐀𝐆 〕━⬣\n┃ ⚠️ Erreur : ${err.message}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }
}