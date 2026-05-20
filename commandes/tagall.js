// commands/tagall.js
import config from "../config.js";

// --- 5 Photos ---
const photos = [
  "https://jpcdn.it/img/10c0452317fd17d5b2823646e5ad0c02.jpg",
  "https://jpcdn.it/img/cee15a8323b24bd4053a15dc6c9898f6.jpg",
  "https://jpcdn.it/img/daa3cc2479bb283a202c9cacc5b1cdac.jpg",
  "https://jpcdn.it/img/467a5e29d65f902a4d4ccad28a7b2171.jpg",
  "https://jpcdn.it/img/2be905ddc26aac4f10782e5ae54274c6.jpg",
];

export default async function tagallCommand(message, client) {
  try {
    const remoteJid = message.key.remoteJid;
    const metadata = await client.groupMetadata(remoteJid).catch(() => null);
    if (!metadata) return client.sendMessage(remoteJid, { text: "❌ Cette commande ne fonctionne que dans un groupe." });

    let i = 1;
    const members = metadata.participants.map(p => `┃ ✞︎ *${i++}.* @${p.id.split("@")[0]}`).join("\n");

    const caption = `
╭━〔 👥 𝐓𝐀𝐆 𝐀𝐋𝐋 〕━⬣
┃ 📛 𝗕𝗼𝘁 : NO NAME MD
┃ 👑 𝗗𝗲𝘃 : ${config.nameCreator}
┃ 👥 𝗠𝗲𝗺𝗯𝗿𝗲𝘀 : ${metadata.participants.length}
┣━━〔 📋 𝗟𝗜𝗦𝗧𝗘 〕━⬣
${members}
╰━━〔𝗡𝗢 𝗡𝗔𝗠𝗘 𝗠𝗗〕━⬣
> ${config.nameCreator}`;

    // Photo aléatoire
    const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
    await client.sendMessage(remoteJid, {
      image: { url: randomPhoto },
      caption,
      mentions: metadata.participants.map(p => p.id)
    });

  } catch (err) {
    console.error("Erreur tagall:", err);
    await client.sendMessage(message.key.remoteJid, { text: "⚠️ Erreur lors du tagall." });
  }
}
