// commands/theme.js
import config from "../config.js";
import fs from "fs";

const THEME_FILE = "./theme.json";

// ─── Styles pour chaque thème ───
export const THEME_STYLES = {
  yuta: {
    nom: "Yuta Okkotsu",
    emoji: "🔵",
    couleur: "bleu mystique",
    style: "modern",
    header: "╭━〔 {emoji} 𝐍𝐎 𝐍𝐀𝐌𝐄 𝐌𝐃 〕━⬣",
    footer: "╰━━〔 {emoji} 𝐍𝐎 𝐍𝐀𝐌𝐄 𝐌𝐃 〕━⬣",
    separator: "┣━━",
    item: "┃ ❏",
    info: "┃ 📛",
    line: "┃"
  },
  dandadan: {
    nom: "Dandadan",
    emoji: "👻",
    couleur: "violet extraterrestre",
    style: "ghost",
    header: "╭━━〔 {emoji} 𝐃𝐀𝐍𝐃𝐀𝐃𝐀𝐍 〕━━╮",
    footer: "╰━━━━━━━━━━━━━━━┈⊷",
    separator: "┣━━━━━━━━━━━━━━━━━≽",
    item: "┃✪│ ❏",
    info: "┃✪│ 📛",
    line: "┃✪│"
  },
  boruto: {
    nom: "Boruto",
    emoji: "⚡",
    couleur: "jaune électrique",
    style: "lightning",
    header: "╔════════════════════╗\n        ⚡ {emoji} {name} ⚡\n╚════════════════════╝",
    footer: "> ⚡ {emoji} {name} ⚡",
    separator: "> ╔──────",
    item: "> ➤",
    info: "> 🤖",
    line: ">"
  },
  sasuke: {
    nom: "Sasuke Uchiha",
    emoji: "⚫",
    couleur: "noir et rouge",
    style: "dark",
    header: "❅────✦ {emoji} {name} ✦────❅",
    footer: "❅─────✧❅✦❅✧─────❅",
    separator: "▰▰▰▰▰▰▰▰▰▰▰▰▰",
    item: "➻",
    info: "➻",
    line: "➻"
  },
  zoro: {
    nom: "Roronoa Zoro",
    emoji: "⚔️",
    couleur: "vert samouraï",
    style: "sword",
    header: "╭━━━〔 {emoji} {name} 〕━━━╮",
    footer: "╰━━━━━━━ • ━━━━━━━╯",
    separator: "┣━━━━━━━━━━━━━━━━━━━━━━━╮",
    item: " 々",
    info: " 々",
    line: "┃"
  },
  zenitsu: {
    nom: "Zenitsu Agatsuma",
    emoji: "🌩️",
    couleur: "jaune tonnerre",
    style: "thunder",
    header: "┏━━『{emoji} {name} ᴍᴇɴᴜ』━━┓",
    footer: "╰────────────────",
    separator: "╭─❍🧸",
    item: "│ •",
    info: "│ •",
    line: "│"
  },
  luffy: {
    nom: "Monkey D. Luffy",
    emoji: "🍖",
    couleur: "rouge chapeau de paille",
    style: "pirate",
    header: "╔════════════════════╗\n        ⚫ {name} ⚫\n> ╚════════════════════╝",
    footer: "© {name} powered by {dev}✦",
    separator: "> ╔──────",
    item: "> ➤",
    info: "> 🤖",
    line: ">"
  },
  gon: {
    nom: "Gon Freecss",
    emoji: "🌿",
    couleur: "vert nature",
    style: "hunter",
    header: "╭━━━━━━━━━━━━━━━━━━━━━━━╮\n┃  ⌜ {emoji} ⌟ {name} \n┃  ⬡ Author : {dev}",
    footer: "╰━━━━━━━━━━━━━━━━━━━━━━━╯",
    separator: "┃  ⬡",
    item: "┃  ⬡",
    info: "┃  ⬡",
    line: "┃"
  },
  beerus: {
    nom: "Beerus",
    emoji: "🐱",
    couleur: "violet divin",
    style: "god",
    header: "📜 {name} Help Menu\n\n〄━━━━━━━━━━━━━━━━━━",
    footer: "〄━━━━━━━━━━━━━━━━━━\n┊➯👨‍💻 {dev}\n┊➯🤖 {name}\n〄━━━━━━━━━━━━━━━━━━",
    separator: "〄━━━━━━━━━━━━━━━━━━",
    item: "┊➯",
    info: "┊➯",
    line: "┊➯"
  },
  meme: {
    nom: "Mème",
    emoji: "😂",
    couleur: "arc-en-ciel chaos",
    style: "meme",
    header: "*╭━━━ 🌹{emoji} {name} 🌹*\n*┃🌹╭──────────────────*❥",
    footer: "*╰━━━━━━━━━━━━━━━❥*\n> _{emoji} {name}_",
    separator: "*┃🌹│",
    item: "*┃🌹│ ❏",
    info: "*┃🌹│ 📛",
    line: "*┃🌹│"
  },
  wawulence: {
    nom: "Wawulence",
    emoji: "🔥",
    couleur: "rouge feu",
    style: "fire",
    header: "❅────✦ {emoji} ᴡᴇʟᴄᴏᴍᴇ ✦────❅\n\n▰▰▰▰▰▰▰▰▰▰▰▰▰",
    footer: "▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n❅─────✧❅✦❅✧─────❅",
    separator: "▰▰▰▰▰▰▰▰▰▰▰▰▰",
    item: "➻",
    info: "➻",
    line: "➻"
  }
};

