// commands/family.js
import config from "../config.js";
import fs from "fs";
import sharp from "sharp";
import axios from "axios";
import { getThemePhoto, getThemeName, sendThemedMessage, sendThemedText } from "./theme.js";

const DB_FILE = "./family_db.json";

// Photos aléatoires pour le menu family
const FAMILY_PHOTOS = [
  "https://files.catbox.moe/c3fto0.jpg",
  "https://files.catbox.moe/1k406k.jpg",
  "https://files.catbox.moe/ona1tp.jpg",
  "https://files.catbox.moe/2bvc36.jpg",
  "https://files.catbox.moe/mzq8vc.jpg",
  "https://files.catbox.moe/6o1p0r.jpg",
  "https://files.catbox.moe/jmew5g.jpg",
  "https://files.catbox.moe/vgarka.jpg",
  "https://files.catbox.moe/cbm3ho.jpg",
  "https://files.catbox.moe/mi2no1.jpg",
  "https://files.catbox.moe/qmx633.jpg",
  "https://files.catbox.moe/2lbn0o.jpg",
  "https://files.catbox.moe/w3h67u.jpg",
  "https://files.catbox.moe/gozdlu.jpg",
  "https://files.catbox.moe/2xomre.jpg",
  "https://files.catbox.moe/cjnmac.jpg",
  "https://files.catbox.moe/wv09gu.jpg",
  "https://files.catbox.moe/z5l8ur.jpg",
  "https://files.catbox.moe/v0lunz.jpg",
  "https://files.catbox.moe/viqycv.jpg"
];

function getRandomFamilyPhoto() {
  return FAMILY_PHOTOS[Math.floor(Math.random() * FAMILY_PHOTOS.length)];
}

// ─── Domaines et questions pour les diplômes ───
const DOMAINS = {
  "informatique": {
    name: "💻 Informatique",
    questions: [
      { q: "Que signifie HTML ?", a: "HyperText Markup Language", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language"] },
      { q: "Qu'est-ce qu'une variable en programmation ?", a: "Un espace de stockage", options: ["Une fonction", "Un espace de stockage", "Une boucle"] },
      { q: "Que signifie CSS ?", a: "Cascading Style Sheets", options: ["Creative Style Sheets", "Computer Style Sheets", "Cascading Style Sheets"] },
      { q: "Qu'est-ce que JavaScript ?", a: "Un langage de programmation", options: ["Un framework", "Un langage de programmation", "Une base de données"] },
      { q: "Que signifie API ?", a: "Application Programming Interface", options: ["Application Programming Interface", "Advanced Programming Interface", "Application Process Interface"] },
      { q: "Qu'est-ce qu'une boucle en programmation ?", a: "Une structure qui répète du code", options: ["Une condition", "Une structure qui répète du code", "Une variable"] },
      { q: "Que signifie SQL ?", a: "Structured Query Language", options: ["Structured Query Language", "Simple Query Language", "System Query Language"] },
      { q: "Qu'est-ce que le cloud computing ?", a: "Stockage et calcul à distance", options: ["Un ordinateur", "Stockage et calcul à distance", "Un réseau social"] },
      { q: "Que signifie HTTP ?", a: "HyperText Transfer Protocol", options: ["Hyper Transfer Protocol", "High Text Transfer Protocol", "HyperText Transfer Protocol"] },
      { q: "Qu'est-ce qu'un algorithme ?", a: "Une suite d'instructions", options: ["Un langage", "Une suite d'instructions", "Un programme"] }
    ]
  },
  "commerce": {
    name: "📊 Commerce",
    questions: [
      { q: "Qu'est-ce que le marketing ?", a: "L'étude du marché", options: ["La vente", "L'étude du marché", "La publicité"] },
      { q: "Que signifie SWOT ?", a: "Forces, Faiblesses, Opportunités, Menaces", options: ["Stratégie, Web, Objectif, Temps", "Forces, Faiblesses, Opportunités, Menaces", "Société, Worldwide, Organisation, Technique"] },
      { q: "Qu'est-ce que le e-commerce ?", a: "Commerce en ligne", options: ["Commerce en ligne", "Commerce traditionnel", "Commerce mobile"] },
      { q: "Que signifie ROI ?", a: "Retour sur investissement", options: ["Retour sur investissement", "Rentabilité opérationnelle", "Ratio d'opportunité"] },
      { q: "Qu'est-ce que le B2B ?", a: "Business to Business", options: ["Business to Consumer", "Business to Business", "Business to Government"] },
      { q: "Qu'est-ce que le B2C ?", a: "Business to Consumer", options: ["Business to Consumer", "Business to Business", "Business to Company"] },
      { q: "Que signifie CRM ?", a: "Customer Relationship Management", options: ["Customer Relation Management", "Client Relation Manager", "Customer Relationship Management"] },
      { q: "Qu'est-ce que le pricing ?", a: "La fixation des prix", options: ["La publicité", "La fixation des prix", "La distribution"] },
      { q: "Que signifie UX ?", a: "User Experience", options: ["User Experience", "User Interface", "Universal Xchange"] },
      { q: "Qu'est-ce que la fidélisation ?", a: "Garder ses clients", options: ["Attirer des clients", "Garder ses clients", "Augmenter les prix"] }
    ]
  },
  "banque": {
    name: "💰 Banque & Finance",
    questions: [
      { q: "Que signifie un prêt ?", a: "De l'argent emprunté", options: ["De l'argent donné", "De l'argent emprunté", "Un investissement"] },
      { q: "Qu'est-ce qu'un taux d'intérêt ?", a: "Le coût de l'argent emprunté", options: ["Le gain sur un compte", "Le coût de l'argent emprunté", "Une taxe"] },
      { q: "Que signifie crédit ?", a: "De l'argent prêté", options: ["De l'argent prêté", "De l'argent gagné", "De l'argent perdu"] },
      { q: "Qu'est-ce qu'un livret d'épargne ?", a: "Un compte pour économiser", options: ["Un compte courant", "Un compte pour économiser", "Un prêt"] },
      { q: "Que signifie action en bourse ?", a: "Part d'une entreprise", options: ["Part d'une entreprise", "Un document", "Un impôt"] },
      { q: "Qu'est-ce qu'un dividende ?", a: "Part des bénéfices versée", options: ["Un impôt", "Part des bénéfices versée", "Un prêt"] },
      { q: "Que signifie inflation ?", a: "Hausse des prix", options: ["Baisse des prix", "Hausse des prix", "Stabilité des prix"] },
      { q: "Qu'est-ce qu'un bilan comptable ?", a: "Document financier", options: ["Un document financier", "Un contrat", "Une facture"] },
      { q: "Que signifie patrimoine ?", a: "Ensemble des biens", options: ["Ensemble des dettes", "Ensemble des biens", "Un revenu"] },
      { q: "Qu'est-ce que la liquidité ?", a: "Disponibilité de l'argent", options: ["Disponibilité de l'argent", "Un investissement", "Une perte"] }
    ]
  },
  "agriculture": {
    name: "🌾 Agriculture",
    questions: [
      { q: "Qu'est-ce que la permaculture ?", a: "Agriculture durable", options: ["Agriculture intensive", "Agriculture durable", "Élevage"] },
      { q: "Que signifie hydroponie ?", a: "Culture sans terre", options: ["Culture sans terre", "Culture en serre", "Culture en plein champ"] },
      { q: "Qu'est-ce qu'un pesticide ?", a: "Anti-nuisibles", options: ["Engrais", "Anti-nuisibles", "Eau d'irrigation"] },
      { q: "Que signifie rotation des cultures ?", a: "Alterner les plantes", options: ["Alterner les plantes", "Toujours la même plante", "Laisser la terre vide"] },
      { q: "Qu'est-ce que le compost ?", a: "Engrais naturel", options: ["Engrais chimique", "Engrais naturel", "Terreau"] },
      { q: "Que signifie biologique ?", a: "Sans produits chimiques", options: ["Avec produits chimiques", "Sans produits chimiques", "Avec OGM"] },
      { q: "Qu'est-ce qu'une serre ?", a: "Structure pour cultiver", options: ["Habitation", "Structure pour cultiver", "Entrepôt"] },
      { q: "Que signifie irrigation ?", a: "Apport d'eau", options: ["Apport d'eau", "Apport d'engrais", "Apport de lumière"] },
      { q: "Qu'est-ce qu'un OGM ?", a: "Organisme génétiquement modifié", options: ["Organisme génétiquement modifié", "Organique", "Engrais"] },
      { q: "Que signifie élevage extensif ?", a: "Élevage en plein air", options: ["Élevage en batterie", "Élevage en plein air", "Élevage industriel"] }
    ]
  }
};

// ─── Base de données ───
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (_) {}
  return { 
    users: {}, 
    banks: {}, 
    companies: {},
    pendingMarriage: {}, 
    pendingAdopt: {},
    pendingHire: {},
    pendingLoan: {},
    pendingExam: {},
    crimes: {}
  };
}

function saveDB(db) {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch (_) {}
}

function getUser(db, jid) {
  if (!db.users[jid]) {
    db.users[jid] = {
      jid, name: "", money: 5000, bank: 0,
      spouse: null, children: [], friends: [],
      familyName: "", garden: {}, diploma: [],
      domain: null, examAnswers: [],
      company: null, companyPosition: null,
      karma: 0, lastDaily: 0, lastWork: 0,
      lastInterest: 0, lastCrime: 0, wanted: 0,
      loan: 0, loanInterest: 0,
      title: "", profileColor: "#a855f7", items: []
    };
  }
  return db.users[jid];
}

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

