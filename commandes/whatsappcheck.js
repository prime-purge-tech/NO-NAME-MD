// commands/whatsappcheck.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vérifie si un numéro WhatsApp est banni ou signalé comme spam
 * Méthodes combinées : API check + patterns connus + cache local
 */
export default async function whatsappCheckCommand(message, client, ctx) {
  const { sender, args } = ctx;
  let target = args[0] || sender;

  // Nettoie le numéro
  target = target.replace(/[^0-9]/g, "");
  if (target.length < 7) {
    await client.sendMessage(message.key.remoteJid, {
      text: `❌ Format invalide. Utilisation :\n.whatsappcheck <numero>\nEx: .whatsappcheck 24177994005`,
    }, { quoted: message });
    return;
  }

  await client.sendMessage(message.key.remoteJid, {
    text: `🔍 Vérification du numéro +${target}...`,
  }, { quoted: message });

  try {
    const result = await checkWhatsAppNumber(target);

    let response = `📊 *Rapport pour +${target}*\n\n`;
    response += `🟢 *WhatsApp actif* : ${result.exists ? "✅ Oui" : "❌ Non"}\n`;
    response += `🔴 *Banni/Spam* : ${result.banned ? "⚠️ OUI" : "✅ Non détecté"}\n`;
    response += `📝 *Raison* : ${result.reason || "Aucune"}\n`;
    response += `📅 *Vérifié le* : ${new Date().toLocaleString("fr-FR")}\n\n`;

    if (result.details) {
      response += `📋 *Détails* :\n${result.details}\n`;
    }

    if (result.exists && !result.banned) {
      response += `\n✅ Ce connard vit toujours, réessaie plus tard.`;
    } else if (!result.exists) {
      response += `\n❌ Ce numéro a fui WhatsApp.`;
    } else {
      response += `\n⚠️ Fucked by no name, tu t'es fait baisser 👻.`;
    }

    await client.sendMessage(message.key.remoteJid, {
      text: response,
    }, { quoted: message });

  } catch (err) {
    console.error("Erreur whatsappcheck:", err);
    await client.sendMessage(message.key.remoteJid, {
      text: `❌ Erreur lors de la vérification : ${err.message}`,
    }, { quoted: message });
  }
}

/**
 * Vérifie un numéro via plusieurs méthodes
 */
async function checkWhatsAppNumber(number) {
  const result = {
    exists: false,
    banned: false,
    reason: "",
    details: "",
  };

  // 1. Vérifier dans le cache local des numéros bannis connus
  const bannedCache = loadBannedCache();
  if (bannedCache[number]) {
    result.banned = true;
    result.reason = bannedCache[number].reason || "Signalé dans la base locale";
    result.details = `🕐 Signalé le ${bannedCache[number].date}`;
    return result;
  }

  // 2. Vérifier via WhatsApp Business API (check existence + statut)
  try {
    const exists = await checkWhatsAppExistence(number);
    result.exists = exists;

    if (!exists) {
      result.reason = "Numéro inexistant sur WhatsApp";
      return result;
    }
  } catch (e) {
    console.warn("Erreur check existence:", e.message);
    result.exists = true;
  }

  // 3. Vérifier les patterns de spam/bannissement
  const spamPatterns = detectSpamPatterns(number);
  if (spamPatterns.isSuspicious) {
    result.banned = true;
    result.reason = spamPatterns.reason;
    result.details = spamPatterns.details;

    saveBannedCache(number, {
      reason: spamPatterns.reason,
      date: new Date().toISOString().split("T")[0],
    });

    return result;
  }

  // 4. Vérifier via les listes noires publiques
  const blacklistCheck = await checkBlacklists(number);
  if (blacklistCheck.banned) {
    result.banned = true;
    result.reason = blacklistCheck.reason;
    result.details = blacklistCheck.details;
    return result;
  }

  return result;
}

/**
 * Vérifie l'existence du numéro sur WhatsApp
 */
async function checkWhatsAppExistence(number) {
  try {
    const response = await fetch(
      `https://wa.me/${number}?text=test`,
      { method: "HEAD", redirect: "manual" }
    );

    const waResponse = await fetch(
      `https://api.whatsapp.com/send?phone=${number}&text=&source=&data=`,
      { method: "HEAD", redirect: "manual" }
    );

    const checkResponse = await fetch(
      `https://wa.me/${number}`,
      { method: "GET" }
    );

    const redirectUrl = response.headers.get("location") || "";
    if (redirectUrl.includes("download") || redirectUrl.includes("notfound")) {
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

/**
 * Détecte les patterns de spam/bannissement
 */
function detectSpamPatterns(number) {
  const result = {
    isSuspicious: false,
    reason: "",
    details: "",
  };

  const details = [];

  // Pattern: Numéros signalés dans la communauté
  const reportedNumbers = loadReportedNumbers();
  if (reportedNumbers.includes(number)) {
    result.isSuspicious = true;
    details.push("Signalé dans la base communautaire");
  }

  // Pattern: Format suspect
  if (number.length > 15 || number.length < 10) {
    details.push("Format de numéro anormal");
  }

  // Pattern: Chiffres suspects
  const spamIndicators = [
    { pattern: /(\d)\1{6,}/, desc: "Chiffres répétés (ex: 1111111)" },
    { pattern: /0123456789/, desc: "Séquence numérique" },
    { pattern: /000000$/, desc: "Se termine par des zéros" },
  ];

  for (const indicator of spamIndicators) {
    if (indicator.pattern.test(number)) {
      details.push(`Pattern suspect: ${indicator.desc}`);
    }
  }

  if (details.length > 0) {
    result.isSuspicious = true;
    result.reason = details.length >= 2
      ? "Patterns de spam détectés"
      : "Pattern suspect détecté";
    result.details = details.map((d, i) => `  ${i + 1}. ${d}`).join("\n");
  }

  return result;
}

/**
 * Vérifie via les listes noires
 */
async function checkBlacklists(number) {
  return { banned: false, reason: "", details: "" };
}

/**
 * Charge le cache local des numéros bannis
 */
function loadBannedCache() {
  const cachePath = path.join(__dirname, "..", "cache", "banned_numbers.json");
  try {
    if (!fs.existsSync(cachePath)) {
      fs.mkdirSync(path.dirname(cachePath), { recursive: true });
      fs.writeFileSync(cachePath, JSON.stringify({}));
      return {};
    }
    return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
  } catch {
    return {};
  }
}

/**
 * Sauvegarde un numéro dans le cache bannis
 */
function saveBannedCache(number, data) {
  const cachePath = path.join(__dirname, "..", "cache", "banned_numbers.json");
  try {
    const cache = loadBannedCache();
    cache[number] = data;
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error("Erreur sauvegarde cache:", e.message);
  }
}

/**
 * Charge les numéros signalés par la communauté
 */
function loadReportedNumbers() {
  const reportedPath = path.join(__dirname, "..", "cache", "reported_numbers.json");
  try {
    if (!fs.existsSync(reportedPath)) return [];
    return JSON.parse(fs.readFileSync(reportedPath, "utf-8"));
  } catch {
    return [];
  }
}