// ─── 11 Thèmes avec photos ───
export const THEMES = {
  yuta: {
    nom: "Yuta Okkotsu",
    emoji: "🔵",
    couleur: "bleu mystique",
    photos: [
      "https://cdn.phototourl.com/free/2026-05-11-c672a400-55c8-4d0f-9e66-aefb1941de73.jpg",
      "https://cdn.phototourl.com/free/2026-05-11-3dce4715-e146-424c-936b-5e07921dd59d.jpg",
      "https://cdn.phototourl.com/free/2026-05-11-a911f5b2-a098-42f6-bb3f-cf8beefdbff2.jpg",
    ],
    fallback: [
      "https://cdn.phototourl.com/free/2026-05-11-ca7140c7-2e0c-4d6d-b9fc-12d0793620d2.jpg",
      "https://cdn.phototourl.com/free/2026-05-11-9a463d78-84e8-4e9f-812f-5340742092c7.jpg",
      "https://cdn.phototourl.com/free/2026-05-11-0fe3847b-1af9-48ca-9612-65cb532015c9.jpg",
    ]
  },
  dandadan: {
    nom: "Dandadan",
    emoji: "👻",
    couleur: "violet extraterrestre",
    photos: [],
    fallback: [
      "https://cdn.phototourl.com/member/2026-05-11-19b8f291-9264-4574-91f5-ab2afba17b1c.jpg",
      "https://cdn.phototourl.com/member/2026-05-11-3490c065-9948-49bd-ac42-15f69bd4b1a5.jpg",
      "https://cdn.phototourl.com/member/2026-05-11-f2da1659-d7f7-49f0-b47a-ebb161000319.jpg",
    ]
  },
  boruto: {
    nom: "Boruto",
    emoji: "⚡",
    couleur: "jaune électrique",
    photos: [],
    fallback: [
      "https://files.catbox.moe/foncxv.jpg",
      "https://files.catbox.moe/fh9q1l.jpg",
      "https://files.catbox.moe/wx74bo.jpg",
    ]
  },
  sasuke: {
    nom: "Sasuke Uchiha",
    emoji: "⚫",
    couleur: "noir et rouge",
    photos: [],
    fallback: [
      "https://cdn.phototourl.com/free/2026-05-11-757ecde2-3ec3-4b9c-82f8-099ee9590eba.jpg",
      "https://cdn.phototourl.com/free/2026-05-11-aca96928-590e-4ed7-a925-a10a0666cb03.jpg",
      "https://cdn.phototourl.com/free/2026-05-11-2f3954ad-d262-439a-9681-e05c7d1dc331.jpg",
    ]
  },
  zoro: {
    nom: "Roronoa Zoro",
    emoji: "⚔️",
    couleur: "vert samouraï",
    photos: [],
    fallback: [
      "https://files.catbox.moe/drtlo3.jpg",
      "https://files.catbox.moe/ce7nt0.jpg",
      "https://files.catbox.moe/vdua4p.jpg",
    ]
  },
  zenitsu: {
    nom: "Zenitsu Agatsuma",
    emoji: "🌩️",
    couleur: "jaune tonnerre",
    photos: [],
    fallback: [
      "https://cdn.phototourl.com/free/2026-05-11-1a913f09-73cf-4ee6-87e2-df64ed05f1d8.jpg",
      "https://cdn.phototourl.com/free/2026-05-11-3c8d689a-d792-45b6-aec2-75d283d09826.jpg",
      "https://cdn.phototourl.com/free/2026-05-11-7e9b85aa-cc65-4f15-b2a2-f0d013ba7b4c.jpg",
    ]
  },
  luffy: {
    nom: "Monkey D. Luffy",
    emoji: "🍖",
    couleur: "rouge chapeau de paille",
    photos: [],
    fallback: [
      "https://cdn.phototourl.com/free/2026-05-11-164d277c-fd1c-4ee5-8ad1-70325fd28905.jpg",
      "https://cdn.phototourl.com/free/2026-05-11-46ccd2c5-bac7-4048-8fcc-a224f206d653.jpg",
      "https://cdn.phototourl.com/free/2026-05-11-30aea4f4-3aff-4909-bf86-8e15298aaede.jpg",
    ]
  },
  gon: {
    nom: "Gon Freecss",
    emoji: "🌿",
    couleur: "vert nature",
    photos: [],
    fallback: [
      "https://cdn.phototourl.com/member/2026-05-11-6c078a99-0e12-443a-82c1-5dfb50990615.jpg",
      "https://cdn.phototourl.com/member/2026-05-11-6e363aa7-aaac-43fe-b015-f6d615c027a2.jpg",
      "https://cdn.phototourl.com/member/2026-05-11-b47aa8a6-c200-48d8-9b14-04b3293c258f.jpg",
    ]
  },
  beerus: {
    nom: "Beerus",
    emoji: "🐱",
    couleur: "violet divin",
    photos: [],
    fallback: [
      "https://cdn.phototourl.com/member/2026-05-11-ba3f95b3-609d-4d91-9883-8c483650f6bc.jpg",
      "https://cdn.phototourl.com/member/2026-05-11-a839cc48-9928-4bd2-b4d3-694382780759.jpg",
      "https://cdn.phototourl.com/member/2026-05-11-a7ba80df-9d6c-4479-8ecd-cb591fd65ac5.jpg",
    ]
  },
  meme: {
    nom: "Mème",
    emoji: "😂",
    couleur: "arc-en-ciel chaos",
    photos: [],
    fallback: [
      "https://cdn.phototourl.com/member/2026-05-11-684a10f8-31ff-40c3-82cf-5e0962f8a116.jpg",
      "https://cdn.phototourl.com/member/2026-05-11-9af11085-4ddf-485a-8a13-85b35fdba490.jpg",
      "https://cdn.phototourl.com/member/2026-05-11-c0fa202d-b994-422b-9ace-d6d924404120.jpg",
    ]
  },
  wawulence: {
    nom: "Wawulence",
    emoji: "🔥",
    couleur: "rouge feu",
    photos: [],
    fallback: [
      "https://cdn.phototourl.com/member/2026-05-11-a85707ed-6b57-41d6-8017-85b0637b83ca.jpg",
      "https://files.catbox.moe/5sgd03.jpg",
      "https://files.catbox.moe/xj2v23.jpg",
    ]
  }
};

