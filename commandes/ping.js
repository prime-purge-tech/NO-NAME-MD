// commands/ping.js
import config from "../config.js";
import { sendThemedText } from "./theme.js";

export default async function pingCommand(message, client) {
  const remoteJid = message.key.remoteJid;
  const start = Date.now();

  await sendThemedText(client, remoteJid, "_🏓 Pong..._", [], message);

  const latency = Date.now() - start;

  await sendThemedText(client, remoteJid, `╭━〔 🦩 ${config.BotName} 〕━⬣
┃ 🏓 *PING / PONG*
┣━━〔 📡 STATS 〕━⬣
┃ ❏ Latence : *${latency} ms*
┃ ❏ Statut : *🟢 Connecté*
┃ ❏ Bot : *${config.BotName}*
╰━━〔 *PRIME PURGE TECH*〕━⬣`, [], message);
}