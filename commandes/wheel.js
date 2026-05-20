// commands/wheel.js
import config from "../config.js";
import { getThemePhoto, getThemeStyle, formatThemedMessage, sendThemedMessage, sendThemedText } from "./theme.js";
import fs from "fs";

const DEFIS_FILE = "./defis_data.json";

// ─── Base de données des défis ───
function loadDefisData() {
    try {
        if (fs.existsSync(DEFIS_FILE)) return JSON.parse(fs.readFileSync(DEFIS_FILE, "utf-8"));
    } catch (_) {}
    return { pending: {}, confirmed: {}, jokers: {}, lastWheel: {} };
}

function saveDefisData(db) {
    try { fs.writeFileSync(DEFIS_FILE, JSON.stringify(db, null, 2)); } catch (_) {}
}

function getNumero(jid = "") {
    return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

// ─── Tous les défis par catégorie ───
const DEFIS = {
    "👹 TRÈS DIFFICILE": [
        { text: "Va off @{random}", desc: "Off un membre aléatoire du groupe", type: "off_random", needConfirm: false, timeout: 0 },
        { text: "Va off 3 membres aléatoires", desc: "Off trois membres du groupe", type: "off_3_random", needConfirm: false, timeout: 0 },
        { text: "Va off un admin du groupe", desc: "Off un administrateur", type: "off_admin", needConfirm: false, timeout: 0 },
        { text: "Va off la première personne dans tes DM", desc: "Off la première personne qui t'a écrit en DM", type: "off_dm", needConfirm: false, timeout: 30 },
        { text: "Va off ton bébé (copain/copine)", desc: "Off ta moitié", type: "off_bby", needConfirm: false, timeout: 60 }
    ],
    "😈 DIFFICILE": [
        { text: "Purge un groupe de 100 membres", desc: "Supprimer 100 membres", type: "purge_100", needConfirm: true, confirmCount: 3, timeout: 0 },
        { text: "Purge le groupe de ton ami/frère/sœur", desc: "Purge le groupe d'un proche", type: "purge_friend", needConfirm: true, confirmCount: 3, timeout: 0 },
        { text: "Off un groupe (même celui-ci)", desc: "Faire off un groupe entier", type: "off_group", needConfirm: true, confirmCount: 3, timeout: 60 },
        { text: "Supprime ta certification pendant 1h", desc: "Perdre sa certification", type: "remove_certif", needConfirm: false, timeout: 30 },
        { text: "🌟 Tu es l'élu !", desc: "Aucun défi, tu es sauf !", type: "lucky", needConfirm: false, timeout: 0 }
    ],
    "🫂 GÉNÉREUX": [
        { text: "Donne un support à @{random}", desc: "Offrir un support", type: "give_support", needConfirm: false, timeout: 0 },
        { text: "Donne une méthode spam à @{random}", desc: "Partager une méthode de spam", type: "give_spam", needConfirm: false, timeout: 0 },
        { text: "Ajoute ton pire ennemi dans ce groupe", desc: "Inviter son ennemi", type: "add_enemy", needConfirm: true, confirmCount: 3, timeout: 30 },
        { text: "@{random1} va te donner un support", desc: "Recevoir un support", type: "receive_support", needConfirm: false, timeout: 60 },
        { text: "Donne 5000$ à @{random} (jeu family)", desc: "Donner de l'argent", type: "give_money", needConfirm: false, timeout: 0 }
    ],
    "🤙 APPEL": [
        { text: "Fais appel vidéo avec @{random}", desc: "Appel vidéo avec un membre aléatoire", type: "video_call", needConfirm: false, timeout: 0 },
        { text: "Fais appel vidéo avec ton pire ennemi", desc: "Appel vidéo avec ton ennemi", type: "video_call_enemy", needConfirm: true, confirmCount: 3, timeout: 0 },
        { text: "Fais appel vidéo nu avec @{random}", desc: "Appel vidéo dénudé", type: "nude_call", needConfirm: false, timeout: 15 }
    ],
    "🃏 JOKER": [
        { text: "🎁 Tu as gagné un JOKER !", desc: "Utilisable pour annuler un défi ou le donner", type: "get_joker", needConfirm: false, timeout: 0 }
    ],
    "🙊 MUET": [
        { text: "Tu passes 4 tours sans parler", desc: "Le bot te snob 4 fois", type: "mute_4", needConfirm: false, timeout: 0 }
    ],
    "🎰 JACKPOT": [
        { text: "Djack pote ! @{random} a donné", desc: "Confirmation par nom", type: "jackpot_confirm", needConfirm: true, confirmCount: 0, timeout: 0 },
        { text: "Chaque joueur doit te donner un groupe de 100 membres", desc: "Recevoir des groupes", type: "get_groups", needConfirm: true, confirmCount: 0, timeout: 0 },
        { text: "Chaque joueur doit te donner un support", desc: "Recevoir des supports", type: "get_supports", needConfirm: true, confirmCount: 0, timeout: 0 },
        { text: "🎉 Tu as gagné 3 JOKERS !", desc: "3 jokers pour toi", type: "get_3_jokers", needConfirm: false, timeout: 0 }
    ],
    "📸 PHOTO": [
        { text: "Envoie une vraie photo de toi", desc: "Photo réelle", type: "send_photo", needConfirm: true, confirmCount: 3, timeout: 15 },
        { text: "Envoie une vidéo de toi", desc: "Vidéo réelle", type: "send_video", needConfirm: true, confirmCount: 3, timeout: 15 },
        { text: "Envoie tes nudes (vue unique)", desc: "Nudes en vue unique", type: "send_nudes", needConfirm: false, timeout: 0 },
        { text: "Envoie une photo de toi (pas vue unique)", desc: "Photo normale", type: "send_photo_normal", needConfirm: false, timeout: 0 }
    ],
    "📥 CHAÎNE": [
        { text: "Nomme @{random} de ta chaîne", desc: "Nommer quelqu'un sur sa chaîne", type: "nominate", needConfirm: true, confirmCount: 1, timeout: 30 },
        { text: "Envoie du porno dans ta chaîne (supprime en 15min)", desc: "Partager du contenu", type: "send_porn", needConfirm: true, confirmCount: 0, timeout: 15 },
        { text: "Abonne-toi à la chaîne de tous les joueurs", desc: "S'abonner à tout le monde", type: "subscribe_all", needConfirm: true, confirmCount: 0, timeout: 0 },
        { text: "Tous les joueurs doivent s'abonner à ta chaîne", desc: "Recevoir des abonnés", type: "get_subscribers", needConfirm: true, confirmCount: 0, timeout: 0 }
    ],
    "💓 AMOUR": [
        { text: "Marie-toi avec @{random} (jeu family)", desc: "Se marier dans le jeu", type: "marry_random", needConfirm: false, timeout: 0 },
        { text: "Écris 'Je t'aime' en DM à @{random}", desc: "Déclaration d'amour", type: "love_dm", needConfirm: false, timeout: 0 },
        { text: "Dis à ton pire ennemi que tu l'aimes", desc: "Déclaration à l'ennemi", type: "love_enemy", needConfirm: false, timeout: 0 },
        { text: "Tag un PD", desc: "Tagger quelqu'un", type: "tag_pd", needConfirm: false, timeout: 0 },
        { text: "Envoie le numéro de ton copain/copine", desc: "Partager son numéro", type: "share_number", needConfirm: false, timeout: 0 },
        { text: "Donne ton vrai nom complet", desc: "Révéler son identité", type: "reveal_name", needConfirm: true, confirmCount: 3, timeout: 0 }
    ],
    "🎵 MUSIQUE": [
        { text: "Envoie ta meilleure musique", desc: "Partager une musique", type: "send_music", needConfirm: false, timeout: 0 },
        { text: "Envoie un audio où tu chantes", desc: "Chanter", type: "send_song", needConfirm: false, timeout: 0 }
    ],
    "💭 ÉCRIT": [
        { text: "Va écrire en DM à @{random} 'Je suis venu te off'", desc: "Message de menace", type: "threat_dm", needConfirm: false, timeout: 0 },
        { text: "Écris en DM à ton pire ennemi 'Je suis venu te off, ne me bloque pas'", desc: "Menace à l'ennemi", type: "threat_enemy", needConfirm: true, confirmCount: 3, timeout: 0 },
        { text: "Envoie tes nudes à @{random}", desc: "Partager des nudes", type: "send_nudes_to", needConfirm: true, confirmCount: 1, timeout: 0 },
        { text: "🔍 Trouve le numéro +7 de NO NAME et gagne une chaîne de 300 followers", desc: "Mission secrète", type: "find_number", needConfirm: false, timeout: 0 }
    ]
};

// ─── Obtenir un défi aléatoire ───
function getRandomDefi() {
    const categories = Object.keys(DEFIS);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const defis = DEFIS[randomCategory];
    const defi = defis[Math.floor(Math.random() * defis.length)];
    return { ...defi, category: randomCategory };
}

// ─── Remplacer les variables ───
function formatDefiText(text, groupMetadata, sender) {
    let result = text;
    const participants = groupMetadata?.participants || [];
    
    if (participants.length > 0) {
        const randomMember = participants[Math.floor(Math.random() * participants.length)];
        const randomMember2 = participants[Math.floor(Math.random() * participants.length)];
        result = result.replace(/{random}/g, randomMember ? `@${getNumero(randomMember.id)}` : "@unknown");
        result = result.replace(/{random1}/g, randomMember2 ? `@${getNumero(randomMember2.id)}` : "@unknown");
    }
    result = result.replace(/{sender}/g, `@${getNumero(sender)}`);
    
    return result;
}

// ─── Emojis pour la roue ───
const WHEEL_EMOJIS = ["🎡", "🎢", "🎠", "🎪", "🎭", "🎬", "🎯", "🎲", "🎰", "🎮", "🎳", "🎴"];

// ─── Générer la roue visuelle ───
function generateWheel(rotation = 0) {
    const positions = [];
    for (let i = 0; i < 8; i++) {
        positions.push(WHEEL_EMOJIS[(i + rotation) % WHEEL_EMOJIS.length]);
    }
    
    return `
        ╭───── ${positions[0]} ─────╮
        │  ${positions[7]}       ${positions[1]}  │
        │                         │
        │    ${positions[6]}   ${positions[2]}    │
        │                         │
        │       🎯   💫           │
        │                         │
        │    ${positions[5]}   ${positions[3]}    │
        │                         │
        │  ${positions[4]}       ${positions[4]}  │
        ╰───── 🎡 ─────╯
    `;
}

// ─── Animation de la roue ───
async function animateWheel(client, remoteJid, photo, duration = 5000) {
    const startTime = Date.now();
    let rotation = 0;
    let step = 0;
    const totalSteps = 24;
    
    for (let i = 0; i <= totalSteps; i++) {
        const progress = i / totalSteps;
        rotation = (rotation + 1) % WHEEL_EMOJIS.length;
        const wheel = generateWheel(rotation);
        const remaining = Math.ceil((duration - (Date.now() - startTime)) / 1000);
        
        let speedText = "";
        if (progress < 0.25) speedText = "💨 *Tourne rapidement...*";
        else if (progress < 0.5) speedText = "🌀 *Tourne normalement...*";
        else if (progress < 0.75) speedText = "🐌 *Ralentit...*";
        else speedText = "🎯 *Presque arrêté...*";
        
        const animMsg = `╭━━━━━━━━━━━━━━━━━━━━━━╮
┃   🎡 *LA ROUE DES DÉFIS* 🎡   ┃
┃                        ┃
${wheel}
┃                        ┃
┃   ${speedText}      ┃
┃   ⏳ ${Math.max(0, remaining)}s     ┃
┃                        ┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
        
        await client.sendMessage(remoteJid, {
            image: { url: photo },
            caption: animMsg,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.Newsletter,
                    newsletterName: config.BotName,
                    serverMessageId: 143
                }
            }
        });
        
        const waitTime = progress < 0.25 ? 150 : progress < 0.5 ? 200 : progress < 0.75 ? 300 : 400;
        await new Promise(r => setTimeout(r, waitTime));
    }
}

export default async function wheelCommand(message, client, { args } = {}) {
    const remoteJid = message.key.remoteJid;
    const senderJid = message.key.participant || message.key.remoteJid;
    const senderNum = getNumero(senderJid);
    const photo = getThemePhoto(remoteJid);
    const style = getThemeStyle(remoteJid);
    const db = loadDefisData();
    
    let groupMetadata = null;
    try { groupMetadata = await client.groupMetadata(remoteJid); } catch (_) {}
    
    const sub = args[0]?.toLowerCase();
    
    // ─── Liste des catégories ───
    if (sub === "list" || sub === "liste") {
        let listMsg = `╭━━━━━━━━━━━━━━━━━━━━━━╮\n┃   🎡 *DÉFIS DISPONIBLES* 🎡   ┃\n┣━━━━━━━━━━━━━━━━━━━━━━┫\n`;
        for (const category of Object.keys(DEFIS)) {
            const count = DEFIS[category].length;
            listMsg += `┃   ${category} (${count})\n`;
        }
        listMsg += `┣━━━━━━━━━━━━━━━━━━━━━━┫
┃   📌 *.wheel* - Lancer la roue
┃   📌 *.wheel list* - Voir les défis
┃   📌 *.wheel joker* - Utiliser JOKER
╰━━━━━━━━━━━━━━━━━━━━━━╯
> 🎨 ${style.nom} | ⚡ ${config.BotName}`;
        return await sendThemedMessage(client, remoteJid, photo, listMsg, [], message);
    }
    
    // ─── Utiliser un JOKER ───
    if (sub === "joker") {
        const userJokers = db.jokers[senderJid] || 0;
        if (userJokers <= 0) {
            return await sendThemedText(client, remoteJid, "❌ Tu n'as pas de JOKER ! Gagne-en en relevant des défis.", [], message);
        }
        db.jokers[senderJid]--;
        saveDefisData(db);
        return await sendThemedMessage(client, remoteJid, photo, `🃏 *JOKER UTILISÉ !*\n✅ Tu annules ton dernier défi.\n💎 Il te reste ${db.jokers[senderJid] || 0} JOKER(s)`, [], message);
    }
    
    // ─── Lancer la roue ───
    await animateWheel(client, remoteJid, photo, 5000);
    
    // Sélectionner un défi aléatoire
    const defi = getRandomDefi();
    const formattedText = formatDefiText(defi.text, groupMetadata, senderJid);
    const categoryEmoji = defi.category.split(" ")[0];
    
    // Vérifier si c'est un JOKER ou un cadeau
    let specialMessage = "";
    if (defi.type === "get_joker") {
        db.jokers[senderJid] = (db.jokers[senderJid] || 0) + 1;
        saveDefisData(db);
        specialMessage = `\n\n💎 *Tu as maintenant ${db.jokers[senderJid]} JOKER(s)*`;
    } else if (defi.type === "get_3_jokers") {
        db.jokers[senderJid] = (db.jokers[senderJid] || 0) + 3;
        saveDefisData(db);
        specialMessage = `\n\n💎 *Tu as maintenant ${db.jokers[senderJid]} JOKER(s)*`;
    } else if (defi.type === "lucky") {
        specialMessage = `\n\n🍀 *Tu es l'élu(e) ! Aucune sanction !*`;
    }
    
    const resultMsg = `╭━━━━━━━━━━━━━━━━━━━━━━╮
┃   ${categoryEmoji} *DÉFI TIRÉ* ${categoryEmoji}   ┃
┣━━━━━━━━━━━━━━━━━━━━━━┫
┃                        ┃
┃   📌 *Défi :*          ┃
┃   ${formattedText}     ┃
┃                        ┃
┃   📝 *Description :*   ┃
┃   ${defi.desc}         ┃
┃                        ┃
┃   🎨 *Catégorie :*     ┃
┃   ${defi.category}     ┃
┃                        ┃
┃   👤 *Joueur :*        ┃
┃   @${senderNum}        ┃
┃                        ┃
┃   🎲 *Thème :*         ┃
┃   ${style.nom}         ┃
┃                        ┃${specialMessage}
╰━━━━━━━━━━━━━━━━━━━━━━╯
> ⚡ ${config.BotName} | 🔗 ${config.Channel}`;
    
    const mentions = [senderJid];
    const match = formattedText.match(/@(\d+)/g);
    if (match) {
        match.forEach(m => {
            const num = m.replace("@", "");
            if (num) mentions.push(`${num}@s.whatsapp.net`);
        });
    }
    
    await sendThemedMessage(client, remoteJid, photo, resultMsg, mentions, message);
}