// ─── Maps pour les fonctionnalités ───
export const groupThemes = new Map();      // Thème par groupe
export const welcomeGroups = new Map();    // Welcome activé/désactivé par groupe
export const goodbyeGroups = new Map();    // Goodbye activé/désactivé par groupe

// ─── Fonction pour obtenir le style d'un thème ───
export function getThemeStyle(remoteJid) {
  const themeName = groupThemes.get(remoteJid) || "yuta";
  const style = THEME_STYLES[themeName] || THEME_STYLES.yuta;
  return { ...style, themeName };
}

// ─── Fonction pour formater un message avec le thème ───
export function formatThemedMessage(remoteJid, title, items = [], extraInfo = {}) {
  const style = getThemeStyle(remoteJid);
  const theme = THEMES[style.themeName];
  
  let formatted = style.header
    .replace(/{emoji}/g, style.emoji || theme?.emoji || "⚡")
    .replace(/{name}/g, style.nom || theme?.nom || config.BotName)
    .replace(/{dev}/g, config.nameCreator);
  
  formatted += "\n";
  
  // Informations supplémentaires
  if (extraInfo.userName) {
    formatted += `${style.info} Utilisateur : ${extraInfo.userName}\n`;
  }
  if (extraInfo.botName) {
    formatted += `${style.info} Bot : ${config.BotName}\n`;
  }
  if (extraInfo.dev) {
    formatted += `${style.info} Dev : ${config.nameCreator}\n`;
  }
  if (extraInfo.theme) {
    formatted += `${style.info} Thème : ${theme?.nom}\n`;
  }
  if (extraInfo.members) {
    formatted += `${style.info} Membres : ${extraInfo.members}\n`;
  }
  
  if (items.length > 0) {
    formatted += `${style.separator}\n`;
    for (const item of items) {
      formatted += `${style.item} ${item}\n`;
    }
  }
  
  formatted += style.footer
    .replace(/{emoji}/g, style.emoji || theme?.emoji || "⚡")
    .replace(/{name}/g, style.nom || theme?.nom || config.BotName)
    .replace(/{dev}/g, config.nameCreator);
  
  return formatted;
}

