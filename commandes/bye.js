// commands/bye.js
import config from "../config.js";
import { sendThemedText } from "./theme.js";

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

export default async function byeCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  if (!remoteJid.endsWith("@g.us")) {
    return await sendThemedText(client, remoteJid, `╭━〔 👋 𝐁𝐘𝐄 〕━⬣\n┃ ❌ Uniquement dans un groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  try {
    const metadata = await client.groupMetadata(remoteJid);
    const senderJid = message.key.participant || message.key.remoteJid;
    const senderNumero = getNumero(senderJid);
    const senderInfo = metadata.participants.find(p => getNumero(p.id) === senderNumero);
    const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";
    const botJid = client.user.id;
    const botNumero = getNumero(botJid);
    const botInfo = metadata.participants.find(p => getNumero(p.id) === botNumero);
    const botEstAdmin = botInfo?.admin === "admin" || botInfo?.admin === "superadmin";

    const raison = args.join(" ") || "Aucune raison donnée";

    // Message d'au revoir
    const goodbyeMsg = `╭━〔 👋 𝐀𝐔 𝐑𝐄𝐕𝐎𝐈𝐑 〕━⬣
┃
┃ 😢 @${senderNumero} quitte le groupe !
┃
┣━━〔 📝 𝐑𝐀𝐈𝐒𝐎𝐍 〕━⬣
┃
┃ 📌 ${raison}
┃
┣━━〔 📊 𝐈𝐍𝐅𝐎𝐒 〕━⬣
┃ 🏠 Groupe : ${metadata.subject}
┃ 👥 Membres restants : ${metadata.participants.length - 1}
┃ 🤖 Bot : ${config.BotName}
┃ 👑 Dev : ${config.nameCreator}
┃
╰━━〔 ⚡ 𝐍𝐎 𝐍𝐀𝐌𝐄 𝐌𝐃 〕━⬣`;

    await sendThemedText(client, remoteJid, goodbyeMsg, [senderJid], message);

    // Petit délai avant de quitter
    await new Promise(r => setTimeout(r, 1500));

    // Quitter le groupe
    await client.groupLeave(remoteJid);
    console.log(`✅ Bot a quitté le groupe ${metadata.subject} (${remoteJid}) sur demande de ${senderNumero}`);

  } catch (err) {
    console.error("Erreur byeCommand:", err.message);
    
    // Si le bot n'est pas admin ou autre erreur
    if (err.message.includes("not-authorized")) {
      await sendThemedText(client, remoteJid, `╭━〔 👋 𝐁𝐘𝐄 〕━⬣
┃ 
┃ ❌ Impossible de quitter !
┃ 🔒 Le bot n'a pas les autorisations
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
    } else {
      await sendThemedText(client, remoteJid, `╭━〔 👋 𝐁𝐘𝐄 〕━⬣
┃ 
┃ ❌ Erreur : ${err.message}
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
    }
  }
}