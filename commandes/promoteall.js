// commands/promoteall.js - Promouvoir tous les membres (sans confirmation)
import config from "../config.js";

// Image pour la commande promoteall
const PROMOTE_IMAGE = "https://www.image2url.com/r2/default/images/1776184942622-40a7c354-fdc3-46c3-8c26-d4ba5e8c9442.jpg";

export default async function promoteallCommand(message, client) {
  const remoteJid = message.key.remoteJid;
  const isGroup = remoteJid.endsWith("@g.us");
  const sender = message.key.participant || message.key.remoteJid;
  
  if (!isGroup) {
    await client.sendMessage(remoteJid, {
      text: `╭━〔 ❌ ERREUR 〕━⬣
┃ Cette commande n'est disponible
┃ qu'en GROUPE !
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
    return;
  }
  
  let groupMetadata;
  try {
    groupMetadata = await client.groupMetadata(remoteJid);
  } catch (err) {
    await client.sendMessage(remoteJid, {
      text: `╭━〔 ❌ ERREUR 〕━⬣
┃ Impossible de récupérer les infos
┃ du groupe : ${err.message}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
    return;
  }
  
  const participants = groupMetadata.participants;
  const senderJid = sender;
  
  const senderIsAdmin = participants.some(p => 
    p.id === senderJid && (p.admin === "admin" || p.admin === "superadmin")
  );
  
  if (!senderIsAdmin) {
    await client.sendMessage(remoteJid, {
      text: `╭━〔 ⛔ PERMISSION 〕━⬣
┃ Seuls les admins du groupe
┃ peuvent utiliser cette commande !
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
    return;
  }
  
  const aPromouvoir = participants.filter(p => p.admin !== "admin" && p.admin !== "superadmin");
  
  if (aPromouvoir.length === 0) {
    await client.sendMessage(remoteJid, {
      text: `╭━〔 ✅ DÉJÀ FAIT 〕━⬣
┃ Tous les membres sont déjà admins !
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
    return;
  }
  
  // Envoyer avec image
  await client.sendMessage(remoteJid, {
    image: { url: PROMOTE_IMAGE },
    caption: `╭━〔 👑 PROMOTE ALL 〕━⬣
┃ 
┃ 🔄 Promotion de ${aPromouvoir.length} membres...
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
  });
  
  let succes = 0;
  let echecs = 0;
  const echecsListe = [];
  
  for (let i = 0; i < aPromouvoir.length; i++) {
    const participant = aPromouvoir[i];
    const jid = participant.id;
    
    try {
      await client.groupParticipantsUpdate(remoteJid, [jid], "promote");
      succes++;
      
      if ((i + 1) % 5 === 0 || i + 1 === aPromouvoir.length) {
        await client.sendMessage(remoteJid, {
          text: `📊 Progression : ${succes + echecs}/${aPromouvoir.length} | ✅ ${succes} | ❌ ${echecs}`
        });
      }
      
    } catch (err) {
      echecs++;
      echecsListe.push(jid.split("@")[0]);
    }
    
    await delay(1500);
  }
  
  let resultText = `╭━〔 👑 PROMOTE ALL - TERMINÉ 〕━⬣
┃ 
┃ ✅ Promotions réussies : ${succes}
┃ ❌ Échecs : ${echecs}
┃ 📊 Total : ${aPromouvoir.length}
┃ 
`;
  
  if (echecsListe.length > 0) {
    resultText += `┃ ⚠️ Échec pour :\n┃ `;
    for (let i = 0; i < Math.min(echecsListe.length, 10); i++) {
      resultText += `${echecsListe[i]}${i < Math.min(echecsListe.length, 10) - 1 ? ", " : ""}`;
    }
    if (echecsListe.length > 10) {
      resultText += ` et ${echecsListe.length - 10} autre(s)`;
    }
    resultText += `\n┃ \n`;
  }
  
  resultText += `┃ 👑 Tous ces membres sont maintenant admins !
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
  
  await client.sendMessage(remoteJid, { text: resultText });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}