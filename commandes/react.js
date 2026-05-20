export default async function react(message, client) {
  try {
    await client.sendMessage(message.key.remoteJid, {
      react: { text: "👻", key: message.key },
    });
  } catch (e) {
    console.error("Erreur de réaction:", e);
  }
}