function fmt(n) {
  return Number(n).toLocaleString("fr-FR") + "$";
}

// ─── Segments de la Roue de Fortune ───
const ROUE_SEGMENTS = [
  { name: "💀 Ruine totale", weight: 6, type: "mult", value: 0, desc: "Tout perdre !" },
  { name: "☠️ Malédiction", weight: 10, type: "mult", value: 0.1, desc: "x0.1" },
  { name: "😭 x0.2", weight: 9, type: "mult", value: 0.2, desc: "x0.2" },
  { name: "😞 x0.3", weight: 10, type: "mult", value: 0.3, desc: "x0.3" },
  { name: "💸 x0.4", weight: 9, type: "mult", value: 0.4, desc: "x0.4" },
  { name: "😐 x0.5", weight: 9, type: "mult", value: 0.5, desc: "x0.5" },
  { name: "🔄 IDEM", weight: 10, type: "idem", value: 0, desc: "Rien ne change" },
  { name: "🙂 x0.8", weight: 9, type: "mult", value: 0.8, desc: "x0.8" },
  { name: "💵 +50 000 $", weight: 6, type: "fix", value: 50000, desc: "+50 000$" },
  { name: "💰 x1.2", weight: 8, type: "mult", value: 1.2, desc: "x1.2" },
  { name: "💵 +200 000 $", weight: 6, type: "fix", value: 200000, desc: "+200 000$" },
  { name: "💰 x1.5", weight: 10, type: "mult", value: 1.5, desc: "x1.5" },
  { name: "🎁 +500 000 $", weight: 4, type: "fix", value: 500000, desc: "+500 000$" },
  { name: "🤑 x2.0", weight: 7, type: "mult", value: 2.0, desc: "x2.0" },
  { name: "🎯 x3.0", weight: 5, type: "mult", value: 3.0, desc: "x3.0" },
  { name: "💵 +1 000 000 $", weight: 3, type: "fix", value: 1000000, desc: "+1 000 000$" },
  { name: "⭐ x5.0", weight: 3, type: "mult", value: 5.0, desc: "x5.0" },
  { name: "🔥 x10.0", weight: 2, type: "mult", value: 10.0, desc: "x10.0" },
  { name: "🌟 MÉGA CHANCE x15.0", weight: 1, type: "mult", value: 15.0, desc: "x15.0" },
  { name: "💎 JACKPOT x25.0", weight: 1, type: "mult", value: 25.0, desc: "x25.0" },
];

const TOTAL_WEIGHT = ROUE_SEGMENTS.reduce((sum, s) => sum + s.weight, 0);

function spinRoue() {
  let random = Math.random() * TOTAL_WEIGHT;
  for (const segment of ROUE_SEGMENTS) {
    if (random < segment.weight) return segment;
    random -= segment.weight;
  }
  return ROUE_SEGMENTS[0];
}

const PLANTS = {
  tomate: { cost: 500, time: 60, reward: 1500 },
  carotte: { cost: 300, time: 30, reward: 900 },
  fraise: { cost: 800, time: 120, reward: 2500 },
  cannabis: { cost: 2000, time: 300, reward: 8000 },
};

// ─── Types d'entreprises ───
const COMPANY_TYPES = {
  "tech": { name: "Tech Startup", cost: 500000, revenue: 50000, maxEmployees: 10 },
  "commerce": { name: "Commerce", cost: 300000, revenue: 30000, maxEmployees: 8 },
  "agriculture": { name: "Ferme", cost: 200000, revenue: 20000, maxEmployees: 6 },
  "industrie": { name: "Industrie", cost: 1000000, revenue: 100000, maxEmployees: 15 },
  "banque": { name: "Banque Privée", cost: 2000000, revenue: 200000, maxEmployees: 20 }
};

function createCompany(db, companyId, name, type, owner) {
  db.companies[companyId] = {
    name: name,
    type: type,
    owner: owner,
    level: 1,
    revenue: COMPANY_TYPES[type].revenue,
    employees: [],
    maxEmployees: COMPANY_TYPES[type].maxEmployees,
    treasury: 0,
    createdAt: Date.now()
  };
  saveDB(db);
  return db.companies[companyId];
}

// ─── Récupérer la photo de profil WhatsApp ───
async function getProfilePicture(client, jid) {
  try {
    const url = await client.profilePictureUrl(jid, "image");
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  } catch (err) {
    return null;
  }
}

// ─── Créer une image ronde ───
async function createCircleImage(buffer, size) {
  if (!buffer) return null;
  
  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
    </svg>`
  );
  
  const image = await sharp(buffer)
    .resize(size, size)
    .composite([{
      input: circleMask,
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();
  
  return image;
}

// ─── Génération d'image arbre familial avec photos ───
async function generateFamilyImage(client, user, db) {
  const width = 1000;
  const height = 800;
  
  // Photos de tous les membres
  const mainPic = await getProfilePicture(client, user.jid);
  const spousePic = user.spouse ? await getProfilePicture(client, user.spouse) : null;
  
  const kidPics = [];
  for (const kid of user.children) {
    kidPics.push(await getProfilePicture(client, kid));
  }
  
  const friendPics = [];
  for (const friend of user.friends) {
    friendPics.push(await getProfilePicture(client, friend));
  }
  
  const mainCircle = mainPic ? await createCircleImage(mainPic, 90) : null;
  const spouseCircle = spousePic ? await createCircleImage(spousePic, 70) : null;
  
  const kidCircles = [];
  for (const pic of kidPics) {
    kidCircles.push(pic ? await createCircleImage(pic, 60) : null);
  }
  
  const friendCircles = [];
  for (const pic of friendPics) {
    friendCircles.push(pic ? await createCircleImage(pic, 60) : null);
  }
  
  // Calculer les positions dynamiquement
  const maxPerColumn = Math.max(kidCircles.length, friendCircles.length, 1);
  const startY = 180;
  const stepY = Math.min(100, (height - 200) / maxPerColumn);
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#0a1a0a"/>
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>`;
  
  svg += `<text x="50%" y="40" font-size="28" fill="#a8f0a8" text-anchor="middle" font-weight="bold" filter="url(#glow)">🌳 Arbre Familial de ${user.name}</text>`;
  
  const CX = width / 2;
  const CY = height / 2 + 20;
  
  // Conjoint (en haut)
  if (user.spouse) {
    svg += `<line x1="${CX}" y1="${CY - 50}" x2="${CX}" y2="${CY - 140}" stroke="#f0c040" stroke-width="3" stroke-dasharray="6,4"/>`;
  }
  
  // Enfants (gauche)
  for (let i = 0; i < kidCircles.length; i++) {
    const x = 120;
    const y = startY + i * stepY;
    svg += `<line x1="${CX - 60}" y1="${CY}" x2="${x + 35}" y2="${y}" stroke="#5cdd8b" stroke-width="3" stroke-dasharray="6,4"/>`;
  }
  
  // Amis (droite)
  for (let i = 0; i < friendCircles.length; i++) {
    const x = width - 120;
    const y = startY + i * stepY;
    svg += `<line x1="${CX + 60}" y1="${CY}" x2="${x - 35}" y2="${y}" stroke="#60c0f0" stroke-width="3" stroke-dasharray="6,4"/>`;
  }
  
  // Conjoint
  if (user.spouse) {
    const spouseName = db.users[user.spouse]?.name || getNumero(user.spouse);
    svg += `<circle cx="${CX}" cy="${CY - 140}" r="38" fill="none" stroke="#f0c040" stroke-width="3"/>
      <text x="${CX}" y="${CY - 95}" fill="#f0c040" text-anchor="middle" font-size="13" font-weight="bold">💍 ${spouseName.substring(0, 15)}</text>`;
  }
  
  // Joueur
  svg += `<circle cx="${CX}" cy="${CY}" r="48" fill="none" stroke="#c084fc" stroke-width="4"/>
    <text x="${CX}" y="${CY + 65}" fill="#c084fc" text-anchor="middle" font-size="15" font-weight="bold">⭐ ${user.name}</text>`;
  
  // Enfants
  for (let i = 0; i < kidCircles.length; i++) {
    const x = 120;
    const y = startY + i * stepY;
    const kidName = db.users[user.children[i]]?.name || getNumero(user.children[i]);
    svg += `<circle cx="${x}" cy="${y}" r="33" fill="none" stroke="#5cdd8b" stroke-width="3"/>
      <text x="${x}" y="${y + 45}" fill="#5cdd8b" text-anchor="middle" font-size="11">👶 ${kidName.substring(0, 12)}</text>`;
  }
  
  // Amis
  for (let i = 0; i < friendCircles.length; i++) {
    const x = width - 120;
    const y = startY + i * stepY;
    const friendName = db.users[user.friends[i]]?.name || getNumero(user.friends[i]);
    svg += `<circle cx="${x}" cy="${y}" r="33" fill="none" stroke="#60c0f0" stroke-width="3"/>
      <text x="${x}" y="${y + 45}" fill="#60c0f0" text-anchor="middle" font-size="11">👥 ${friendName.substring(0, 12)}</text>`;
  }
  
  svg += `<text x="50%" y="${height - 25}" fill="rgba(255,255,255,0.4)" text-anchor="middle" font-size="12">⭐ Joueur  💍 Conjoint  👶 Enfants  👥 Amis</text>`;
  svg += `</svg>`;
  
  let image = sharp(Buffer.from(svg));
  
  if (mainCircle) {
    image = image.composite([{ input: mainCircle, left: CX - 45, top: CY - 45 }]);
  }
  
  if (spouseCircle) {
    image = image.composite([{ input: spouseCircle, left: CX - 35, top: CY - 175 }]);
  }
  
  for (let i = 0; i < kidCircles.length; i++) {
    if (kidCircles[i]) {
      const x = 120 - 30;
      const y = startY + i * stepY - 30;
      image = image.composite([{ input: kidCircles[i], left: x, top: y }]);
    }
  }
  
  for (let i = 0; i < friendCircles.length; i++) {
    if (friendCircles[i]) {
      const x = width - 120 - 30;
      const y = startY + i * stepY - 30;
      image = image.composite([{ input: friendCircles[i], left: x, top: y }]);
    }
  }
  
  return await image.png().toBuffer();
}

