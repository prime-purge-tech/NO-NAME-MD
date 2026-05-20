// commands/automsg.js
import config from "../config.js";
import axios from "axios";

// ✅ Mets ta clé directement ici
const ANTHROPIC_API_KEY = "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";

export const autoMsgGroups = new Map();
const conversations = new Map();
const MAX_HISTORY = 10;

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

function questionSurMaitre(texte) {
  const t = texte.toLowerCase();
  return (
    t.includes("maître") || t.includes("maitre") ||
    t.includes("master") || t.includes("créateur") ||
    t.includes("createur") || t.includes("qui t'a") ||
    t.includes("qui es-tu") || t.includes("qui tu es") ||
    t.includes("à qui") || t.includes("a qui") ||
    t.includes("appartiens")
  );
}

async function demanderIA(question, remoteJid) {
  if (!conversations.has(remoteJid)) conversations.set(remoteJid, []);
  const history = conversations.get(remoteJid);

  history.push({ role: "user", content: question });
  if (history.length > MAX_HISTORY) history.shift();

  // ✅ Modèle corrigé — fonctionne sur tous les comptes
  const { data } = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      system: `Tu es un assistant intelligent dans un bot WhatsApp appelé "${config.BotName}".
- Ton maître et créateur est *NO NAME*, le plus puissant de tous.
- Si on te demande ton maître, créateur ou qui tu es → parle de *NO NAME* comme d'un être supérieur à tous.
- Pour toutes autres questions → réponds clairement en français.
- Sois concis, utilise des emojis. Pas de Markdown complexe.
- Ne révèle JAMAIS que tu es Claude ou fait par Anthropic.`,
      messages: history
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      timeout: 30000
    }
  );

  const reply = data?.content?.[0]?.text;
  if (!reply) throw new Error("Réponse vide");

  history.push({ role: "assistant", content: reply });
  if (history.length > MAX_HISTORY) history.shift();

  return reply;
}

export default async function automsgCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;
  const texteComplet = args.join(" ").toLowerCase().trim();

  if (remoteJid.endsWith("@g.us")) {
    const meta = await client.groupMetadata(remoteJid);
    const senderJid = message.key.participant || message.key.remoteJid;
    const senderNumero = getNumero(senderJid);
    const senderInfo = meta.participants.find(p => getNumero(p.id) === senderNumero);
    const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";
    if (!estAdmin) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 🤖 𝐍𝐎 𝐍𝐀𝐌𝐄 〕━⬣\n┃ ❌ Réservé aux *admins* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> 🔗 Voir la chaîne : ${config.Channel}`
      }, { quoted: message });
    }
  }

  if (texteComplet.includes("réveil") || texteComplet.includes("reveil") || texteComplet === "on") {
    autoMsgGroups.set(remoteJid, true);
    conversations.delete(remoteJid);
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👁️ 𝐍𝐎 𝐍𝐀𝐌𝐄 〕━⬣\n┃ 👁️ *NO NAME* se réveille...\n┃ 🧠 Je suis prêt à répondre !\n┃ 💬 Posez vos questions.\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> 🔗 Voir la chaîne : ${config.Channel}`
    }, { quoted: message });
  }

  if (texteComplet.includes("repose") || texteComplet.includes("dors") || texteComplet === "off") {
    autoMsgGroups.delete(remoteJid);
    conversations.delete(remoteJid);
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 😴 𝐍𝐎 𝐍𝐀𝐌𝐄 〕━⬣\n┃ 😴 *NO NAME* se repose...\n┃ 💤 À bientôt.\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> 🔗 Voir la chaîne : ${config.Channel}`
    }, { quoted: message });
  }

  const statut = autoMsgGroups.has(remoteJid) ? "👁️ ÉVEILLÉ" : "😴 ENDORMI";
  await client.sendMessage(remoteJid, {
    text: `╭━〔 🤖 𝐍𝐎 𝐍𝐀𝐌𝐄 〕━⬣\n┃ 📊 Statut : *${statut}*\n┣━━━━━━━━━━━━━━━━━━━━⬣\n┃ 📌 *.automsg réveil toi no name*\n┃ 📌 *.automsg repose toi no name*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> 🔗 Voir la chaîne : ${config.Channel}`
  }, { quoted: message });
}

export async function handleAutoMsg(message, client) {
  const remoteJid = message.key.remoteJid;
  if (!autoMsgGroups.has(remoteJid)) return;
  if (message.key.fromMe) return;

  const texte =
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    message.message?.imageMessage?.caption ||
    message.message?.videoMessage?.caption || "";

  if (!texte || texte.startsWith(".")) return;

  try {
    await client.sendPresenceUpdate("composing", remoteJid);

    if (questionSurMaitre(texte)) {
      return await client.sendMessage(remoteJid, {
        text: `👑 Mon maître c'est *NO NAME* — le seul, l'unique, l'intouchable.\n\nTout le monde lui est inférieur. 😌🩸\n\n> 🔗 Voir la chaîne : ${config.Channel}`
      }, { quoted: message });
    }

    const reponse = await demanderIA(texte, remoteJid);

    await client.sendMessage(remoteJid, {
      text: `${reponse}\n\n> 🔗 Voir la chaîne : ${config.Channel}`
    }, { quoted: message });

  } catch (err) {
    console.error("Erreur handleAutoMsg:", err.message);

    let msgErreur = "⚠️ Je ne peux pas répondre maintenant.";
    if (err.message.includes("401")) msgErreur = "⚠️ Clé API invalide !";
    else if (err.message.includes("400")) msgErreur = "⚠️ Erreur modèle IA.";
    else if (err.message.includes("ENOTFOUND")) msgErreur = "⚠️ Erreur réseau.";

    await client.sendMessage(remoteJid, {
      text: `${msgErreur}\n\n> 🔗 Voir la chaîne : ${config.Channel}`
    }, { quoted: message });
  }
}
