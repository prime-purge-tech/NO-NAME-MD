// commands/noname.js - Rendre une personne muette (pouvoir de NO NAME)
import config from "../config.js";

// Stockage des utilisateurs muets par groupe
// Map: groupJid -> Map{ userJid -> {reason, date} }
const mutedUsers = new Map();

// Image pour la commande
const NONAME_IMAGE = "https://www.image2url.com/r2/default/images/1776184942622-40a7c354-fdc3-46c3-8c26-d4ba5e8c9442.jpg";

function getNumero(jid = "") {
  return jid.replace(/[^0-9]/g, "");
}

function bold(text) {
  return `*${text}*`;
}

// Sauvegarder les muets
import fs from "fs";
import path from "path";
const MUTED_FILE = path.join(process.cwd(), "noname_muted.json");

function saveMutedUsers() {
  const data = {};
  for (const [group, users] of mutedUsers) {
    data[group] = {};
    for (const [user, info] of users) {
      data[group][user] = info;
    }
  }
  fs.writeFileSync(MUTED_FILE, JSON.stringify(data, null, 2));
}

function loadMutedUsers() {
  if (fs.existsSync(MUTED_FILE)) {
    const data = JSON.parse(fs.readFileSync(MUTED_FILE, "utf-8"));
    for (const [group, users] of Object.entries(data)) {
      const userMap = new Map();
      for (const [user, info] of Object.entries(users)) {
        userMap.set(user, info);
      }
      mutedUsers.set(group, userMap);
    }
  }
}
loadMutedUsers();