// ─── Affichage des diplômes ───
function getDiplomaDisplay(user) {
  const hasBac = user.diploma.includes("Bac");
  const hasLicence = user.diploma.includes("Licence");
  const hasMaster = user.diploma.includes("Master");
  const hasMBA = user.diploma.includes("MBA");
  
  let display = `╭━〔 🎓 𝗩𝗢𝗦 𝗗𝗜𝗣𝗟𝗢𝗠𝗘𝗦 〕━⬣\n`;
  
  // Bac
  if (hasBac) {
    display += `┃ ✅ 📄 *Bac* — Gratuit ${user.diploma.includes("Bac") ? "(obtenu)" : ""}\n`;
  } else {
    display += `┃ ⬜ 📄 *Bac* — Gratuit (7/10 requis)\n`;
  }
  
  // Licence
  if (hasLicence) {
    display += `┃ ✅ 🎓 *Licence* — 500 000 💰 (obtenu) — Domaine : ${user.domain || "Non choisi"}\n`;
  } else if (hasBac) {
    display += `┃ ⬜ 🎓 *Licence* — 500 000 💰 (8/10 requis)\n`;
  } else {
    display += `┃ ⬜ 🎓 *Licence* — 500 000 💰 (Nécessite le Bac)\n`;
  }
  
  // Master
  if (hasMaster) {
    display += `┃ ✅ 🏅 *Master* — 5 000 000 💰 (obtenu)\n`;
  } else if (hasLicence) {
    display += `┃ ⬜ 🏅 *Master* — 5 000 000 💰 (8/10 requis)\n`;
  } else {
    display += `┃ ⬜ 🏅 *Master* — 5 000 000 💰 (Nécessite la Licence)\n`;
  }
  
  // MBA
  if (hasMBA) {
    display += `┃ ✅ 👑 *MBA* — 50 000 000 💰 (obtenu — parfait ✨)\n`;
  } else if (hasMaster) {
    display += `┃ ⬜ 👑 *MBA* — 50 000 000 💰 (10/10 requis — parfait ✨)\n`;
  } else {
    display += `┃ ⬜ 👑 *MBA* — 50 000 000 💰 (Nécessite le Master)\n`;
  }
  
  display += `┣━━━━━━━━━━━━━━━━━━━━⬣\n`;
  display += `┃ 💰 Bonus /work actif : +${user.diploma.length * 10}%\n`;
  display += `╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
  
  return display;
}

// ─── Commande pour passer l'examen ───
async function startExam(message, client, user, db, args) {
  const diplomaType = args[1]?.toLowerCase();
  const domain = args[2]?.toLowerCase();
  
  if (diplomaType === "bac") {
    if (user.diploma.includes("Bac")) {
      return await sendThemedText(client, message.key.remoteJid, `❌ Tu as déjà le Bac !`, [], message);
    }
    
    // Vérifier les prérequis (7/10)
    const requiredDiplomas = 7;
    const hasRequired = user.diploma.length >= requiredDiplomas;
    
    if (!hasRequired) {
      return await sendThemedText(client, message.key.remoteJid, `❌ Pour le Bac, il te faut ${requiredDiplomas} diplômes ! Actuellement : ${user.diploma.length}/${requiredDiplomas}`, [], message);
    }
    
    // Générer 10 questions aléatoires
    const allQuestions = [];
    for (const d of Object.keys(DOMAINS)) {
      allQuestions.push(...DOMAINS[d].questions);
    }
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const questions = shuffled.slice(0, 10);
    
    db.pendingExam[senderJid] = {
      type: "Bac",
      questions: questions,
      answers: [],
      expires: Date.now() + 300000
    };
    saveDB(db);
    
    let examText = `╭━〔 📝 𝗘𝗫𝗔𝗠𝗘𝗡 𝗗𝗨 𝗕𝗔𝗖 〕━⬣\n`;
    for (let i = 0; i < questions.length; i++) {
      examText += `\n${i+1}. ${questions[i].q}\n`;
      examText += `   A) ${questions[i].options[0]}\n`;
      examText += `   B) ${questions[i].options[1]}\n`;
      examText += `   C) ${questions[i].options[2]}\n`;
    }
    examText += `\n┃ 📌 Réponds avec : *.family exam reponse 1A 2B 3C ...*\n┃ ⏳ Délai : 5 minutes\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
    
    return await sendThemedText(client, message.key.remoteJid, examText, [], message);
  }
  
  if (diplomaType === "licence") {
    if (!user.diploma.includes("Bac")) {
      return await sendThemedText(client, message.key.remoteJid, `❌ Tu dois d'abord obtenir le Bac !`, [], message);
    }
    if (user.diploma.includes("Licence")) {
      return await sendThemedText(client, message.key.remoteJid, `❌ Tu as déjà la Licence !`, [], message);
    }
    if (user.money < 500000) {
      return await sendThemedText(client, message.key.remoteJid, `❌ Pas assez d'argent ! Coût : 500 000 $`, [], message);
    }
    if (!domain || !DOMAINS[domain]) {
      return await sendThemedText(client, message.key.remoteJid, `❌ Choisis un domaine : informatique, commerce, banque, agriculture`, [], message);
    }
    
    const questions = DOMAINS[domain].questions;
    if (questions.length < 10) {
      return await sendThemedText(client, message.key.remoteJid, `❌ Pas assez de questions pour ce domaine.`, [], message);
    }
    
    db.pendingExam[senderJid] = {
      type: "Licence",
      domain: domain,
      questions: questions,
      answers: [],
      expires: Date.now() + 300000
    };
    saveDB(db);
    
    let examText = `╭━〔 📝 𝗘𝗫𝗔𝗠𝗘𝗡 𝗗𝗘 𝗟𝗜𝗖𝗘𝗡𝗖𝗘 〕━⬣\n`;
    examText += `┃ Domaine : ${DOMAINS[domain].name}\n┃ Coût : 500 000 $\n\n`;
    for (let i = 0; i < questions.length; i++) {
      examText += `${i+1}. ${questions[i].q}\n`;
      examText += `   A) ${questions[i].options[0]}\n`;
      examText += `   B) ${questions[i].options[1]}\n`;
      examText += `   C) ${questions[i].options[2]}\n\n`;
    }
    examText += `┃ 📌 Réponds avec : *.family exam reponse 1A 2B 3C ...*\n┃ ⏳ Délai : 5 minutes\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
    
    return await sendThemedText(client, message.key.remoteJid, examText, [], message);
  }
  
  if (diplomaType === "master") {
    if (!user.diploma.includes("Licence")) {
      return await sendThemedText(client, message.key.remoteJid, `❌ Tu dois d'abord obtenir la Licence !`, [], message);
    }
    if (user.diploma.includes("Master")) {
      return await sendThemedText(client, message.key.remoteJid, `❌ Tu as déjà le Master !`, [], message);
    }
    if (user.money < 5000000) {
      return await sendThemedText(client, message.key.remoteJid, `❌ Pas assez d'argent ! Coût : 5 000 000 $`, [], message);
    }
    
    const allQuestions = DOMAINS[user.domain].questions;
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const questions = shuffled.slice(0, 8);
    
    db.pendingExam[senderJid] = {
      type: "Master",
      domain: user.domain,
      questions: questions,
      answers: [],
      expires: Date.now() + 300000
    };
    saveDB(db);
    
    let examText = `╭━〔 📝 𝗘𝗫𝗔𝗠𝗘𝗡 𝗗𝗨 𝗠𝗔𝗦𝗧𝗘𝗥 〕━⬣\n`;
    examText += `┃ Domaine : ${DOMAINS[user.domain]?.name || user.domain}\n┃ Coût : 5 000 000 $\n\n`;
    for (let i = 0; i < questions.length; i++) {
      examText += `${i+1}. ${questions[i].q}\n`;
      examText += `   A) ${questions[i].options[0]}\n`;
      examText += `   B) ${questions[i].options[1]}\n`;
      examText += `   C) ${questions[i].options[2]}\n\n`;
    }
    examText += `┃ 📌 Réponds avec : *.family exam reponse 1A 2B 3C ...*\n┃ ⏳ Délai : 5 minutes\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
    
    return await sendThemedText(client, message.key.remoteJid, examText, [], message);
  }
  
  if (diplomaType === "mba") {
    if (!user.diploma.includes("Master")) {
      return await sendThemedText(client, message.key.remoteJid, `❌ Tu dois d'abord obtenir le Master !`, [], message);
    }
    if (user.diploma.includes("MBA")) {
      return await sendThemedText(client, message.key.remoteJid, `❌ Tu as déjà le MBA !`, [], message);
    }
    if (user.money < 50000000) {
      return await sendThemedText(client, message.key.remoteJid, `❌ Pas assez d'argent ! Coût : 50 000 000 $`, [], message);
    }
    
    const allQuestions = DOMAINS[user.domain].questions;
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const questions = shuffled.slice(0, 10);
    
    db.pendingExam[senderJid] = {
      type: "MBA",
      domain: user.domain,
      questions: questions,
      answers: [],
      expires: Date.now() + 300000
    };
    saveDB(db);
    
    let examText = `╭━〔 📝 𝗘𝗫𝗔𝗠𝗘𝗡 𝗗𝗨 𝗠𝗕𝗔 〕━⬣\n`;
    examText += `┃ Domaine : ${DOMAINS[user.domain]?.name || user.domain}\n┃ Coût : 50 000 000 $\n\n`;
    for (let i = 0; i < questions.length; i++) {
      examText += `${i+1}. ${questions[i].q}\n`;
      examText += `   A) ${questions[i].options[0]}\n`;
      examText += `   B) ${questions[i].options[1]}\n`;
      examText += `   C) ${questions[i].options[2]}\n\n`;
    }
    examText += `┃ 📌 Réponds avec : *.family exam reponse 1A 2B 3C ...*\n┃ ⏳ Délai : 5 minutes\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
    
    return await sendThemedText(client, message.key.remoteJid, examText, [], message);
  }
  
  return await sendThemedText(client, message.key.remoteJid, `❌ Diplôme invalide ! Utilise : bac, licence, master, mba`, [], message);
}

// ─── Soumettre les réponses d'examen ───
async function submitExam(message, client, user, db, args) {
  const pending = db.pendingExam[senderJid];
  if (!pending || Date.now() > pending.expires) {
    delete db.pendingExam[senderJid];
    saveDB(db);
    return await sendThemedText(client, message.key.remoteJid, `❌ Aucun examen en cours ou temps écoulé !`, [], message);
  }
  
  const responseStr = args.slice(2).join(" ");
  const responses = [];
  const matches = responseStr.matchAll(/(\d+)([ABC])/gi);
  
  for (const match of matches) {
    responses.push({ num: parseInt(match[1]), answer: match[2].toUpperCase() });
  }
  
  if (responses.length !== pending.questions.length) {
    return await sendThemedText(client, message.key.remoteJid, `❌ Tu dois répondre à toutes les questions ! Format : 1A 2B 3C ...`, [], message);
  }
  
  let score = 0;
  for (const resp of responses) {
    const q = pending.questions[resp.num - 1];
    if (!q) continue;
    const correctIndex = q.options.findIndex(opt => opt === q.a);
    const correctLetter = correctIndex === 0 ? "A" : correctIndex === 1 ? "B" : "C";
    if (resp.answer === correctLetter) {
      score++;
    }
  }
  
  const requiredScore = pending.type === "Bac" ? 7 : pending.type === "Licence" ? 8 : pending.type === "Master" ? 8 : 10;
  
  if (score >= requiredScore) {
    if (pending.type === "Bac") {
      user.diploma.push("Bac");
      await sendThemedText(client, message.key.remoteJid, `🎉 *Félicitations !* Tu as obtenu le Bac avec ${score}/${pending.questions.length} !`, [], message);
    } else if (pending.type === "Licence") {
      user.diploma.push("Licence");
      user.domain = pending.domain;
      user.money -= 500000;
      await sendThemedText(client, message.key.remoteJid, `🎉 *Félicitations !* Tu as obtenu la Licence en ${DOMAINS[pending.domain]?.name || pending.domain} avec ${score}/${pending.questions.length} !\n┃ Domaine choisi : ${DOMAINS[pending.domain]?.name || pending.domain}\n┃ Bonus /work : +10%`, [], message);
    } else if (pending.type === "Master") {
      user.diploma.push("Master");
      user.money -= 5000000;
      await sendThemedText(client, message.key.remoteJid, `🎉 *Félicitations !* Tu as obtenu le Master avec ${score}/${pending.questions.length} !\n┃ Bonus /work : +20%`, [], message);
    } else if (pending.type === "MBA") {
      user.diploma.push("MBA");
      user.money -= 50000000;
      await sendThemedText(client, message.key.remoteJid, `🎉 *Félicitations !* Tu as obtenu le MBA avec ${score}/${pending.questions.length} ! Parfait ✨\n┃ Bonus /work : +30%`, [], message);
    }
    saveDB(db);
  } else {
    await sendThemedText(client, message.key.remoteJid, `❌ *Échec !* Tu as obtenu ${score}/${pending.questions.length}. Il fallait ${requiredScore}. Réessaie plus tard !`, [], message);
  }
  
  delete db.pendingExam[senderJid];
  saveDB(db);
}

// ─── Commande .family cambriolage ───
async function cambriolageCommand(message, client, user, db) {
  const now = Date.now();
  const cooldown = 30 * 60 * 1000;
  
  if (now - (user.lastCrime || 0) < cooldown) {
    const reste = Math.ceil((cooldown - (now - user.lastCrime)) / 60000);
    return await sendThemedText(client, message.key.remoteJid, `⏳ Reviens dans *${reste} min* pour cambrioler`, [], message);
  }
  
  const chance = Math.random();
  let gain = 0;
  let messageResult = "";
  
  if (chance < 0.4) {
    const perte = Math.floor(Math.random() * 50000) + 10000;
    user.money = Math.max(0, user.money - perte);
    messageResult = `❌ *ÉCHEC !* Tu t'es fait prendre ! Perte : *${fmt(perte)}*`;
    user.wanted = (user.wanted || 0) + 1;
  } else if (chance < 0.7) {
    gain = Math.floor(Math.random() * 100000) + 50000;
    user.money += gain;
    messageResult = `💰 *Petit larcin* réussi ! Gain : *${fmt(gain)}*`;
  } else if (chance < 0.9) {
    gain = Math.floor(Math.random() * 300000) + 200000;
    user.money += gain;
    messageResult = `🤑 *Casse moyen* réussi ! Gain : *${fmt(gain)}*`;
  } else {
    gain = Math.floor(Math.random() * 1000000) + 500000;
    user.money += gain;
    messageResult = `💎 *CAMBRIOLAGE ÉNORME* réussi ! Gain : *${fmt(gain)}*`;
  }
  
  user.lastCrime = now;
  saveDB(db);
  
  const themePhoto = getRandomFamilyPhoto();
  await sendThemedMessage(client, message.key.remoteJid, themePhoto, `╭━〔 🥷 𝗖𝗔𝗠𝗕𝗥𝗜𝗢𝗟𝗔𝗚𝗘 〕━⬣
┃ ${messageResult}
┃ 💵 Nouveau solde : *${fmt(user.money)}*
┃ ⚠️ Niveau recherché : ${user.wanted}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
}

// ─── Commande .family police ───
async function policeCommand(message, client, user, db) {
  const themePhoto = getRandomFamilyPhoto();
  
  if (user.wanted === 0) {
    return await sendThemedMessage(client, message.key.remoteJid, themePhoto, `╭━〔 👮 𝗣𝗢𝗟𝗜𝗖𝗘 〕━⬣\n┃ ✅ Tu es clean ! Aucun crime enregistré.\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }
  
  const amende = user.wanted * 25000;
  
  if (user.money >= amende) {
    user.money -= amende;
    const ancienWanted = user.wanted;
    user.wanted = 0;
    saveDB(db);
    
    await sendThemedMessage(client, message.key.remoteJid, themePhoto, `╭━〔 👮 𝗣𝗢𝗟𝗜𝗖𝗘 〕━⬣
┃ 🚨 Tu as été arrêté !
┃ 📜 Niveau recherché : *${ancienWanted}*
┃ 💸 Amende : *${fmt(amende)}*
┃ 💵 Nouveau solde : *${fmt(user.money)}*
┃ ✅ Tu es maintenant clean !
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  } else {
    user.money = 0;
    const ancienWanted = user.wanted;
    user.wanted = 0;
    saveDB(db);
    
    await sendThemedMessage(client, message.key.remoteJid, themePhoto, `╭━〔 👮 𝗣𝗢𝗟𝗜𝗖𝗘  -  PRISON 〕━⬣
┃ 🚨 Tu as été arrêté et envoyé en prison !
┃ 📜 Niveau recherché : *${ancienWanted}*
┃ 💸 Tu n'avais pas assez pour payer l'amende
┃ 💵 Tu as tout perdu ! Nouveau solde : *0$*
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }
}

