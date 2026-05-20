// commands/repo.js
import config from "../config.js";
import { getThemePhoto, getThemeName, sendThemedMessage, sendThemedText } from "./theme.js";

export default async function repoCommand(message, client) {
  const remoteJid = message.key.remoteJid;
  const themeName = getThemeName(remoteJid);
  const photo = getThemePhoto(remoteJid);

  const texte = `╭━━〔 🚀 𝐑𝐄𝐏𝐎 〕━⬣
┃
┃  ⚡ *DÉPLOIE TON BOT EN 30 SEC*
┃
┣━〔 🔗  𝐂𝐎𝐍𝐍𝐄𝐗𝐈𝐎𝐍 〕━⬣
┃
┃  🌐 *Site Web :*
┃  https://panel.primeeedeath.site:3011/
┃
┣━〔 📣 𝐑𝐄𝐒𝐄𝐀𝐔𝐗 〕━⬣
┃
┃  ✈️ *Telegram Dev :*
┃  https://t.me/dev_no_namee
┃
┃  ✈️ *Telegram Tech :*
┃  https://t.me/prime_purge_tech
┃
┃  📲 *WhatsApp Chaîne :*
┃  ${config.Channel}
┃
┣━〔 👑 𝐂𝐑𝐄𝐀𝐓𝐄𝐔𝐑 〕━⬣
┃
┃  🧠 *Owner :* ${config.nameCreator}
┃  ⚡ *Bot :* ${config.BotName}
┃  💀 *Version :* 1.0.0
┃  🎨 *Thème :* ${themeName}
┃
┣〔 📌 𝐌𝐎𝐃𝐄 𝐃'𝐄𝐌𝐏𝐋𝐎𝐈 〕━⬣
┃
┃  1️⃣ Ouvre le lien ci-dessus
┃  2️⃣ Entre ton numéro WhatsApp
┃  3️⃣ Saisis le code dans WhatsApp
┃  4️⃣ Ton bot est actif ! 🎉
┃
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> _le pouvoir peut être avec toi si tu veux_.`;

  await sendThemedMessage(client, remoteJid, photo, texte, [], message);
}