// commands/antidemote.js - Anti-demote avec auto-rétrogradation
import config from "../config.js";
import { getThemePhoto, getThemeName, getThemeStyle, formatThemedMessage, sendThemedMessage, sendThemedText } from "./theme.js";

// Stockage des actions récentes (10 minutes)
const recentActions = new Map();

// Groupes où l'anti-demote est actif
export const antiDemoteGroups = new Map();

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

function cleanOldActions(groupJid) {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const groupActions = recentActions.get(groupJid);
  if (!groupActions) return;
  
  for (const [demoteur, data] of groupActions) {
    if (data.time < tenMinutesAgo) {
      groupActions.delete(demoteur);
    }
  }
  
  if (groupActions.size === 0) {
    recentActions.delete(groupJid);
  }
}

function enregistrerAction(groupJid, demoteur, target) {
  if (!recentActions.has(groupJid)) {
    recentActions.set(groupJid, new Map());
  }
  const groupActions = recentActions.get(groupJid);
  groupActions.set(demoteur, {
    time: Date.now(),
    target: target
  });
  cleanOldActions(groupJid);
}

function getRecentDemoteurs(groupJid) {
  cleanOldActions(groupJid);
  const groupActions = recentActions.get(groupJid);
  if (!groupActions) return [];
  return Array.from(groupActions.keys());
}