// ─── Fonction newsletter universelle ───
export function getNewsletterContext() {
  return {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: config.Newsletter,
      newsletterName: config.BotName,
      serverMessageId: 143
    }
  };
}

// ─── Envoyer un message avec newsletter et thème ───
export async function sendThemedMessage(client, jid, imageUrl, caption, mentions = [], quoted = null) {
  const contextInfo = {
    ...getNewsletterContext(),
    mentionedJid: mentions
  };

  const messageOptions = {
    image: { url: imageUrl },
    caption: caption,
    contextInfo: contextInfo
  };

  if (quoted) {
    return await client.sendMessage(jid, messageOptions, { quoted: quoted });
  } else {
    return await client.sendMessage(jid, messageOptions);
  }
}

// ─── Envoyer un texte avec newsletter ───
export async function sendThemedText(client, jid, text, mentions = [], quoted = null) {
  const contextInfo = {
    ...getNewsletterContext(),
    mentionedJid: mentions
  };

  const messageOptions = {
    text: text,
    contextInfo: contextInfo
  };

  if (quoted) {
    return await client.sendMessage(jid, messageOptions, { quoted: quoted });
  } else {
    return await client.sendMessage(jid, messageOptions);
  }
}

// ─── Sauvegarde des thèmes ───
function sauvegarderThemes() {
  try {
    const data = {};
    groupThemes.forEach((theme, jid) => { data[jid] = theme; });
    fs.writeFileSync(THEME_FILE, JSON.stringify(data, null, 2));
  } catch (_) {}
}

function chargerThemes() {
  try {
    if (fs.existsSync(THEME_FILE)) {
      const data = JSON.parse(fs.readFileSync(THEME_FILE, "utf-8"));
      Object.entries(data).forEach(([jid, theme]) => groupThemes.set(jid, theme));
    }
  } catch (_) {}
}
chargerThemes();

// ─── Obtenir photo du thème actif ───
export function getThemePhoto(remoteJid) {
  const themeName = groupThemes.get(remoteJid) || "yuta";
  const theme = THEMES[themeName];
  if (!theme) return "https://files.catbox.moe/n00vvq.jpg";
  const photos = theme.fallback;
  return photos[Math.floor(Math.random() * photos.length)];
}

// ─── Obtenir emoji du thème ───
export function getThemeEmoji(remoteJid) {
  const themeName = groupThemes.get(remoteJid) || "yuta";
  return THEMES[themeName]?.emoji || "⚡";
}

// ─── Obtenir nom du thème ───
export function getThemeName(remoteJid) {
  const themeName = groupThemes.get(remoteJid) || "yuta";
  return THEMES[themeName]?.nom || "Yuta Okkotsu";
}

// ─── Commande .theme ───
export default async function themeCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  const option = args[0]?.toLowerCase();

  if (!option || option === "liste" || option === "list") {
    const themeActuel = groupThemes.get(remoteJid) || "yuta";
    const photo = getThemePhoto(remoteJid);

    let liste = `╭━〔 🎨 𝗧𝗛𝗘𝗠𝗘𝗦 〕━⬣\n`;
    Object.entries(THEMES).forEach(([key, t]) => {
      const actif = key === themeActuel ? " ✅" : "";
      liste += `┃ ${t.emoji} *.theme ${key}* — ${t.nom}${actif}\n`;
    });
    liste += `┣━━━━━━━━━━━━━━━━━━━━⬣\n`;
    liste += `┃ 📌 Thème actuel : *${THEMES[themeActuel]?.nom}* ${THEMES[themeActuel]?.emoji}\n`;
    liste += `╰━━〔 ⚡ ${config.BotName} 〕━⬣`;

    return await sendThemedMessage(client, remoteJid, photo, liste, [], message);
  }

  if (THEMES[option]) {
    groupThemes.set(remoteJid, option);
    sauvegarderThemes();

    const theme = THEMES[option];
    const photo = getThemePhoto(remoteJid);

    await sendThemedMessage(client, remoteJid, photo, `╭━〔 🎨 𝗧𝗛𝗘𝗠𝗘 〕━⬣
┃ ${theme.emoji} Thème changé en *${theme.nom}* !
┃ 🎨 Couleur : ${theme.couleur}
┃
┃ ✅ Toutes les commandes utilisent
┃ maintenant ce thème !
┃ 📌 *.menu* pour voir le changement
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);

  } else {
    await sendThemedText(client, remoteJid, `╭━〔 🎨 𝗧𝗛𝗘𝗠𝗘 〕━⬣\n┃ ❌ Thème *${option}* introuvable !\n┃ 📌 *.theme* pour voir la liste\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }
}