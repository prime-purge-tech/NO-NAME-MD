import config from "../config.js";

export default async function autoReactCommand(message, client, sender, target, args, isOwner, isCreator, CONFIG, newsletterContextInfo) {
  try {
    const remoteJid = message.key.remoteJid;
    
    // Owner seulement
    if (!isOwner) {
      return client.sendMessage(remoteJid, { 
        text: "❌ *Seul l'OWNER peut utiliser cette commande!*", 
        contextInfo: newsletterContextInfo(CONFIG) 
      }, { quoted: message });
    }

    const channelJid = config.Channel || "120363425431833423@newsletter"; // Ton JID chaîne
    
    // Liste TOUS les numéros connectés via /status
    const statusRes = await fetch("http://localhost:3133/status");
    const status = await statusRes.json();
    const totalBots = status.total || 0;
    const connectedBots = status.connected || 0;

    const successMsg = `✅ *AUTO-REACTION CHAÎNE ACTIVÉE !*

📢 *Chaîne ciblée:* ${channelJid}
🤖 *Total bots:* ${totalBots}
🟢 *Connectés:* ${connectedBots}

⚡ *FONCTION:* À CHAQUE publication sur ta chaîne, **TOUS** les bots connectés réagiront automatiquement !

*Réactions aléatoires:* ❤️ 👍 🔥 ✨ 👀
*✅ Déjà actif sur tous tes bots ! Publie maintenant pour tester.*`;

    await client.sendMessage(remoteJid, { 
      text: successMsg, 
      contextInfo: newsletterContextInfo(CONFIG) 
    }, { quoted: message });

    // ─── AUTO-REACTION DIRECT DANS LA COMMANDE (persistant) ───
    const reactions = ["❤️", "👍", "🔥", "✨", "👀", "😍"];
    
    // Écoute les messages de la chaîne (persistant pour ce client)
    const unsubscribe = client.ev.on("messages.upsert", async (update) => {
      try {
        const msg = update.messages[0];
        if (!msg.message || msg.key.fromMe || msg.key.remoteJid !== channelJid) return;
        
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        await client.sendMessage(msg.key.remoteJid, { 
          react: { text: randomReaction, key: msg.key } 
        });
        
        console.log(`🤖 [AUTO-REACTION] ${randomReaction} sur chaîne (${client.user?.id?.replace(/[@.a-z]/g, "")})`);
      } catch (err) {
        console.error("Erreur auto-react:", err);
      }
    });

    // Nettoyage à déconnexion (optionnel)
    const originalClose = client.ev.on.bind(client.ev, "connection.update");
    client.ev.on("connection.update", (update) => {
      if (update.connection === "close") {
        unsubscribe();
      }
    });

    console.log(`🔥 AUTO-REACTION activée par ${sender} sur ${connectedBots} bots`);

  } catch (err) {
    console.error("Erreur autoreact:", err.message);
    await client.sendMessage(remoteJid, { 
      text: `❌ *Erreur:* ${err.message}`, 
      contextInfo: newsletterContextInfo(CONFIG) 
    }, { quoted: message });
  }
}