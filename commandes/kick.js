// commands/kick.js
import config from "../config.js";

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

export default async function kickCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  // ─── Groupe uniquement ───
  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ❌ Uniquement dans un groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    }, { quoted: message });
  }

  const meta = await client.groupMetadata(remoteJid);

  // ─── Vérif : l'expéditeur est admin ───
  const senderJid = message.key.participant || message.key.remoteJid;
  const senderNumero = getNumero(senderJid);
  const senderInfo = meta.participants.find(p => getNumero(p.id) === senderNumero);
  const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";

  if (!estAdmin) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ❌ Réservé aux *admins du groupe* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    }, { quoted: message });
  }

  // ─── Récupère la cible ───
  // Priorité : 1) réponse à un message  2) mention @  3) numéro en argument
  let cibleJid = null;

  const contextInfo = message.message?.extendedTextMessage?.contextInfo;
  const quotedParticipant = contextInfo?.participant;
  const mentions = contextInfo?.mentionedJid || [];

  if (quotedParticipant) {
    cibleJid = quotedParticipant;
  } else if (mentions.length > 0) {
    cibleJid = mentions[0];
  } else if (args[0]) {
    const num = args[0].replace(/[^0-9]/g, "");
    cibleJid = num + "@s.whatsapp.net";
  }

  if (!cibleJid) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ❌ Mentionne quelqu'un ou réponds\n┃ à son message !\n┃ 📌 Ex: *.kick @personne*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    }, { quoted: message });
  }

  const cibleNumero = getNumero(cibleJid);
  const botNumero = getNumero(client.user.id);

  // ─── Pas s'expulser soi-même ───
  if (cibleNumero === senderNumero) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ 😂 Tu ne peux pas t'expulser toi-même !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    }, { quoted: message });
  }

  // ─── Pas expulser le bot ───
  if (cibleNumero === botNumero) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ 😂 Tu ne peux pas m'expulser !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    }, { quoted: message });
  }

  // ─── Vérif : la cible est dans le groupe ───
  const cibleInfo = meta.participants.find(p => getNumero(p.id) === cibleNumero);
  if (!cibleInfo) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ❌ Ce membre n'est pas dans le groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    }, { quoted: message });
  }

  // ─── Pas expulser un autre admin ───
  const cibleEstAdmin = cibleInfo?.admin === "admin" || cibleInfo?.admin === "superadmin";
  if (cibleEstAdmin) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ❌ Tu ne peux pas expulser un *admin* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    }, { quoted: message });
  }

  // ─── Expulsion ───
  try {
    await client.groupParticipantsUpdate(remoteJid, [cibleInfo.id], "remove");

    await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ✅ @${cibleNumero} a été expulsé !\n┃ 🚪 Au revoir gros con...\n┃ 👑 Dev : ${config.nameCreator}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`,
      mentions: [cibleInfo.id]
    }, { quoted: message });

  } catch (err) {
    console.error("Erreur kickCommand:", err.message);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ⚠️ Impossible d'expulser @${cibleNumero}\n┃ Vérifie que le bot est *admin* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`,
      mentions: [cibleInfo.id]
    }, { quoted: message });
  }
}