// ─── Commande .family enquete ───
async function enqueteCommand(message, client, user, db, targetJid) {
  if (!targetJid) {
    return await sendThemedText(client, message.key.remoteJid, `❌ Mentionne quelqu'un à enquêter !\n📌 Usage : *.family enquete @user*`, [], message);
  }
  
  const targetUser = getUser(db, targetJid);
  const themePhoto = getRandomFamilyPhoto();
  
  const infos = [];
  infos.push(`👤 Nom : ${targetUser.name || "Inconnu"}`);
  infos.push(`💰 Argent : ${fmt(targetUser.money + targetUser.bank)}`);
  infos.push(`💍 Marié(e) : ${targetUser.spouse ? "Oui" : "Non"}`);
  infos.push(`👶 Enfants : ${targetUser.children.length}`);
  infos.push(`👥 Amis : ${targetUser.friends.length}`);
  infos.push(`⚠️ Recherché : ${targetUser.wanted || 0}`);
  infos.push(`🎓 Diplômes : ${targetUser.diploma.length}`);
  infos.push(`🏭 Entreprise : ${targetUser.company ? db.companies[targetUser.company]?.name || "Oui" : "Non"}`);
  
  await sendThemedMessage(client, message.key.remoteJid, themePhoto, `╭━〔 🔍 𝗥𝗔𝗣𝗣𝗢𝗥𝗧 𝗗'𝗘𝗡𝗤𝗨𝗘̂𝗧𝗘 〕━⬣
┃ ${infos.join("\n┃ ")}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [targetJid], message);
}

export default async function familyCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;
  const senderJid = message.key.participant || message.key.remoteJid;
  const senderNum = getNumero(senderJid);
  const senderName = message.pushName || senderNum;

  const db = loadDB();
  const user = getUser(db, senderJid);
  user.name = senderName;

  const sub = args[0]?.toLowerCase();
  const ctx = message.message?.extendedTextMessage?.contextInfo;
  const mentions = ctx?.mentionedJid || [];
  const targetJid = mentions[0] || null;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  // ─── COMMANDES SPÉCIALES ───
  if (sub === "noname") {
    const gain = Math.floor(Math.random() * 500000) + 100000;
    user.money += gain;
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🤫 𝗡𝗢 𝗡𝗔𝗠𝗘 〕━⬣\n┃ 💰 Tu as reçu *${fmt(gain)}* !\n┃ 💵 Nouveau solde : *${fmt(user.money)}*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
    setTimeout(async () => { try { await client.sendMessage(remoteJid, { delete: message.key }); } catch (_) {} }, 3000);
    return;
  }
  
  if (sub === "cambriolage") {
    await cambriolageCommand(message, client, user, db);
    return;
  }
  
  if (sub === "police") {
    await policeCommand(message, client, user, db);
    return;
  }
  
  if (sub === "enquete") {
    await enqueteCommand(message, client, user, db, targetJid);
    return;
  }
  
  // ─── EXAMENS ───
  if (sub === "examen" || sub === "exam") {
    const action = args[1]?.toLowerCase();
    if (action === "reponse" || action === "repondre") {
      await submitExam(message, client, user, db, args);
    } else {
      await startExam(message, client, user, db, args);
    }
    return;
  }
  
  // Intérêts bancaires
  if (now - (user.lastInterest || 0) >= day && user.bank > 0) {
    const interest = Math.floor(user.bank * 0.05);
    user.bank += interest;
    user.lastInterest = now;
    saveDB(db);
    await client.sendMessage(remoteJid, { text: `🏦 *Intérêts bancaires !* +${fmt(interest)} sur ton compte.` }).catch(() => {});
  }

  // ─── AIDE ───
  if (!sub || sub === "help" || sub === "aide") {
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 👨‍👩‍👧 𝗙𝗔𝗠𝗜𝗟𝗬 〕━⬣
┃ 👋 Bienvenue *${senderName}* !
┃
┣━━〔 👨‍👩‍👧 𝗙𝗔𝗠𝗜𝗟𝗟𝗘 〕━⬣
┃ ❏ .family marry @pseudo
┃ ❏ .family adopt @pseudo
┃ ❏ .family friend @pseudo
┃ ❏ .family divorce
┃ ❏ .family setname [nom]
┃ ❏ .family tree
┃
┣━━〔 🏦 𝗕𝗔𝗡𝗤𝗨𝗘 𝗣𝗥𝗜𝗠𝗘 𝗣𝗨𝗥𝗚𝗘 〕━⬣
┃ ❏ .family deposit <montant>
┃ ❏ .family withdraw <montant>
┃ ❏ .family loan <montant>
┃ ❏ .family repay <montant>
┃
┣━━〔 🏭 𝗘𝗡𝗧𝗥𝗘𝗣𝗥𝗜𝗦𝗘 〕━⬣
┃ ❏ .family createcompany <nom> <type>
┃ ❏ .family companyinfo
┃ ❏ .family hire @pseudo
┃ ❏ .family fire @pseudo
┃ ❏ .family work
┃ ❏ .family upgradecompany
┃
┣━━〔 💰 𝗘𝗖𝗢𝗡𝗢𝗠𝗜𝗘 〕━⬣
┃ ❏ .family acc
┃ ❏ .family daily
┃ ❏ .family pay @pseudo montant
┃ ❏ .family richlist
┃
┣━━〔 🎰 𝗝𝗘𝗨𝗫 〕━⬣
┃ ❏ .family roue <mise>
┃ ❏ .family crash <mise>
┃ ❏ .family slots <mise>
┃ ❏ .family roulette <mise>
┃
┣━━〔 🎓 𝗗𝗜𝗣𝗟𝗢𝗠𝗘𝗦 〕━⬣
┃ ❏ .family diplomes
┃ ❏ .family examen <bac/licence/master/mba> [domaine]
┃ ❏ .family examen reponse 1A 2B 3C...
┃
┣━━〔 🔫 𝗖𝗥𝗜𝗠𝗘 〕━⬣
┃ ❏ .family cambriolage
┃ ❏ .family police
┃ ❏ .family enquete @user
┃
┣━━〔 🌱 𝗝𝗔𝗥𝗗𝗜𝗡 〕━⬣
┃ ❏ .family garden
┃ ❏ .family plant [slot] [plante]
┃ ❏ .family harvest [slot]
┃
┣━━〔 👤 𝗣𝗥𝗢𝗙𝗜𝗟 〕━⬣
┃ ❏ .family me
┃
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ─── PROFIL ───
  if (sub === "me") {
    const spouse = user.spouse ? `@${getNumero(user.spouse)}` : "Célibataire";
    const company = user.company ? db.companies[user.company] : null;
    const companyInfo = company ? `\n┃ 🏭 Entreprise : *${company.name}*` : "";
    const loanInfo = user.loan > 0 ? `\n┃ 💸 Prêt : *${fmt(user.loan)}* (à rembourser)` : "";
    const wantedInfo = user.wanted > 0 ? `\n┃ ⚠️ Recherché : *${user.wanted}*` : "";
    const themePhoto = getRandomFamilyPhoto();
    
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 👤 𝗣𝗥𝗢𝗙𝗜𝗟 〕━⬣
┃ 👤 *${user.name}*
┃ 💍 Époux(se) : ${spouse}
┃ 👶 Enfants : ${user.children.length}
┃ 👥 Amis : ${user.friends.length}
┃ 👨‍👩‍👧 Famille : ${user.familyName || "Aucune"}
┃ 💰 Cash : ${fmt(user.money)}
┃ 🏦 Banque : ${fmt(user.bank)}${loanInfo}${wantedInfo}
┃ 🎓 Diplômes : ${user.diploma.length} (${user.diploma.join(", ") || "Aucun"})${companyInfo}
┃ 🏆 Domaine : ${DOMAINS[user.domain]?.name || "Non choisi"}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, user.spouse ? [user.spouse] : [], message);
  }

  // ─── DIPLOMES ───
  if (sub === "diplomes") {
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, getDiplomaDisplay(user), [], message);
  }

  // ─── ARBRE FAMILIAL ───
  if (sub === "tree") {
    const hasFamily = user.spouse || user.children.length > 0 || user.friends.length > 0;
    if (!hasFamily) {
      const themePhoto = getRandomFamilyPhoto();
      return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🌳 𝗔𝗥𝗕𝗥𝗘 𝗙𝗔𝗠𝗜𝗟𝗜𝗔𝗟 〕━⬣\n┃ ❌ Ton arbre est vide !\n┃ Ajoute des membres d'abord.\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
    }
    
    await sendThemedText(client, remoteJid, `🌳 *Génération de l'arbre familial...*`, [], message);
    
    try {
      const imageBuffer = await generateFamilyImage(client, user, db);
      const allMentions = [user.spouse, ...user.children, ...user.friends].filter(Boolean);
      await client.sendMessage(remoteJid, { image: imageBuffer, caption: `🌳 *Arbre familial de ${user.name}*\n\n> ⚡ ${config.BotName}`, mentions: allMentions }, { quoted: message });
    } catch (err) {
      console.error("Erreur tree:", err);
      await sendThemedText(client, remoteJid, `❌ Erreur lors de la génération de l'arbre.`, [], message);
    }
    return;
  }

  // ─── COMPTE ───
  if (sub === "acc") {
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 💰 𝗖𝗢𝗠𝗣𝗧𝗘 〕━⬣
┃ 👤 *${user.name}*
┃ 💵 Cash : *${fmt(user.money)}*
┃ 🏦 Banque : *${fmt(user.bank)}*
┃ 💎 Total : *${fmt(user.money + user.bank)}*
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ─── DEPOSIT ───
  if (sub === "deposit") {
    const montant = parseInt(args[1]);
    if (!montant || montant <= 0) return await sendThemedText(client, remoteJid, `❌ Usage : *.family deposit <montant>*`, [], message);
    if (user.money < montant) return await sendThemedText(client, remoteJid, `❌ Pas assez d'argent !`, [], message);
    user.money -= montant;
    user.bank += montant;
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🏦 𝗗𝗘𝗣𝗢̂𝗧 〕━⬣\n┃ ✅ *${fmt(montant)}* déposé !\n┃ 💵 Cash : ${fmt(user.money)}\n┃ 🏦 Banque : ${fmt(user.bank)}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ─── WITHDRAW ───
  if (sub === "withdraw") {
    const montant = parseInt(args[1]);
    if (!montant || montant <= 0) return await sendThemedText(client, remoteJid, `❌ Usage : *.family withdraw <montant>*`, [], message);
    if (user.bank < montant) return await sendThemedText(client, remoteJid, `❌ Pas assez en banque !`, [], message);
    user.bank -= montant;
    user.money += montant;
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🏦 𝗥𝗘𝗧𝗥𝗔𝗜𝗧 〕━⬣\n┃ ✅ *${fmt(montant)}* retiré !\n┃ 💵 Cash : ${fmt(user.money)}\n┃ 🏦 Banque : ${fmt(user.bank)}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ─── LOAN ───
  if (sub === "loan") {
    const montant = parseInt(args[1]);
    if (!montant || montant <= 0) return await sendThemedText(client, remoteJid, `❌ Usage : *.family loan <montant>*`, [], message);
    if (montant > 10000000) return await sendThemedText(client, remoteJid, `❌ Prêt maximum : 10 000 000 $`, [], message);
    if (user.loan > 0) return await sendThemedText(client, remoteJid, `❌ Tu as déjà un prêt en cours !`, [], message);
    user.loan = montant;
    user.loanInterest = montant * 0.10;
    user.money += montant;
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🏦 𝗣𝗥𝗘̂𝗧 〕━⬣\n┃ ✅ Prêt de *${fmt(montant)}* accordé !\n┃ 📈 Intérêts : 10% (${fmt(user.loanInterest)})\n┃ 📌 À rembourser : ${fmt(montant + user.loanInterest)}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ─── REPAY ───
  if (sub === "repay") {
    const montant = parseInt(args[1]);
    if (!montant || montant <= 0) return await sendThemedText(client, remoteJid, `❌ Usage : *.family repay <montant>*`, [], message);
    if (user.loan <= 0) return await sendThemedText(client, remoteJid, `❌ Tu n'as pas de prêt !`, [], message);
    if (user.money < montant) return await sendThemedText(client, remoteJid, `❌ Pas assez d'argent !`, [], message);
    user.money -= montant;
    user.loan -= montant;
    let msg = "";
    if (user.loan <= 0) {
      user.loan = 0;
      user.loanInterest = 0;
      msg = `┃ 🎉 *Prêt entièrement remboursé !*`;
    } else {
      msg = `┃ 📌 Reste : ${fmt(user.loan + user.loanInterest)}`;
    }
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🏦 𝗥𝗘𝗠𝗕𝗢𝗨𝗥𝗦𝗘𝗠𝗘𝗡𝗧 〕━⬣\n┃ ✅ Remboursement : *${fmt(montant)}*\n${msg}\n┃ 💵 Solde : ${fmt(user.money)}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ─── WORK (avec bonus diplômes) ───
  if (sub === "work") {
    const workCooldown = 8 * 60 * 60 * 1000;
    if (now - user.lastWork < workCooldown) {
      const reste = Math.ceil((workCooldown - (now - user.lastWork)) / 3600000);
      return await sendThemedText(client, remoteJid, `⏳ Reviens travailler dans *${reste}h*`, [], message);
    }
    
    let gain = Math.floor(Math.random() * 27000) + 3000;
    const diplomaBonus = user.diploma.length * 0.10;
    gain = Math.floor(gain * (1 + diplomaBonus));
    
    let companyBonus = "";
    if (user.company) {
      const company = db.companies[user.company];
      if (company) {
        const salary = Math.floor(company.revenue / 10);
        gain += salary;
        companyBonus = `\n┃ 🏭 Prime entreprise : +${fmt(salary)}`;
      }
    }
    
    user.money += gain;
    user.lastWork = now;
    saveDB(db);
    
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 💼 𝗧𝗥𝗔𝗩𝗔𝗜𝗟 〕━⬣
┃ ✅ Gain : *${fmt(gain)}* (+${Math.floor(diplomaBonus*100)}% diplômes)${companyBonus}
┃ 💵 Solde : *${fmt(user.money)}*
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ─── CREATE COMPANY ───
  if (sub === "createcompany") {
    const companyName = args[1];
    const companyType = args[2]?.toLowerCase();
    if (!companyName || !companyType) {
      const themePhoto = getRandomFamilyPhoto();
      return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🏭 𝗖𝗥𝗘𝗔𝗧𝗜𝗢𝗡 〕━⬣\n┃ ❌ Usage : *.family createcompany <nom> <type>*\n┃ 📌 Types : tech, commerce, agriculture, industrie, banque\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
    }
    if (!COMPANY_TYPES[companyType]) return await sendThemedText(client, remoteJid, `❌ Type invalide !`, [], message);
    if (user.company) return await sendThemedText(client, remoteJid, `❌ Tu possèdes déjà une entreprise !`, [], message);
    const cost = COMPANY_TYPES[companyType].cost;
    if (user.money < cost) return await sendThemedText(client, remoteJid, `❌ Pas assez ! Coût : ${fmt(cost)}`, [], message);
    user.money -= cost;
    const companyId = `company_${senderJid.replace(/[^0-9]/g, "")}`;
    createCompany(db, companyId, companyName, companyType, senderJid);
    user.company = companyId;
    user.companyPosition = "owner";
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🏭 𝗘𝗡𝗧𝗥𝗘𝗣𝗥𝗜𝗦𝗘 𝗖𝗥𝗘́𝗘́𝗘 〕━⬣\n┃ ✅ *${companyName}* créée !\n┃ 💰 Coût : ${fmt(cost)}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ─── COMPANY INFO ───
  if (sub === "companyinfo") {
    if (!user.company) return await sendThemedText(client, remoteJid, `❌ Tu n'as pas d'entreprise !`, [], message);
    const company = db.companies[user.company];
    if (!company) return await sendThemedText(client, remoteJid, `❌ Entreprise introuvable !`, [], message);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🏭 𝗜𝗡𝗙𝗢𝗦 𝗘𝗡𝗧𝗥𝗘𝗣𝗥𝗜𝗦𝗘 〕━⬣
┃ 📛 *${company.name}*
┃ 👑 Propriétaire : @${getNumero(company.owner)}
┃ 📈 Niveau : ${company.level}
┃ 💰 Revenus : ${fmt(company.revenue)}/jour
┃ 👥 Employés : ${company.employees.length}/${company.maxEmployees}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [company.owner], message);
  }

  // ─── HIRE ───
  if (sub === "hire") {
    if (!user.company) return await sendThemedText(client, remoteJid, `❌ Tu n'as pas d'entreprise !`, [], message);
    if (!targetJid) return await sendThemedText(client, remoteJid, `❌ Mentionne quelqu'un à recruter !`, [], message);
    const company = db.companies[user.company];
    if (company.owner !== senderJid) return await sendThemedText(client, remoteJid, `❌ Seul le propriétaire peut recruter !`, [], message);
    if (company.employees.length >= company.maxEmployees) return await sendThemedText(client, remoteJid, `❌ Plus de place !`, [], message);
    if (company.employees.includes(targetJid)) return await sendThemedText(client, remoteJid, `❌ Déjà employé !`, [], message);
    const targetUser = getUser(db, targetJid);
    if (targetUser.company) return await sendThemedText(client, remoteJid, `❌ Cette personne a déjà une entreprise !`, [], message);
    
    db.pendingHire[targetJid] = { from: senderJid, companyId: user.company, expires: Date.now() + 60000 };
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🏭 𝗗𝗘𝗠𝗔𝗡𝗗𝗘 𝗗'𝗘𝗠𝗕𝗔𝗨𝗖𝗛𝗘 〕━⬣
┃ 📛 Entreprise : *${company.name}*
┃ 👤 Recruteur : @${senderNum}
┃
┃ @${getNumero(targetJid)} veux-tu rejoindre cette entreprise ?
┃ ✅ *.family accept hire* pour accepter
┃ ❌ *.family decline hire* pour refuser
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [senderJid, targetJid], message);
    setTimeout(() => { if (db.pendingHire[targetJid]) { delete db.pendingHire[targetJid]; saveDB(db); } }, 60000);
    return;
  }

  // ─── ACCEPT HIRE ───
  if (sub === "accept" && args[1]?.toLowerCase() === "hire") {
    const pending = db.pendingHire[senderJid];
    if (!pending || Date.now() > pending.expires) return await sendThemedText(client, remoteJid, `❌ Aucune demande d'embauche en attente.`, [], message);
    const company = db.companies[pending.companyId];
    if (!company) return await sendThemedText(client, remoteJid, `❌ Entreprise introuvable !`, [], message);
    if (company.employees.length >= company.maxEmployees) return await sendThemedText(client, remoteJid, `❌ L'entreprise n'a plus de place !`, [], message);
    company.employees.push(senderJid);
    user.company = pending.companyId;
    user.companyPosition = "employee";
    delete db.pendingHire[senderJid];
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `✅ @${senderNum} a rejoint *${company.name}* !`, [senderJid], message);
  }

  // ─── DECLINE HIRE ───
  if (sub === "decline" && args[1]?.toLowerCase() === "hire") {
    if (db.pendingHire[senderJid]) {
      delete db.pendingHire[senderJid];
      saveDB(db);
      return await sendThemedText(client, remoteJid, `❌ Tu as refusé l'offre d'embauche.`, [], message);
    }
    return await sendThemedText(client, remoteJid, `❌ Aucune demande en attente.`, [], message);
  }

  // ─── FIRE ───
  if (sub === "fire") {
    if (!user.company) return await sendThemedText(client, remoteJid, `❌ Tu n'as pas d'entreprise !`, [], message);
    if (!targetJid) return await sendThemedText(client, remoteJid, `❌ Mentionne quelqu'un à licencier !`, [], message);
    const company = db.companies[user.company];
    if (company.owner !== senderJid) return await sendThemedText(client, remoteJid, `❌ Seul le propriétaire peut licencier !`, [], message);
    if (!company.employees.includes(targetJid)) return await sendThemedText(client, remoteJid, `❌ Cette personne n'est pas employée !`, [], message);
    company.employees = company.employees.filter(j => j !== targetJid);
    const targetUser = getUser(db, targetJid);
    targetUser.company = null;
    targetUser.companyPosition = null;
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `❌ @${getNumero(targetJid)} a été licencié de *${company.name}* !`, [targetJid], message);
  }

  // ─── UPGRADE COMPANY ───
  if (sub === "upgradecompany") {
    if (!user.company) return await sendThemedText(client, remoteJid, `❌ Tu n'as pas d'entreprise !`, [], message);
    const company = db.companies[user.company];
    if (company.owner !== senderJid) return await sendThemedText(client, remoteJid, `❌ Seul le propriétaire peut améliorer !`, [], message);
    const upgradeCost = company.level * 250000;
    if (user.money < upgradeCost) return await sendThemedText(client, remoteJid, `❌ Pas assez ! Coût : ${fmt(upgradeCost)}`, [], message);
    user.money -= upgradeCost;
    company.level++;
    company.revenue = Math.floor(company.revenue * 1.2);
    company.maxEmployees += 2;
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🏭 𝗔𝗠𝗘́𝗟𝗜𝗢𝗥𝗔𝗧𝗜𝗢𝗡 〕━⬣
┃ ✅ *${company.name}* niveau ${company.level} !
┃ 📈 Revenus : ${fmt(company.revenue)}/jour
┃ 💰 Coût : ${fmt(upgradeCost)}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ─── DAILY ───
  if (sub === "daily") {
    if (now - user.lastDaily < day) {
      const reste = Math.ceil((day - (now - user.lastDaily)) / 3600000);
      return await sendThemedText(client, remoteJid, `⏳ Reviens dans *${reste}h*`, [], message);
    }
    const gain = Math.floor(Math.random() * 15000) + 5000;
    user.money += gain;
    user.lastDaily = now;
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `✅ Daily : +${fmt(gain)} !`, [], message);
  }

  // ─── PAY ───
  if (sub === "pay") {
    if (!targetJid || !args[2]) return await sendThemedText(client, remoteJid, `❌ Usage : *.family pay @pseudo montant*`, [], message);
    const montant = parseInt(args[2]);
    if (isNaN(montant) || montant <= 0) return await sendThemedText(client, remoteJid, `❌ Montant invalide`, [], message);
    if (user.money < montant) return await sendThemedText(client, remoteJid, `❌ Pas assez d'argent !`, [], message);
    const target = getUser(db, targetJid);
    user.money -= montant;
    target.money += montant;
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `✅ *${fmt(montant)}* envoyés à @${getNumero(targetJid)} !`, [targetJid], message);
  }

  // ─── RICHLIST ───
  if (sub === "richlist") {
    const sorted = Object.values(db.users).sort((a, b) => (b.money + b.bank) - (a.money + a.bank)).slice(0, 10);
    let txt = `╭━〔 🏆 𝗧𝗢𝗣 𝟭𝟬 𝗥𝗜𝗖𝗛𝗘𝗦 〕━⬣\n`;
    sorted.forEach((u, i) => { txt += `┃ ${i + 1}. *${u.name}* — ${fmt(u.money + u.bank)}\n`; });
    txt += `╰━━〔 ⚡ ${config.BotName} 〕━⬣`;
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, txt, [], message);
  }

  // ─── MARRY ───
  if (sub === "marry") {
    if (!targetJid) return await sendThemedText(client, remoteJid, `❌ Mentionne quelqu'un !`, [], message);
    if (targetJid === senderJid) return await sendThemedText(client, remoteJid, `❌ Tu ne peux pas te marier avec toi-même !`, [], message);
    if (user.spouse) return await sendThemedText(client, remoteJid, `❌ Tu es déjà marié(e) !`, [], message);
    const target = getUser(db, targetJid);
    if (target.spouse) return await sendThemedText(client, remoteJid, `❌ Cette personne est déjà mariée !`, [], message);
    
    db.pendingMarriage[targetJid] = { from: senderJid, expires: Date.now() + 60000 };
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 💍 𝗗𝗘𝗠𝗔𝗡𝗗𝗘 𝗘𝗡 𝗠𝗔𝗥𝗜𝗔𝗚𝗘 〕━⬣
┃ 💞 @${senderNum} demande @${getNumero(targetJid)} en mariage !
┃
┃ @${getNumero(targetJid)} acceptes-tu ?
┃ ✅ *.family accept marry* pour accepter
┃ ❌ *.family decline marry* pour refuser
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [senderJid, targetJid], message);
    setTimeout(() => { if (db.pendingMarriage[targetJid]) { delete db.pendingMarriage[targetJid]; saveDB(db); } }, 60000);
    return;
  }

  // ─── ACCEPT MARRY ───
  if (sub === "accept" && args[1]?.toLowerCase() === "marry") {
    const pending = db.pendingMarriage[senderJid];
    if (!pending || Date.now() > pending.expires) return await sendThemedText(client, remoteJid, `❌ Aucune demande en attente.`, [], message);
    const fromUser = getUser(db, pending.from);
    user.spouse = pending.from;
    fromUser.spouse = senderJid;
    delete db.pendingMarriage[senderJid];
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `🎉 @${getNumero(pending.from)} et @${senderNum} sont maintenant mariés ! 💍`, [pending.from, senderJid], message);
  }

  // ─── DECLINE MARRY ───
  if (sub === "decline" && args[1]?.toLowerCase() === "marry") {
    if (db.pendingMarriage[senderJid]) {
      delete db.pendingMarriage[senderJid];
      saveDB(db);
      return await sendThemedText(client, remoteJid, `💔 Tu as refusé la demande en mariage.`, [], message);
    }
    return await sendThemedText(client, remoteJid, `❌ Aucune demande en attente.`, [], message);
  }

  // ─── DIVORCE ───
  if (sub === "divorce") {
    if (!user.spouse) return await sendThemedText(client, remoteJid, `❌ Tu n'es pas marié(e) !`, [], message);
    const ex = getUser(db, user.spouse);
    ex.spouse = null; user.spouse = null;
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `💔 Divorce acté.`, [], message);
  }

  // ─── ADOPT (PERSISTANT) ───
  if (sub === "adopt") {
    if (!targetJid) return await sendThemedText(client, remoteJid, `❌ Mentionne quelqu'un !`, [], message);
    if (targetJid === senderJid) return await sendThemedText(client, remoteJid, `❌ Tu ne peux pas t'adopter toi-même !`, [], message);
    if (user.children.includes(targetJid)) return await sendThemedText(client, remoteJid, `❌ Déjà adopté !`, [], message);
    
    db.pendingAdopt[targetJid] = { from: senderJid, expires: Date.now() + 60000 };
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 👶 𝗗𝗘𝗠𝗔𝗡𝗗𝗘 𝗗'𝗔𝗗𝗢𝗣𝗧𝗜𝗢𝗡 〕━⬣
┃ 👨‍👩‍👧 @${senderNum} veut adopter @${getNumero(targetJid)} !
┃
┃ @${getNumero(targetJid)} acceptes-tu d'être adopté(e) ?
┃ ✅ *.family accept adopt* pour accepter
┃ ❌ *.family decline adopt* pour refuser
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [senderJid, targetJid], message);
    setTimeout(() => { if (db.pendingAdopt[targetJid]) { delete db.pendingAdopt[targetJid]; saveDB(db); } }, 60000);
    return;
  }

  // ─── ACCEPT ADOPT (PERSISTANT) ───
  if (sub === "accept" && args[1]?.toLowerCase() === "adopt") {
    const pending = db.pendingAdopt[senderJid];
    if (!pending || Date.now() > pending.expires) return await sendThemedText(client, remoteJid, `❌ Aucune demande d'adoption en attente.`, [], message);
    const fromUser = getUser(db, pending.from);
    fromUser.children.push(senderJid);
    delete db.pendingAdopt[senderJid];
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `🎉 @${getNumero(pending.from)} a adopté @${senderNum} !`, [pending.from, senderJid], message);
  }

  // ─── DECLINE ADOPT ───
  if (sub === "decline" && args[1]?.toLowerCase() === "adopt") {
    if (db.pendingAdopt[senderJid]) {
      delete db.pendingAdopt[senderJid];
      saveDB(db);
      return await sendThemedText(client, remoteJid, `❌ Tu as refusé l'adoption.`, [], message);
    }
    return await sendThemedText(client, remoteJid, `❌ Aucune demande en attente.`, [], message);
  }

  // ─── FRIEND ───
  if (sub === "friend") {
    if (!targetJid) return await sendThemedText(client, remoteJid, `❌ Mentionne quelqu'un !`, [], message);
    if (targetJid === senderJid) return await sendThemedText(client, remoteJid, `❌ Tu ne peux pas être ami avec toi-même !`, [], message);
    if (user.friends.includes(targetJid)) return await sendThemedText(client, remoteJid, `❌ Déjà ami(e) !`, [], message);
    user.friends.push(targetJid); 
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `✅ @${getNumero(targetJid)} ajouté(e) comme ami(e) !`, [targetJid], message);
  }

  // ─── SETNAME ───
  if (sub === "setname") {
    const nom = args.slice(1).join(" ");
    if (!nom) return await sendThemedText(client, remoteJid, `❌ Usage : *.family setname MonNom*`, [], message);
    user.familyName = nom; saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `✅ Nom de famille : *${nom}*`, [], message);
  }

  // ─── JARDIN ───
  if (sub === "garden") {
    const slots = ["1", "2", "3", "4", "5"];
    let txt = `╭━〔 🌱 𝗝𝗔𝗥𝗗𝗜𝗡 〕━⬣\n`;
    for (const s of slots) {
      const p = user.garden[s];
      if (!p) { txt += `┃ Slot ${s}: 🟫 Vide\n`; continue; }
      const ready = now >= p.readyAt;
      txt += `┃ Slot ${s}: ${ready ? "✅" : "⏳"} ${p.name} ${ready ? "(prêt !)" : `(${Math.ceil((p.readyAt - now) / 60000)}min)`}\n`;
    }
    txt += `╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> Plantes : ${Object.keys(PLANTS).join(", ")}`;
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, txt, [], message);
  }

  if (sub === "plant") {
    const slot = args[1];
    const plantName = args[2]?.toLowerCase();
    if (!slot || !plantName) return await sendThemedText(client, remoteJid, `❌ Usage : *.family plant [1-5] [plante]*`, [], message);
    if (!PLANTS[plantName]) return await sendThemedText(client, remoteJid, `❌ Plante inconnue !`, [], message);
    if (user.garden[slot]) return await sendThemedText(client, remoteJid, `❌ Slot ${slot} occupé !`, [], message);
    const plant = PLANTS[plantName];
    if (user.money < plant.cost) return await sendThemedText(client, remoteJid, `❌ Pas assez ! Coût : ${fmt(plant.cost)}`, [], message);
    user.money -= plant.cost;
    user.garden[slot] = { name: plantName, readyAt: Date.now() + plant.time * 60000 };
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `✅ *${plantName}* planté slot ${slot}\n⏳ Prêt dans *${plant.time} min*`, [], message);
  }

  if (sub === "harvest") {
    const slot = args[1];
    if (!slot) return await sendThemedText(client, remoteJid, `❌ Usage : *.family harvest [slot]*`, [], message);
    const p = user.garden[slot];
    if (!p) return await sendThemedText(client, remoteJid, `❌ Slot ${slot} vide !`, [], message);
    if (Date.now() < p.readyAt) return await sendThemedText(client, remoteJid, `⏳ Pas encore prêt !`, [], message);
    const reward = PLANTS[p.name]?.reward || 1000;
    user.money += reward;
    delete user.garden[slot];
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `✅ *${p.name}* récolté ! +${fmt(reward)}`, [], message);
  }

  // ─── ROUE DE FORTUNE ───
  if (sub === "roue") {
    const mise = parseInt(args[1]);
    if (!mise || isNaN(mise)) return await sendThemedText(client, remoteJid, `❌ Usage : *.family roue <mise> (min:1000, max:6600000)`, [], message);
    if (mise < 1000) return await sendThemedText(client, remoteJid, `❌ Mise minimum : 1 000 $`, [], message);
    if (mise > 6600000) return await sendThemedText(client, remoteJid, `❌ Mise maximum : 6 600 000 $`, [], message);
    if (user.money < mise) return await sendThemedText(client, remoteJid, `❌ Pas assez d'argent ! Solde : ${fmt(user.money)}`, [], message);
    
    const segment = spinRoue();
    let nouveauSolde = user.money;
    let messageResultat = "";
    let gain = 0;
    
    if (segment.type === "idem") {
      gain = 0;
      nouveauSolde = user.money;
      messageResultat = `🔄 *IDEM* — Rien ne change !`;
    } else if (segment.type === "mult") {
      if (segment.value === 0) {
        gain = -user.money;
        nouveauSolde = 0;
        messageResultat = `💀 *${segment.name}* — Tu perds TOUT !`;
      } else {
        gain = Math.floor(user.money * segment.value);
        nouveauSolde = gain;
        if (gain >= user.money) {
          messageResultat = `✅ *${segment.name}* — Gain : *${fmt(gain - user.money)}*`;
        } else {
          messageResultat = `❌ *${segment.name}* — Perte : *${fmt(user.money - gain)}*`;
        }
      }
    } else if (segment.type === "fix") {
      gain = segment.value;
      nouveauSolde = user.money + gain;
      messageResultat = `✅ *${segment.name}* — +${fmt(gain)}`;
    }
    
    const ancienSolde = user.money;
    user.money = nouveauSolde;
    saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🎡 𝗥𝗢𝗨𝗘 𝗗𝗘 𝗙𝗢𝗥𝗧𝗨𝗡𝗘 〕━⬣
┃ 💰 Mise : *${fmt(mise)}*
┃ 🎯 Résultat : *${segment.name}*
┃
┃ ${messageResultat}
┃
┃ 💵 Ancien solde : *${fmt(ancienSolde)}*
┃ 💵 Nouveau solde : *${fmt(user.money)}*
╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ─── CRASH ───
  if (sub === "crash") {
    const mise = parseInt(args[1]);
    if (!mise || mise <= 0) return await sendThemedText(client, remoteJid, `❌ Usage : *.family crash [mise]*`, [], message);
    if (user.money < mise) return await sendThemedText(client, remoteJid, `❌ Pas assez !`, [], message);
    const multi = (Math.random() * 9 + 1).toFixed(2);
    const crash = (Math.random() * parseFloat(multi)).toFixed(2);
    const gagner = parseFloat(crash) > 1;
    const gain = gagner ? Math.floor(mise * parseFloat(crash)) : -mise;
    user.money += gain; saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 💥 𝗖𝗥𝗔𝗦𝗛 〕━⬣\n┃ 🚀 Multi : *x${multi}*\n┃ 💥 Crash : *x${crash}*\n┃ ${gagner ? `✅ +${fmt(gain)}` : `❌ -${fmt(mise)}`}\n┃ 💵 *${fmt(user.money)}*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ─── SLOTS ───
  if (sub === "slots") {
    const mise = parseInt(args[1]);
    if (!mise || mise <= 0) return await sendThemedText(client, remoteJid, `❌ Usage : *.family slots [mise]*`, [], message);
    if (user.money < mise) return await sendThemedText(client, remoteJid, `❌ Pas assez !`, [], message);
    const sym = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎"];
    const roue = [sym[Math.floor(Math.random() * 6)], sym[Math.floor(Math.random() * 6)], sym[Math.floor(Math.random() * 6)]];
    const win = roue[0] === roue[1] && roue[1] === roue[2];
    const gain = win ? mise * 3 : -mise;
    user.money += gain; saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🎰 𝗦𝗟𝗢𝗧𝗦 〕━⬣\n┃ ${roue.join(" | ")}\n┃ ${win ? `✅ JACKPOT ! +${fmt(gain)}` : `❌ -${fmt(mise)}`}\n┃ 💵 *${fmt(user.money)}*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ─── ROULETTE ───
  if (sub === "roulette") {
    const mise = parseInt(args[1]);
    if (!mise || mise <= 0) return await sendThemedText(client, remoteJid, `❌ Usage : *.family roulette [mise]*`, [], message);
    if (user.money < mise) return await sendThemedText(client, remoteJid, `❌ Pas assez !`, [], message);
    const num = Math.floor(Math.random() * 37);
    const couleur = num === 0 ? "🟢" : num % 2 === 0 ? "🔴" : "⚫";
    const win = Math.random() > 0.5;
    const gain = win ? mise : -mise;
    user.money += gain; saveDB(db);
    const themePhoto = getRandomFamilyPhoto();
    return await sendThemedMessage(client, remoteJid, themePhoto, `╭━〔 🎡 𝗥𝗢𝗨𝗟𝗘𝗧𝗧𝗘 〕━⬣\n┃ ${couleur} Numéro : *${num}*\n┃ ${win ? `✅ +${fmt(gain)}` : `❌ -${fmt(mise)}`}\n┃ 💵 *${fmt(user.money)}*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`, [], message);
  }

  // ─── Commande inconnue ───
  const themePhoto = getRandomFamilyPhoto();
  await sendThemedMessage(client, remoteJid, themePhoto, `❌ Commande inconnue !\n📌 *.family help* pour voir la liste`, [], message);
}