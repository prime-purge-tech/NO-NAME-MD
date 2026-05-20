// commands/demoteall.js - Rétrograder TOUS les admins (sauf le bot)
import config from "../config.js";

// Image pour la commande demoteall
const DEMOTE_IMAGE = "https://www.image2url.com/r2/default/images/1776184942622-40a7c354-fdc3-46c3-8c26-d4ba5e8c9442.jpg";

function getNumero(jid = "") {
  return jid.replace(/[^0-9]/g, "");
}

export default async function demoteallCommand(message, client) {
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
  const botJid = client.user.id.split(":")[0] + "@s.whatsapp.net";
  
  // Récupérer TOUS les admins SAUF le bot
  const aRetrograder = participants.filter(p => {
    const jid = p.id;
    const estAdmin = (p.admin === "admin" || p.admin === "superadmin");
    return estAdmin && jid !== botJid;
  });
  
  if (aRetrograder.length === 0) {
    await client.sendMessage(remoteJid, {
      text: `╭━〔 ℹ️ INFO 〕━⬣
┃ Aucun admin à rétrograder !
┃ (Seul le bot est admin)
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
    return;
  }
  
  // Liste des admins à rétrograder (pour l'affichage)
  let listeAdmins = "";
  for (const admin of aRetrograder) {
    listeAdmins += `┃ 🤡 @${getNumero(admin.id)}\n`;
  }
  
  // Envoyer avec image et tag des concernés
  await client.sendMessage(remoteJid, {
    image: { url: DEMOTE_IMAGE },
    caption: `╭━〔 👑 DEMOTE ALL 〕━⬣
┃ 
┃ 🔴 ${aRetrograder.length} admin(s) à rétrograder :
┃ 
${listeAdmins}
┃ 🔄 Rétrogradation de TOUS les admins...
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`,
    mentions: aRetrograder.map(a => a.id)
  });
  
  let succes = 0;
  let echecs = 0;
  const echecsListe = [];
  
  for (let i = 0; i < aRetrograder.length; i++) {
    const participant = aRetrograder[i];
    const jid = participant.id;
    
    try {
      await client.groupParticipantsUpdate(remoteJid, [jid], "demote");
      succes++;
      
      if ((i + 1) % 5 === 0 || i + 1 === aRetrograder.length) {
        await client.sendMessage(remoteJid, {
          text: `📊 Progression : ${succes + echecs}/${aRetrograder.length} | ✅ ${succes} | ❌ ${echecs}`
        });
      }
      
    } catch (err) {
      echecs++;
      echecsListe.push(getNumero(jid));
      console.log(`❌ Échec rétrogradation ${jid}:`, err.message);
    }
    
    await delay(1500);
  }
  
  let resultText = `╭━〔 👑 DEMOTE ALL - TERMINÉ 〕━⬣
┃ 
┃ ✅ Rétrogradations réussies : ${succes}
┃ ❌ Échecs : ${echecs}
┃ 📊 Total : ${aRetrograder.length}
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
  
  resultText += `┃ 👑 TOUS ces membres ne sont plus admins !
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
  
  await client.sendMessage(remoteJid, { text: resultText });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}