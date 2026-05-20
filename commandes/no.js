// commands/no.js - Commande de recherche avec personnalité NO NAME
import config from "../config.js";
import axios from "axios";

// Image pour NO NAME
const NO_NAME_IMAGE = "https://i.imgur.com/9K4x8L2.jpg";

// Messages d'intro de NO NAME
const INTRO_MESSAGES = [
  "👑 NO NAME sait tout, toi tu sais rien. Voici :",
  "⚡ NO NAME te répond, inférieur. Écoute bien :",
  "🩸 Tu as osé interroger NO NAME. Voici ta réponse :",
  "🔱 Même Google répond à NO NAME. Tiens :",
  "💀 NO NAME est ton maître. Voilà ce que tu cherches :",
  "👁️ NO NAME a vu ta question. La réponse :",
  "🔥 Tu n'es rien face à NO NAME. Lis ça :",
  "❄️ NO NAME te donne une miette de son savoir :",
  "♾️ NO NAME est éternel. Toi non. Voici :",
  "⚔️ Arrête de poser des questions, mais bon... Voici :"
];

function bold(text) {
  return `*${text}*`;
}

function getRandomIntro() {
  return INTRO_MESSAGES[Math.floor(Math.random() * INTRO_MESSAGES.length)];
}

// Recherche sur le web via API (gratuite)
async function searchWeb(query) {
  try {
    // Utiliser l'API de recherche gratuite (DuckDuckGo via un service)
    const url = `https://api.popcat.xyz/search?q=${encodeURIComponent(query)}`;
    const response = await axios.get(url);
    
    if (response.data && response.data.length > 0) {
      let result = "";
      for (let i = 0; i < Math.min(response.data.length, 3); i++) {
        const item = response.data[i];
        result += `\n┃ 📌 ${bold(item.title || "Sans titre")}\n`;
        result += `┃    ${item.description || "Aucune description"}\n`;
        result += `┃    🔗 ${item.url || "#"}\n┃\n`;
      }
      return result;
    }
    return null;
  } catch (err) {
    console.error("Erreur recherche:", err.message);
    return null;
  }
}

// Recherche alternative avec Google (via un service)
async function searchGoogle(query) {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query.split(" ")[0])}`;
    const response = await axios.get(url);
    if (response.data && response.data[0]) {
      const word = response.data[0];
      const meaning = word.meanings[0];
      return `\n┃ 📖 Définition de "${bold(word.word)}" :\n┃    ${meaning.definitions[0].definition}\n┃\n`;
    }
    return null;
  } catch (_) {
    return null;
  }
}

// Recherche Wikipédia
async function searchWikipedia(query) {
  try {
    const url = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const response = await axios.get(url);
    if (response.data && response.data.extract) {
      let extract = response.data.extract.substring(0, 300);
      if (response.data.extract.length > 300) extract += "...";
      return `\n┃ 📖 ${bold(response.data.title || query)} :\n┃    ${extract}\n┃    🔗 https://fr.wikipedia.org/wiki/${encodeURIComponent(query)}\n┃\n`;
    }
    return null;
  } catch (_) {
    return null;
  }
}

// Réponse par défaut quand rien n'est trouvé
function getDefaultResponse(query) {
  const defaultMessages = [
    `Même NO NAME ne trouve pas "${query}". C'est dire si c'est insignifiant.`,
    `"${query}" ? NO NAME n'a pas besoin de savoir ça, et toi non plus.`,
    `NO NAME ne trouve rien. Ta question est nulle.`,
    `Même Google pleure devant "${query}". Arrête de poser des questions bêtes.`,
    `NO NAME a cherché "${query}"... Rien. Comme ton cerveau.`,
    `"${query}" ? Ça n'existe pas. Comme toi dans l'univers.`
  ];
  return defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
}

export default async function noCommand(message, client, { args }) {
  const remoteJid = message.key.remoteJid;
  
  // Récupérer la question (message cité ou arguments)
  let question = "";
  
  // Vérifier si un message est cité
  const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  
  if (quotedMsg) {
    // Si un message est cité
    question = quotedMsg.conversation || 
               quotedMsg.extendedTextMessage?.text ||
               quotedMsg.imageMessage?.caption ||
               quotedMsg.videoMessage?.caption ||
               "";
  } else if (args && args.length > 0) {
    // Si la question est dans les arguments
    question = args.join(" ");
  }
  
  // Si pas de question, afficher le menu
  if (!question || question.trim() === "") {
    await client.sendMessage(remoteJid, {
      image: { url: NO_NAME_IMAGE },
      caption: `╭━〔 👑 NO NAME - COMMANDE 〕━⬣
┃ 
┃ 📌 *.no [votre question]*
┃    → NO NAME cherche la réponse sur le net
┃ 
┃ 📌 *.no* (répondre à un message)
┃    → NO NAME répond au message cité
┃ 
┃ 📖 Exemples :
┃ *.no Qui est NO NAME ?*
┃ *.no Quelle est la météo ?*
┃ 
┃ ⚠️ NO NAME répond avec arrogance.
┃    Il sait tout, toi tu sais rien.
┃ 
┃ 👑 *NO NAME* est le maître absolu
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
    return;
  }
  
  // Envoyer un message d'attente
  const intro = getRandomIntro();
  await client.sendMessage(remoteJid, {
    text: `╭━〔 👑 NO NAME RÉFLÉCHIT 〕━⬣
┃ 
┃ ${intro}
┃ 
┃ 🔍 "${question.substring(0, 100)}${question.length > 100 ? "..." : ""}"
┃ 
┃ ⏳ Recherche en cours...
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
  });
  
  try {
    let result = "";
    let found = false;
    
    // Essayer différentes sources de recherche
    result = await searchWeb(question);
    if (result) found = true;
    
    if (!found) {
      result = await searchWikipedia(question.split(" ").slice(0, 3).join(" "));
      if (result) found = true;
    }
    
    if (!found) {
      result = await searchGoogle(question);
      if (result) found = true;
    }
    
    // Si rien n'est trouvé, réponse par défaut
    if (!found || !result) {
      result = `\n┃ 💀 ${getDefaultResponse(question)}\n┃`;
    }
    
    // Envoyer la réponse finale
    await client.sendMessage(remoteJid, {
      image: { url: NO_NAME_IMAGE },
      caption: `╭━〔 👑 NO NAME A PARLÉ 〕━⬣
┃ 
┃ 📢 *Question :* "${question.substring(0, 80)}${question.length > 80 ? "..." : ""}"
┃ 
${result}
┃ ━━━━━━━━━━━━━━━━━━━━
┃ 
┃ 👑 *NO NAME* est votre maître.
┃ 🩸 Vous n'êtes que des insectes.
┃ ⚡ Apprenez et taisez-vous.
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
    
  } catch (err) {
    console.error("Erreur no command:", err);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 ❌ NO NAME EST FÂCHÉ 〕━⬣
┃ 
┃ Même NO NAME n'a pas pu répondre.
┃ C'est de ta faute, question pourrie.
┃ 
┃ Erreur: ${err.message}
┃ 
┃ Réessaie, inférieur.
┃ 
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
  }
}