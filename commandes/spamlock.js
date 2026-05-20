// commands/spamlock.js
import config from "../config.js";
import { getThemePhoto, THEMES, groupThemes } from "./theme.js";

export default async function spamlockCommand(message, client, context) {
  try {
    const { sender, args, isOwner } = context;
    const remoteJid = message.key.remoteJid;1

    if (!isOwner) {
      return client.sendMessage(remoteJid, {
        text: "❌ *Réservé au propriétaire*"
      }, { quoted: message });
    }

    let target = args[0];
    if (!target) {
      return client.sendMessage(remoteJid, {
        text: "❌ *Usage :* `.spamlock <numéro>`"
      }, { quoted: message });
    }

    // Nettoyage du numéro
    target = target.replace(/[^0-9]/g, "");
    if (!target.endsWith("@s.whatsapp.net")) target += "@s.whatsapp.net";

    const count = 100;
    const themeName = groupThemes.get(remoteJid) || "yuta";
    const theme = THEMES[themeName];
    const emoji = theme?.emoji || "⚡";

    // Message de lancement
    await client.sendMessage(remoteJid, {
      image: { url: getThemePhoto(remoteJid) },
      caption: `╭━〔 ${emoji} 𝐍𝐎 𝐍𝐀𝐌𝐄 𝐌𝐃 〕━⬣
┃ 📛 𝗕𝗼𝘁     : NO NAME MD
┃ 👑 𝗗𝗲𝘃     : PRIME PURGE
┣━━〔 🔒 𝗦𝗣𝗔𝗠𝗟𝗢𝗖𝗞 〕━⬣
┃ ❏ 𝗖𝗶𝗯𝗹𝗲  : ${target.split("@")[0]}
┃ ❏ 𝗖𝘆𝗰𝗹𝗲𝘀 : ${count}
┃ ❏ 𝗦𝘁𝗮𝘁𝘂𝘀 : 🔄 𝗘𝗻 𝗰𝗼𝘂𝗿𝘀...
╰━━〔 ${emoji} 𝐍𝐎 𝐍𝐀𝐌𝐄 𝐌𝐃 〕━⬣`,
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

    let success = 0;
    let errors = 02

    for (let i = 1; i <= count; i++) {
      try {
        await client.updateBlockStatus(target, "block");
        await new Promise(r => setTimeout(r, 150));
        await client.updateBlockStatus(target, "unblock");
        await new Promise(r => setTimeout(r, 200));
        success++;

        if (i % 10 === 0) {
          console.log(`[spamlock] ${i}/${count} cycles`);
        }
      } catch (err) {
        errors++;
        console.error(`[spamlock] Erreur cycle ${i}:`, err.message);
        if (errors >= 5) {
          await client.sendMessage(remoteJid, {
            text: `╭━〔 ${emoji} 𝐍𝐎 𝐍𝐀𝐌𝐄 𝐌𝐃 〕━⬣
┃ ❌ 𝗘𝗿𝗿𝗲𝘂𝗿
┃ 𝗖𝘆𝗰𝗹𝗲𝘀 : ${success}/${count}
┃ 𝗘𝗿𝗿𝗲𝘂𝗿𝘀 : ${errors}
┃ 𝗥𝗮𝗶𝘀𝗼𝗻 : ${err.message}
╰━━〔 ${emoji} 𝐍𝐎 𝐍𝐀𝐌𝐄 𝐌𝐃 〕━⬣`
          });
          return;
        }
      }
    }

    // Résultat final
    await client.sendMessage(remoteJid, {
      image: { url: getThemePhoto(remoteJid) },
      caption: `╭━〔 ${emoji} 𝐍𝐎 𝐍𝐀𝐌𝐄 𝐌𝐃 〕━⬣
┃ 📛 𝗕𝗼𝘁     : NO NAME MD
┃ 👑 𝗗𝗲𝘃     : PRIME PURGE
┣━━〔 ✅ 𝗦𝗣𝗔𝗠𝗟𝗢𝗖𝗞 𝗧𝗘𝗥𝗠𝗜𝗡𝗘́ 〕━⬣
┃ ❏ 𝗖𝗶𝗯𝗹𝗲  : ${target.split("@")[0]}
┃ ❏ 𝗥𝗲́𝘂𝘀𝘀𝗶𝘀 : ${success}/${count}
┃ ❏ 𝗘𝗿𝗿𝗲𝘂𝗿𝘀 : ${errors}
╰━━〔 ${emoji} 𝐍𝐎 𝐍𝐀𝐌𝐄 𝐌𝐃 〕━⬣`,
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

  } catch (err) {
    console.error("Erreur spamlockCommand:", err.message);
  }
}

export const spamlockCommand = async (message, client, context) => {
  await spamlockCommand(message, client, context);
};1
