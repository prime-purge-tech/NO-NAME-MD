// commands/manga.js - Proverbes de manga avec images
import config from "../config.js";

// Liste des proverbes de manga par catégorie
const MANGA_QUOTES = [
  // NARUTO
  { quote: "Le travail acharné surpassera le génie, quand le génie ne travaille pas assez dur.", character: "Rock Lee", manga: "Naruto", image: "https://i.imghos.co/uAUibMSp.jpg" },
  { quote: "Un ninja est celui qui endure.", character: "Jiraiya", manga: "Naruto", image: "https://i.imghos.co/-QunacPJ.jpg" },
  { quote: "Abandonner, c'est renoncer à être un ninja.", character: "Naruto Uzumaki", manga: "Naruto", image: "https://i.imghos.co/LJqugfwV.jpg" },
  { quote: "La vengeance n'apporte que plus de haine.", character: "Pain", manga: "Naruto", image: "https://i.imghos.co/FQBBXzlM.jpg" },
  { quote: "Dans ce monde, quand quelque chose de mal arrive, c'est toujours la faute des plus forts.", character: "Gaara", manga: "Naruto", image: "https://i.imghos.co/xDPQo-Fe.jpg" },
  { quote: "Quand les gens protègent quelque chose de précieux, ils deviennent vraiment forts.", character: "Hinata Hyuga", manga: "Naruto", image: "https://i.imghos.co/kVIReI-U.jpg" },

  // MADARA (Naruto)
  { quote: "Lorsqu'un homme connaît l'amour, il doit s'attendre à connaître la haine.", character: "Madara Uchiwa", manga: "Naruto", image: "https://i.imghos.co/-uCPAx-s.jpg" },

  // OBITO (Naruto)
  { quote: "Réfléchis bien à ce que tu vas dire, parce que la parole d'un homme qui parle constamment ne vaut rien.", character: "Obito Uchiwa", manga: "Naruto", image: "https://i.imghos.co/haakjjrO.jpg" },

  // SHISUI (Naruto)
  { quote: "C'est bien d'avoir un but dans la vie, mais quand il devient obsédant, il peut se transformer en impasse. Tâches de garder ça dans un coin de ta tête.", character: "Shisui Uchiwa", manga: "Naruto", image: "https://jpcdn.it/img/small/437a850d3417b4eff332dad6be0b7b07.jpg" },

  // ONE PIECE
  { quote: "Les rêves des hommes n'ont pas de fin !", character: "Monkey D. Luffy", manga: "One Piece", image: "https://i.imghos.co/WUJvLWWr.jpg" },
  { quote: "Peu importe qui tu es, ce que tu as fait, tu as toujours le droit de vivre.", character: "Jinbe", manga: "One Piece", image: "https://i.imghos.co/eZ-xTsdN.jpg" },
  { quote: "La mort n'est pas une excuse. On peut mourir pour ce en quoi on croit.", character: "Roronoa Zoro", manga: "One Piece", image: "https://i.imghos.co/oUaWWyQW.jpg" },
  { quote: "Je ne sais pas cuisiner, mais je peux te donner du pain.", character: "Sanji", manga: "One Piece", image: "https://i.imghos.co/zmmkcVyv.jpg" },
  { quote: "Rire face au danger, c'est la plus belle des libertés.", character: "Tony Tony Chopper", manga: "One Piece", image: "https://i.imghos.co/bqRstkke.jpg" },

  // BLEACH
  { quote: "Si tu cherches le pouvoir, tu dois accepter ta peur.", character: "Ichigo Kurosaki", manga: "Bleach", image: "https://i.imghos.co/MINiqKpV.jpg" },
  { quote: "Celui qui n'a pas peur de perdre a déjà gagné.", character: "Kenpachi Zaraki", manga: "Bleach", image: "https://i.imghos.co/IjgWqFMz.jpg" },

  // DEMON SLAYER
  { quote: "Ne regrette jamais tes actes. Même si tu meurs, continue d'avancer.", character: "Tanjiro Kamado", manga: "Demon Slayer", image: "https://i.imghos.co/mtsiZbQz.jpg" },
  { quote: "La rage est une flamme qui consume, mais c'est aussi une lumière qui guide.", character: "Kyojuro Rengoku", manga: "Demon Slayer", image: "https://i.imghos.co/xDXPPTXY.jpg" },

  // ATTACK ON TITAN
  { quote: "Ceux qui ne peuvent pas abandonner quelque chose ne peuvent rien changer.", character: "Armin Arlert", manga: "Attack on Titan", image: "https://i.imghos.co/AHybOicz.jpg" },
  { quote: "On est tous esclaves de quelque chose.", character: "Eren Yeager", manga: "Attack on Titan", image: "https://i.imghos.co/BtOONziC.jpg" },

  // EREN (Attack on Titan)
  { quote: "Les fous sont ceux qui acceptent de vivre comme du bétail.", character: "Eren Yeager", manga: "Attack on Titan", image: "https://i.imghos.co/NKlXcneA.jpg" },

  // DEATH NOTE
  { quote: "Ce monde est pourri, et ceux qui l'embellissent sont encore plus pourris.", character: "Light Yagami", manga: "Death Note", image: "https://i.imghos.co/LeDdJppa.jpg" },
  { quote: "Le seul gagnant est celui qui sait quand s'arrêter.", character: "L", manga: "Death Note", image: "https://i.imghos.co/ZmBzltPJ.jpg" },

  // JOHAN LIEBERT (Monster)
  { quote: "Pensez-vous que votre péché disparaîtra si vous mentez ?", character: "Johan Liebert", manga: "Monster", image: "https://i.imghos.co/vfTXsCtF.jpg" },

  // GOJO (Jujutsu Kaisen)
  { quote: "Chercher quelqu'un à blâmer, c'est juste une douleur inutile.", character: "Satoru Gojo", manga: "Jujutsu Kaisen", image: "https://i.imghos.co/jqBvvGzv.jpg" },

  // JUJUTSU KAISEN
  { quote: "Les morts ne disent rien. Alors c'est aux vivants de parler.", character: "Satoru Gojo", manga: "Jujutsu Kaisen", image: "https://i.imghos.co/YSkPvi-x.jpg" },
  { quote: "Tu n'as pas besoin de sauver tout le monde. Parfois, sauver quelqu'un suffit.", character: "Yuji Itadori", manga: "Jujutsu Kaisen", image: "https://i.imghos.co/TWxUcaUl.jpg" },

  // TOKYO REVENGERS
  { quote: "Si tu changes le passé, peut-être que tu changeras aussi le futur.", character: "Takemichi Hanagaki", manga: "Tokyo Revengers", image: "https://i.imghos.co/QTEUIu-g.jpg" },
  { quote: "Un héros n'est jamais né par hasard.", character: "Mikey", manga: "Tokyo Revengers", image: "https://i.imghos.co/eIEVUBLr.jpg" },

  // KUROKO (Kuroko no Basket)
  { quote: "Je suis jeune et je n'ai pas beaucoup d'expérience, mais il y a une chose dont je suis absolument certain : il faut savoir faire des sacrifices importants pour arriver à changer les choses. Ça, je le tiens de grands hommes qui ont su tout risquer jusqu'à leur propre vie.", character: "Tetsuya Kuroko", manga: "Kuroko no Basket", image: "https://i.imghos.co/OhYQBfAP.jpg" },

  // AKIRA / OREKI
  { quote: "Personne ne sait quand la mort viendra nous cueillir... Mais qu'il nous reste une seule journée ou une bonne soixantaine d'années à vivre, on aura toujours le sentiment de ne pas avoir assez de temps devant nous pour ce qu'on aime.", character: "oreki", manga: "oreki", image: "https://i.imghos.co/xtDCsrhg.jpg" },

  // NO NAME
  { quote: "Quand on s'est un peu frotté à la réalité, on sait bien qu'il n'y a plus d'espoir ici-bas.", character: "NO NAME", manga: "Original", image: "https://i.imghos.co/VxQvEA-k.jpg" },

  // BLACK CLOVER
  { quote: "Je n'ai pas de magie, mais je ne vais jamais abandonner !", character: "Asta", manga: "Black Clover", image: "https://i.imghos.co/cDrBLSpL.jpg" },
  { quote: "Le désespoir n'existe que pour ceux qui regardent vers l'avenir.", character: "Yami Sukehiro", manga: "Black Clover", image: "https://i.imghos.co/HZqPBPD-.jpg" },

  // HAIKYUU
  { quote: "La hauteur du filet ne change pas. Peu importe à quel point tu grandis.", character: "Shoyo Hinata", manga: "Haikyuu", image: "https://i.imghos.co/LtCAeztG.jpg" },
  { quote: "Le talent est quelque chose que tu fais fleurir, l'intuition quelque chose que tu perfectionnes.", character: "Tobio Kageyama", manga: "Haikyuu", image: "https://i.imghos.co/MWsnxbQO.jpg" },

  // FULLMETAL ALCHEMIST
  { quote: "Il n'y a pas de vérité sans mélange d'erreur.", character: "Edward Elric", manga: "Fullmetal Alchemist", image: "https://i.imghos.co/KbMiRMSH.jpg" },
  { quote: "Celui qui abandonne ses proches est pire qu'un chien.", character: "Roy Mustang", manga: "Fullmetal Alchemist", image: "https://i.imghos.co/iboiBVlW.jpg" },

  // HUNTER X HUNTER
  { quote: "Tu devrais profiter du détour, lui aussi fait partie du voyage.", character: "Gon Freecss", manga: "Hunter x Hunter", image: "https://i.imghos.co/esEfOmVE.jpg" },
  { quote: "L'important n'est pas le résultat, mais la volonté de continuer.", character: "Killua Zoldyck", manga: "Hunter x Hunter", image: "https://i.imghos.co/pbZeUpYq.jpg" },

  // ONE PUNCH MAN
  { quote: "Un vrai héros n'abandonne jamais !", character: "Saitama", manga: "One Punch Man", image: "https://i.imghos.co/TXdgQbFv.jpg" },
  { quote: "Le plus grand pouvoir, c'est de savoir quand ne pas l'utiliser.", character: "Mumen Rider", manga: "One Punch Man", image: "https://i.imghos.co/LnqWSJEj.jpg" },

  // VINLAND SAGA
  { quote: "Un vrai guerrier n'a pas besoin d'épée.", character: "Thors", manga: "Vinland Saga", image: "https://i.imghos.co/ulHrcbZb.jpg" },
  { quote: "Tu n'as pas d'ennemis. Personne n'a d'ennemis.", character: "Thorfinn", manga: "Vinland Saga", image: "https://i.imghos.co/eMdJPSKv.jpg" }
];