export default async function nonameCommand(message, client, { args }) {
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
  
  // Vérifier si l'utilisateur est admin
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
  const senderIsAdmin = participants.some(p => 
    p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
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
  
  const subCommand = args[0]?.toLowerCase();
  const target = args[1]?.replace(/[^0-9]/g, "");
  
  // === .noname list ===
  if (subCommand === "list") {
    const muted = mutedUsers.get(remoteJid);
    if (!muted || muted.size === 0) {
      await client.sendMessage(remoteJid, {
        text: `╭━〔 🔇 LISTE DES MUETS 〕━⬣
┃ 
┃ ⚠️ Aucune personne muette dans ce groupe
┃ 
┃ 📌 .noname @user
┃ 📌 .noname remove @user
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
      });
    } else {
      let listText = `╭━〔 🔇 NO NAME - MUETS 〕━⬣\n┃\n`;
      let i = 1;
      for (const [user, info] of muted) {
        listText += `┃ ${i++}. @${getNumero(user)}\n`;
        listText += `┃    👑 Par: @${getNumero(info.by)}\n`;
        listText += `┃    📅 Le: ${info.date}\n┃\n`;
      }
      listText += `┃ 📌 .noname remove @user\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
      await client.sendMessage(remoteJid, {
        text: listText,
        mentions: [sender]
      });
    }
    return;
  }
  
  // === .noname remove @user ===
  if (subCommand === "remove") {
    if (!target) {
      await client.sendMessage(remoteJid, {
        text: `╭━〔 ❌ ERREUR 〕━⬣
┃ Utilisation : .noname remove @utilisateur
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
      });
      return;
    }
    
    const targetJid = `${target}@s.whatsapp.net`;
    const muted = mutedUsers.get(remoteJid);
    
    if (!muted || !muted.has(targetJid)) {
      await client.sendMessage(remoteJid, {
        text: `╭━〔 ℹ️ INFO 〕━⬣
┃ @${target} n'est pas muet !
╰━━〔 ⚡ ${config.BotName} 〕━⬣`,
        mentions: [targetJid]
      });
      return;
    }
    
    muted.delete(targetJid);
    if (muted.size === 0) {
      mutedUsers.delete(remoteJid);
    }
    saveMutedUsers();
    
    await client.sendMessage(remoteJid, {
      image: { url: NONAME_IMAGE },
      caption: `╭━〔 🔊 NO NAME - LIBÉRATION 〕━⬣
┃ 
┃ 🗣️ @${target} n'est plus muet !
┃ 
┃ Il peut maintenant parler dans le groupe.
┃ 
┃ ✨ *NO NAME* a parlé
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`,
      mentions: [targetJid]
    });
    return;
  }
  
  // === .noname @user (pour muter) ===
  if (target) {
    const targetJid = `${target}@s.whatsapp.net`;
    
    // Vérifier si la personne existe dans le groupe
    const userExists = participants.some(p => getNumero(p.id) === target);
    if (!userExists) {
      await client.sendMessage(remoteJid, {
        text: `╭━〔 ❌ ERREUR 〕━⬣
┃ Cet utilisateur n'est pas dans le groupe !
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
      });
      return;
    }
    
    // Vérifier si c'est un admin
    const isTargetAdmin = participants.some(p => 
      getNumero(p.id) === target && (p.admin === "admin" || p.admin === "superadmin")
    );
    
    if (isTargetAdmin) {
      await client.sendMessage(remoteJid, {
        text: `╭━〔 ❌ ERREUR 〕━⬣
┃ Impossible de muter un admin !
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
      });
      return;
    }
    
    // Vérifier si déjà muet
    const muted = mutedUsers.get(remoteJid) || new Map();
    if (muted.has(targetJid)) {
      await client.sendMessage(remoteJid, {
        text: `╭━〔 ℹ️ INFO 〕━⬣
┃ @${target} est déjà muet !
┃ 📌 .noname remove @${target} pour le libérer
╰━━〔 ⚡ ${config.BotName} 〕━⬣`,
        mentions: [targetJid]
      });
      return;
    }
    
    // Ajouter aux muets
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;
    
    muted.set(targetJid, {
      by: sender,
      date: dateStr
    });
    
    mutedUsers.set(remoteJid, muted);
    saveMutedUsers();
    
    await client.sendMessage(remoteJid, {
      image: { url: NONAME_IMAGE },
      caption: `╭━〔 🔇 NO NAME - SILENCE 〕━⬣
┃ 
┃ 🤐 @${target} a été rendu MUET !
┃ 
┃ ⚠️ Il ne pourra plus écrire dans
┃ ce groupe.
┃ 
┃ 👑 Par l'autorité de *NO NAME*
┃ 
┃ 📌 .noname remove @${target} pour libérer
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`,
      mentions: [targetJid]
    });
    return;
  }
  
  // === Menu .noname ===
  await client.sendMessage(remoteJid, {
    text: `╭━〔 🔇CMD .NO NAME 〕━⬣
┃ 
┃ 📌 .noname @user
┃    → Rend la personne muette
┃ 
┃ 📌 .noname remove @user
┃    → Libère la personne
┃ 
┃ 📌 .noname list
┃    → Voir la liste des muets
┃ 
┃ ⚠️ Seuls les admins peuvent utiliser
┃    cette commande.
┃ 
┃ 🔒 Les messages des muets seront
┃    automatiquement supprimés.
┃ 
┃ ✨ *NO NAME* - Le silence est d'or
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
  });
}

// ─── Fonction à appeler dans handler.js pour filtrer les messages ───
export async function handleNoNameMuted(message, client) {
  const remoteJid = message.key.remoteJid;
  if (!remoteJid.endsWith("@g.us")) return false;
  
  const sender = message.key.participant || message.key.remoteJid;
  const isFromMe = message.key.fromMe;
  
  if (isFromMe) return false;
  
  const mutedGroup = mutedUsers.get(remoteJid);
  if (!mutedGroup) return false;
  
  if (mutedGroup.has(sender)) {
    try {
      // Supprimer le message
      await client.sendMessage(remoteJid, {
        delete: {
          remoteJid: remoteJid,
          fromMe: false,
          id: message.key.id,
          participant: sender
        }
      });
      
      // Envoyer un avertissement (une fois toutes les 30 secondes)
      const now = Date.now();
      const lastWarnKey = `warn_${sender}`;
      const lastWarning = mutedGroup.get(lastWarnKey) || 0;
      
      if (now - lastWarning > 30000) {
        mutedGroup.set(lastWarnKey, now);
        await client.sendMessage(remoteJid, {
          text: `╭━〔 🔇 NO NAME - MUET 〕━⬣
┃ 
┃ @${getNumero(sender)} vous êtes muet !
┃ 
┃ Vous ne pouvez pas écrire dans ce groupe.
┃ 
┃ ✨ *NO NAME* vous a réduit au silence
┃ 
┃ Contactez un admin pour être libéré.
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`,
          mentions: [sender]
        });
      }
      
    } catch (err) {
      console.log("Erreur suppression message muet:", err.message);
    }
    return true;
  }
  
  return false;
}