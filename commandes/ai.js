// commands/ai.js
import config from "../config.js";

// ⚠️ Tu DOIS obtenir une vraie clé ici :
// https://console.anthropic.com/settings/keys
const ANTHROPIC_API_KEY = "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";

// Modèle à utiliser (le plus récent et abordable)
const MODEL = "claude-3-5-haiku-20241022";

export default async function aiCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  try {
    const question = args && args.length > 0 ? args.join(" ") : null;

    if (!question) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 🤖 𝐀𝐈 〕━⬣\n┃ ❌ Pose une question !\n┃ 📌 Exemple: *.ai C'est quoi l'IA ?*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
      });
    }

    // Envoi d'un message d'attente
    await client.sendMessage(remoteJid, {
      text: `╭━〔 🤖 𝐀𝐈 〕━⬣\n┃ 💭 *${question.substring(0, 50)}${question.length > 50 ? "..." : ""}*\n┃ ⏳ Réflexion en cours...\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });

    // ✅ Vérifier si la clé API est configurée
    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "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") {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 🤖 𝐀𝐈 〕━⬣\n┃ ⚠️ API non configurée !\n┃ 📌 Ajoute ta clé Anthropic\n┃ 🔧 Modifie le fichier ai.js\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,  // ✅ Modèle corrigé
        max_tokens: 1024,
        system: `Tu es un assistant intelligent intégré dans un bot WhatsApp appelé "${config.BotName}". Réponds de façon claire, concise et en français. Évite le Markdown complexe. Utilise des emojis pour rendre les réponses plus lisibles.`,
        messages: [
          { role: "user", content: question }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur API Anthropic:", response.status, data);
      
      // Messages d'erreur plus clairs
      let errorMessage = "Erreur inconnue";
      if (response.status === 401) {
        errorMessage = "Clé API invalide ! Vérifie ta clé Anthropic.";
      } else if (response.status === 429) {
        errorMessage = "Trop de requêtes. Attends un peu.";
      } else if (response.status === 403) {
        errorMessage = "Accès refusé. Vérifie ta clé API.";
      } else if (data?.error?.message) {
        errorMessage = data.error.message;
      }
      
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 🤖 𝐀𝐈 〕━⬣\n┃ ⚠️ Erreur API :\n┃ ${errorMessage}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
      });
    }

    const reply = data.content?.[0]?.text || "Pas de réponse reçue.";
    
    // Nettoyer la réponse pour WhatsApp
    const cleanReply = reply
      .replace(/\*\*/g, "")  // Enlever le gras markdown
      .replace(/##/g, "")     // Enlever les titres
      .replace(/```/g, "");   // Enlever les blocs de code

    // Découper si trop long (WhatsApp limite ~4096 caractères)
    const maxLength = 3800;
    let finalText = `╭━〔 🤖 𝐀𝐈 𝐂𝐋𝐀𝐔𝐃𝐄 〕━⬣
┃ ❓ *${question.substring(0, 100)}${question.length > 100 ? "..." : ""}*
┣━━━━━━━━━━━━━━━━━━━━⬣
${cleanReply}
┣━━〔 ⚡ ${config.BotName} 〕━⬣
┃ 👑 Dev : ${config.nameCreator}
╰━━━━━━━━━━━━━━━━━━━━⬣`;

    if (finalText.length > maxLength) {
      finalText = finalText.substring(0, maxLength - 50) + "\n┃ ...(réponse tronquée)\n╰━━━━━━━━━━━━━━━━━━━━⬣";
    }

    await client.sendMessage(remoteJid, { text: finalText });

  } catch (err) {
    console.error("Erreur aiCommand:", err);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 🤖 𝐀𝐈 〕━⬣\n┃ ⚠️ Erreur inattendue.\n┃ 📌 ${err.message || "Réessaie plus tard"}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
  }
}