// Images de secours
const FALLBACK_IMAGES = [
  "https://jpcdn.it/img/38d345f49749aa18ab5df1e867de3fe7.jpg",
  "https://jpcdn.it/img/7e43de2b525d649977d47b9f2d82d0fc.jpg",
  "https://jpcdn.it/img/e90dbec684b3d4193bbd9074d82a313d.jpg"
];

// Fonction pour obtenir une image aléatoire
function getRandomImage(quote) {
  if (quote.image) {
    return quote.image;
  }
  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
}

// Fonction pour formater le texte en gras (WhatsApp)
function bold(text) {
  return `*${text}*`;
}

// Fonction pour obtenir une citation par manga
function getQuotesByManga(mangaName) {
  const filtered = MANGA_QUOTES.filter(q => q.manga.toLowerCase().includes(mangaName.toLowerCase()));
  if (filtered.length === 0) return MANGA_QUOTES;
  return filtered;
}

export default async function mangaCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;
  
  // === .manga list ===
  if (args && args[0]?.toLowerCase() === "list") {
    const mangaList = [...new Set(MANGA_QUOTES.map(q => q.manga))].sort();
    
    let listText = `╭━〔 ${bold("📚 MANGAS DISPONIBLES")} 〕━⬣\n┃\n`;
    for (let i = 0; i < mangaList.length; i += 3) {
      let line = "┃ ";
      for (let j = 0; j < 3 && i + j < mangaList.length; j++) {
        line += `${mangaList[i + j]}${j < 2 ? " • " : ""}`;
      }
      listText += line + "\n";
    }
    listText += `┃\n┃ ${bold("📌 .manga naruto")} - Proverbes de Naruto\n`;
    listText += `┃ ${bold("📌 .manga random")} - Proverbe aléatoire\n`;
    listText += `╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
    
    await client.sendMessage(remoteJid, { text: listText });
    return;
  }
  
  // === .manga random ===
  if (args && args[0]?.toLowerCase() === "random") {
    const randomQuote = MANGA_QUOTES[Math.floor(Math.random() * MANGA_QUOTES.length)];
    const imageUrl = getRandomImage(randomQuote);
    
    const messageText = `╭━〔 ${bold("📖 PROVERBE MANGA")} 〕━⬣
┃
┃ ${bold("「")} ${randomQuote.quote} ${bold("」")}
┃
┃ ✍️ ${bold(randomQuote.character)}
┃ 📚 ${bold(randomQuote.manga)}
┃
╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
    
    try {
      await client.sendMessage(remoteJid, {
        image: { url: imageUrl },
        caption: messageText
      });
    } catch (err) {
      await client.sendMessage(remoteJid, { text: messageText });
    }
    return;
  }
  
  // === .manga [nom_manga] ===
  if (args && args[0]) {
    const mangaSearch = args[0].toLowerCase();
    const quotes = getQuotesByManga(mangaSearch);
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const imageUrl = getRandomImage(randomQuote);
    
    const messageText = `╭━〔 ${bold(`📖 ${randomQuote.manga.toUpperCase()}`)} 〕━⬣
┃
┃ ${bold("「")} ${randomQuote.quote} ${bold("」")}
┃
┃ ✍️ ${bold(randomQuote.character)}
┃
╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
    
    try {
      await client.sendMessage(remoteJid, {
        image: { url: imageUrl },
        caption: messageText
      });
    } catch (err) {
      await client.sendMessage(remoteJid, { text: messageText });
    }
    return;
  }
  
  // === Menu principal .manga ===
  const randomQuote = MANGA_QUOTES[Math.floor(Math.random() * MANGA_QUOTES.length)];
  const imageUrl = getRandomImage(randomQuote);
  
  const menuText = `╭━〔 ${bold("📚 COMMANDE")} 〕━⬣
┃
┃ ${bold("📌 .manga")}
┃ ${bold("📌 .manga list")} 
┃ ${bold("📌 .manga naruto")} 
┃ ${bold("📌 .manga one piece")} 
┃ ${bold("📌 .manga gojo")}
┃ ${bold("📌 .manga eren")}
┃ ${bold("📌 .manga johan")}
┃ ${bold("📌 .manga kuroko")}
┃ ${bold("📌 .manga akira")}
┃ ${bold("📌 .manga madara")}
┃ ${bold("📌 .manga obito")} 
┃ ${bold("📌 .manga shisui")} 
┃ ${bold("📌 .manga noname")} 
┃ ${bold("📌 .manga random")} 
┃
┃ ${bold("📖 EXEMPLE ALÉATOIRE :")}
┃
┃ ${bold("「")} ${randomQuote.quote.substring(0, 50)}... ${bold("」")}
┃ ✍️ ${bold(randomQuote.character)}
┃ 📚 ${bold(randomQuote.manga)}
┃
╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
  
  try {
    await client.sendMessage(remoteJid, {
      image: { url: imageUrl },
      caption: menuText
    });
  } catch (err) {
    await client.sendMessage(remoteJid, { text: menuText });
  }
}