async function demotePerson(client, groupJid, targetJid, raison) {
  try {
    await client.groupParticipantsUpdate(groupJid, [targetJid], "demote");
    console.log(`✅ Rétrogradé: ${targetJid} (${raison})`);
    return true;
  } catch (err) {
    console.log(`❌ Échec rétrogradation ${targetJid}:`, err.message);
    return false;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function antidemoteCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;
  const photo = getThemePhoto(remoteJid);
  const style = getThemeStyle(remoteJid);

  if (!remoteJid.endsWith("@g.us")) {
    return await sendThemedMessage(client, remoteJid, photo, formatThemedMessage(remoteJid, "ANTIDEMOTE", ["❌ Uniquement dans un groupe !"]), [], message);
  }

  const meta = await client.groupMetadata(remoteJid);
  const senderJidBrut = message.key.participant || message.key.remoteJid;
  const senderNumero = getNumero(senderJidBrut);
  const senderInfo = meta.participants.find(p => getNumero(p.id) === senderNumero);
  const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";

  if (!estAdmin) {
    return await sendThemedMessage(client, remoteJid, photo, formatThemedMessage(remoteJid, "ANTIDEMOTE", ["❌ Réservé aux *admins du groupe* !"]), [], message);
  }

  const option = args[0]?.toLowerCase();
  const themeName = getThemeName(remoteJid);

  if (option === "on") {
    antiDemoteGroups.set(remoteJid, true);
    await sendThemedMessage(client, remoteJid, photo, formatThemedMessage(remoteJid, "ANTIDEMOTE", [
      "✅ Anti-demote *ACTIVÉ* !",
      "🔒 Protection activée :",
      "• Toute dénomination sera détectée",
      "• Le coupable sera dénommé",
      "• Tag de tous les membres",
      `🎨 Thème : ${themeName}`
    ]), [], message);

  } else if (option === "off") {
    antiDemoteGroups.delete(remoteJid);
    recentActions.delete(remoteJid);
    await sendThemedMessage(client, remoteJid, photo, formatThemedMessage(remoteJid, "ANTIDEMOTE", [
      "❌ Anti-demote *DÉSACTIVÉ*",
      `🎨 Thème : ${themeName}`
    ]), [], message);

  } else if (option === "punish") {
    const demoteurs = getRecentDemoteurs(remoteJid);
    
    if (demoteurs.length === 0) {
      await sendThemedMessage(client, remoteJid, photo, formatThemedMessage(remoteJid, "ANTIDEMOTE", [
        "⚠️ Aucun démoteur trouvé",
        "dans les 10 dernières minutes !",
        `🎨 Thème : ${themeName}`
      ]), [], message);
      return;
    }
    
    let listeDemoteurs = "";
    for (const d of demoteurs) {
      listeDemoteurs += `${style.item} 🤡 @${d}\n`;
    }
    
    await sendThemedMessage(client, remoteJid, photo, formatThemedMessage(remoteJid, "CHÂTIMENT DES DÉMOTEURS", [
      `🔴 ${demoteurs.length} personne(s) à punir :`,
      listeDemoteurs,
      "⚡ Rétrogradation en cours...",
      `🎨 Thème : ${themeName}`
    ]), demoteurs.map(d => `${d}@s.whatsapp.net`));
    
    let succes = 0;
    for (const demoteur of demoteurs) {
      const demoteurJid = `${demoteur}@s.whatsapp.net`;
      const resultat = await demotePerson(client, remoteJid, demoteurJid, "a dénommé quelqu'un");
      if (resultat) succes++;
      await delay(1000);
    }
    
    await sendThemedText(client, remoteJid, formatThemedMessage(remoteJid, "CHÂTIMENT TERMINÉ", [
      `✅ ${succes}/${demoteurs.length} démoteurs rétrogradés`,
      `🎨 Thème : ${themeName}`
    ]), [], message);
    
    recentActions.delete(remoteJid);
    
  } else {
    const statut = antiDemoteGroups.has(remoteJid) ? "✅ ACTIVÉ" : "❌ DÉSACTIVÉ";
    await sendThemedMessage(client, remoteJid, photo, formatThemedMessage(remoteJid, "ANTIDEMOTE", [
      `📊 Statut : *${statut}*`,
      "📌 *.antidemote on* → Activer",
      "📌 *.antidemote off* → Désactiver",
      "📌 *.antidemote punish* → Punir les démoteurs (10min)",
      `🎨 Thème : ${themeName}`
    ]), [], message);
  }
}

export async function handleAntiDemote(groupJid, promoter, demotedList, client) {
  if (!antiDemoteGroups.has(groupJid)) return;

  try {
    const meta = await client.groupMetadata(groupJid);
    const botNumero = getNumero(client.user.id);
    const promoterNumero = getNumero(promoter);
    const themeName = getThemeName(groupJid);
    const photo = getThemePhoto(groupJid);
    const style = getThemeStyle(groupJid);
    
    for (const demotedJid of demotedList) {
      const demotedNumero = getNumero(demotedJid);
      enregistrerAction(groupJid, promoterNumero, demotedNumero);
    }

    const tousLesMembres = meta.participants.map(p => p.id);
    const tagallText = tousLesMembres.map(j => `@${getNumero(j)}`).join(" ");

    for (const demotedJid of demotedList) {
      const demotedNumero = getNumero(demotedJid);
      const estBot = demotedNumero === botNumero;

      if (estBot) {
        const demoteursRecents = getRecentDemoteurs(groupJid);
        for (const dem of demoteursRecents) {
          if (dem !== promoterNumero) {
            await demotePerson(client, groupJid, `${dem}@s.whatsapp.net`, "complice de dénomination");
            await delay(1000);
          }
        }
        
        await demotePerson(client, groupJid, promoter, "a dénommé le bot");
        await delay(1000);
        
        await sendThemedMessage(client, groupJid, photo, formatThemedMessage(groupJid, "VOL DE GROUPE DÉTECTÉ", [
          tagallText,
          `🤡 @${promoterNumero} a essayé de dénommer le bot !`,
          "⚡ *Sanctions :*",
          `• @${promoterNumero} a été dénommé(e)`,
          "• Ses complices ont été dénommé(e)s",
          `🛡️ *${config.BotName}* — PROTECTION TOTALE`,
          `🎨 Thème : ${themeName}`,
          `👑 Dev : ${config.nameCreator}`
        ]), tousLesMembres);

        await delay(2000);

        try {
          await client.groupParticipantsUpdate(groupJid, [promoter], "remove");
          console.log(`✅ Expulsé (a dénommé le bot) : ${promoter}`);
          await sendThemedText(client, groupJid, `🚪 @${promoterNumero} a été expulsé du groupe !`, [promoter]);
        } catch (e) {
          console.log("❌ Impossible d'expulser :", e.message);
        }

      } else {
        const demotedInfo = meta.participants.find(p => getNumero(p.id) === demotedNumero);
        const estAdminDemoted = demotedInfo?.admin === "admin" || demotedInfo?.admin === "superadmin";
        
        if (estAdminDemoted) {
          try {
            await client.groupParticipantsUpdate(groupJid, [demotedJid], "promote");
            console.log(`✅ Re-promu : ${demotedJid}`);
          } catch (e) {
            console.log("❌ Impossible de re-promouvoir :", e.message);
          }
        }
        
        await demotePerson(client, groupJid, promoter, "a dénommé quelqu'un");
        await delay(1000);
        
        await sendThemedMessage(client, groupJid, photo, formatThemedMessage(groupJid, "DÉMOTEUR DÉTECTÉ", [
          `🤡 @${promoterNumero} a essayé de dénommer @${demotedNumero}`,
          "⚡ *Sanctions :*",
          `• @${promoterNumero} a été dénommé(e)`,
          estAdminDemoted ? `• @${demotedNumero} a été re-promu(e)` : '',
          `🛡️ *${config.BotName}* — PROTECTION ACTIVE`,
          `🎨 Thème : ${themeName}`,
          `👑 Dev : ${config.nameCreator}`
        ]), [promoter, demotedJid]);
      }
    }
  } catch (err) {
    console.error("Erreur handleAntiDemote:", err.message);
  }
}