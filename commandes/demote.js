// commands/demote.js
import config from "../config.js";

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

export default async function demoteCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄 〕━⬣\n┃ ❌ Uniquement dans un groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> 🔗 Voir la chaîne : ${config.Channel}`
    }, { quoted: message });
  }

  try {
    const meta = await client.groupMetadata(remoteJid);
    const senderJid = message.key.participant || message.key.remoteJid;
    const senderNumero = getNumero(senderJid);
    const senderInfo = meta.participants.find(p => getNumero(p.id) === senderNumero);
    const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";

    if (!estAdmin) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄 〕━⬣\n┃ ❌ Réservé aux *admins du groupe* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> 🔗 Voir la chaîne : ${config.Channel}`
      }, { quoted: message });
    }

    // Récupère la cible
    const ctx = message.message?.extendedTextMessage?.contextInfo;
    const mentions = ctx?.mentionedJid || [];
    let cibleJid = null;

    if (ctx?.participant) {
      cibleJid = ctx.participant;
    } else if (mentions.length > 0) {
      cibleJid = mentions[0];
    } else if (args[0]) {
      cibleJid = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    }

    if (!cibleJid) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄 〕━⬣\n┃ ❌ Mentionne quelqu'un ou réponds\n┃ 📌 Ex: *.demote @personne*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> 🔗 Voir la chaîne : ${config.Channel}`
      }, { quoted: message });
    }

    const cibleNumero = getNumero(cibleJid);
    const cibleInfo = meta.participants.find(p => getNumero(p.id) === cibleNumero);

    if (!cibleInfo) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄 〕━⬣\n┃ ❌ Membre introuvable dans le groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> 🔗 Voir la chaîne : ${config.Channel}`
      }, { quoted: message });
    }

    if (!cibleInfo.admin) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄 〕━⬣\n┃ ⚠️ @${cibleNumero} n'est pas *admin* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> 🔗 Voir la chaîne : ${config.Channel}`,
        mentions: [cibleInfo.id]
      }, { quoted: message });
    }

    // Pas se dénommer soi-même
    if (getNumero(cibleInfo.id) === senderNumero) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄 〕━⬣\n┃ 😂 Tu ne peux pas te dénommer toi-même !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> 🔗 Voir la chaîne : ${config.Channel}`
      }, { quoted: message });
    }

    await client.groupParticipantsUpdate(remoteJid, [cibleInfo.id], "demote");

    await client.sendMessage(remoteJid, {
      text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄 〕━⬣\n┃ ✅ @${cibleNumero} n'est plus *admin* !\n┃ 👑 Dev : ${config.nameCreator}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> 🔗 Voir la chaîne : ${config.Channel}`,
      mentions: [cibleInfo.id]
    }, { quoted: message });

  } catch (err) {
    console.error("Erreur demoteCommand:", err.message);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄 〕━⬣\n┃ ⚠️ Erreur : ${err.message}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> 🔗 Voir la chaîne : ${config.Channel}`
    }, { quoted: message });
  }
}
