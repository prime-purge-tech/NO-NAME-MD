// commands/quiz.js - Version Multijoueur
import config from "../config.js";

// ──────────────────────────────────────────
//  QUESTIONS
// ──────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { question: "Quel est le Clan qui a pu purger Kambe TV ?", reponse: "le clan killer" },
  { question: "Quel est le slogan de la maison de journalisme KAMBE TV ?", reponse: "on peut rater sa vie mais pas les journaux de kambe" },
  { question: "Qui a amené le journalisme dans la purge ?", reponse: "daisuke kambe" },
  { question: "Quel est le nom du premier chef de la famille Butterfly ?", reponse: "inconnue boy" },
  { question: "Qui dirige le clan Hadès ?", reponse: "benny hadès" },
  { question: "J'aime la fraise est le slogan de quel clan ?", reponse: "le clan hadès" },
  { question: "Qui est MorningSTAR ?", reponse: "un journaliste" },
  { question: "Le mec idéal est un journaliste ou un Purgeur ?", reponse: "purgeur" },
  { question: "Quelle est la dernière maison de journalisme purgée par MONARQUE DES OMBRES ?", reponse: "angel tv" },
  { question: "Qui est le chef incontesté du clan des OMBRES ?", reponse: "monarque des ombres" },
  { question: "Quel est le nom du créateur originel du clan Shelby ?", reponse: "izana shelby" },
  { question: "Qui a purgé le clan Ghost pour la première fois ?", reponse: "dark gamer" },
  { question: "Qui a purgé Angel TV pour la deuxième fois ?", reponse: "saitama" },
  { question: "Quel est l'identité actuelle du créateur du clan Ghost ?", reponse: "ciel starhive" },
  { question: "Qui a créé le clan GHOST ?", reponse: "james ghost" },
  { question: "Quel est le nom de l'Éternel sous-chef de la famille Butterfly ?", reponse: "le mec idéal butterfly 16" },
  { question: "Quel est le nom du premier sous-chef du clan Big Deal ?", reponse: "grady big deal" },
  { question: "Quel est le nom du premier sous-chef du clan Hadès ?", reponse: "brunis uchiwa" },
  { question: "Quel est le titre de la deuxième génération ?", reponse: "la génération de la révolution" },
  { question: "Qui a créé Info purge 24 ?", reponse: "william james moriarty" },
  { question: "Quel clan a purgé NY HADÈS TV pour la première fois ?", reponse: "worker" },
  { question: "Quel clan a purgé Furioza pour la première fois ?", reponse: "worker" },
  { question: "Qui est marque Antoine ?", reponse: "le chef des anti purgeur de la troisième génération" },
  { question: "Qui a popularisé les images personnalisées des membres des clans ?", reponse: "benny hadès" },
  { question: "Qui a créé prime purge ?", reponse: "no name" },
  { question: "Qui a créé le premier jeu sur site de la purge ?", reponse: "no name" },
  { question: "No name c'est un journaliste ou un purgeur ?", reponse: "purgeur" }
];

// ──────────────────────────────────────────
//  INSULTES pour les perdants 😂
// ──────────────────────────────────────────
const INSULTES = [
  "t'es plus nul qu'un GPS sans internet 🗺️❌",
  "même mon chien ferait mieux et il sait pas lire 🐕",
  "tu joues au quiz comme tu vis ta vie : sans succès 💀",
  "c'est honteux, va faire le recrutement des maboule je te nomme admin 📚😭",
  "t'as confondu le quiz avec un porno ? 😫",
  "on dirait que t'as répondu avec tes pieds 🦶",
  "score de misère, retourne chez ton maître 🏫",
  "même une calculette cassée fait mieux que toi 🧮",
  "t'as pas honte de montrer ce score en public ? 😬",
  "tu mérites un trophée de la médiocrité 🏆🗑️",
];

// ──────────────────────────────────────────
//  MÉDAILLES
// ──────────────────────────────────────────
const MEDAILLES = ["🥇", "🥈", "🥉"];

// ──────────────────────────────────────────
//  SESSIONS ACTIVES
// ──────────────────────────────────────────
const activeQuizzes = new Map();
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ──────────────────────────────────────────
//  NORMALISATION
// ──────────────────────────────────────────
function normaliser(str) {
  return str.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "");
}

function verifierReponse(rep, bonne) {
  const r = normaliser(rep);
  const b = normaliser(bonne);
  if (b === "grady big deal") return r === "grady big deal" || r === "grady sadeus" || r === "grady";
  if (b === "le clan killer") return r === "le clan killer" || r === "clan killer" || r === "killer";
  if (b === "benny hades") return r === "benny hades" || r === "benny";
  return r === b;
}

// ──────────────────────────────────────────
//  MÉLANGEUR
// ──────────────────────────────────────────
function melanger(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function insulteAleatoire() {
  return INSULTES[Math.floor(Math.random() * INSULTES.length)];
}

// ──────────────────────────────────────────
//  COMMANDE PRINCIPALE
// ──────────────────────────────────────────
export default async function quizCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  // ── .quiz stop ──
  if (args && args[0]?.toLowerCase() === "stop") {
    if (activeQuizzes.has(remoteJid)) {
      const s = activeQuizzes.get(remoteJid);
      s.active = false;
      if (s.timerInterval) clearInterval(s.timerInterval);
      if (s.responseHandler) client.ev.off("messages.upsert", s.responseHandler);
      activeQuizzes.delete(remoteJid);
      await client.sendMessage(remoteJid, {
        text: `╭━〔 📚 𝐐𝐔𝐈𝐙 〕━⬣\n┃ ❌ Quiz stoppé !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
      });
    } else {
      await client.sendMessage(remoteJid, {
        text: `╭━〔 📚 𝐐𝐔𝐈𝐙 〕━⬣\n┃ ⚠️ Aucun quiz en cours.\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
      });
    }
    return;
  }

  // ── Déjà actif ? ──
  if (activeQuizzes.has(remoteJid)) {
    await client.sendMessage(remoteJid, {
      text: `╭━〔 📚 𝐐𝐔𝐈𝐙 〕━⬣\n┃ ⚠️ Un quiz est déjà en cours !\n┃ 📌 *.quiz stop* pour l'arrêter\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
    return;
  }

  // ──────────────────────────────────────────
  //  PHASE 1 — INSCRIPTION (30s)
  // ──────────────────────────────────────────

  // Joueurs : Map< jid, { name, score } >
  const joueurs = new Map();
  let phaseInscription = true;

  const session = {
    active: true,
    joueurs,
    questions: melanger(QUIZ_QUESTIONS).slice(0, 10),
    currentIndex: 0,
    timerInterval: null,
    responseHandler: null,
    phaseInscription: true,
  };

  activeQuizzes.set(remoteJid, session);

  await client.sendMessage(remoteJid, {
    text: `╭━〔 📚 𝐐𝐔𝐈𝐙 𝐌𝐔𝐋𝐓𝐈𝐉𝐎𝐔𝐄𝐔𝐑 〕━⬣
┃ 🎯 ${session.questions.length} questions au programme
┃ ⏰ 30 secondes pour rejoindre !
┃
┃ 👉 Écris *join* pour participer
┃ 💡 Seuls les joueurs inscrits peuvent répondre
┃ 🏆 Le premier à donner la bonne réponse gagne +1 pt
┃ 📌 *.quiz stop* pour annuler
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
  });

  // Handler d'inscription
  const joinHandler = async (chatUpdate) => {
    const msg = chatUpdate.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    if (msg.key.remoteJid !== remoteJid) return;
    if (!session.phaseInscription) return;

    let text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if (normaliser(text) !== "join") return;

    const jid = msg.key.participant || msg.key.remoteJid;
    const name = msg.pushName || jid.replace(/[^0-9]/g, "");

    if (!joueurs.has(jid)) {
      joueurs.set(jid, { name, score: 0, reponsesQuiz: 0 });
      await client.sendMessage(remoteJid, {
        text: `✅ *${name}* a rejoint le quiz ! (${joueurs.size} joueur${joueurs.size > 1 ? "s" : ""})`,
        mentions: [jid]
      });
    }
  };

  client.ev.on("messages.upsert", joinHandler);

  // Compte à rebours inscription
  let tempsInscription = 30;
  await new Promise((resolve) => {
    const t = setInterval(async () => {
      tempsInscription -= 10;
      if (!session.active) { clearInterval(t); resolve(); return; }
      if (tempsInscription === 20 || tempsInscription === 10) {
        await client.sendMessage(remoteJid, {
          text: `⏰ Plus que *${tempsInscription}s* pour écrire *join* ! (${joueurs.size} inscrit${joueurs.size > 1 ? "s" : ""})`
        }).catch(() => {});
      }
      if (tempsInscription <= 0) { clearInterval(t); resolve(); }
    }, 10000);
  });

  client.ev.off("messages.upsert", joinHandler);
  session.phaseInscription = false;

  // Pas assez de joueurs
  if (!session.active) return;

  if (joueurs.size === 0) {
    await client.sendMessage(remoteJid, {
      text: `╭━〔 📚 𝐐𝐔𝐈𝐙 〕━⬣\n┃ 😴 Personne n'a rejoint... Quiz annulé !\n┃ 📌 *.quiz* pour réessayer\n╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });
    activeQuizzes.delete(remoteJid);
    return;
  }

  // Liste des joueurs inscrits
  const listeJoueurs = [...joueurs.values()].map(j => `┃ 👤 ${j.name}`).join("\n");
  await client.sendMessage(remoteJid, {
    text: `╭━〔 🚀 C'EST PARTI ! 〕━⬣
${listeJoueurs}
┃
┃ 🔥 ${joueurs.size} joueur${joueurs.size > 1 ? "s" : ""} en lice !
┃ ⚡ Le quiz commence dans 3 secondes...
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
  });

  await delay(3000);

  // ──────────────────────────────────────────
  //  PHASE 2 — QUESTIONS
  // ──────────────────────────────────────────

  // Pour chaque question : qui a déjà répondu (juste ou faux)
  let reponsesRecues = new Map(); // jid → reponse
  let gagnantQuestion = null;     // jid du premier qui a bon
  let questionTerminee = false;

  async function terminerQuestion(timeoutForce = false) {
    if (questionTerminee) return;
    questionTerminee = true;

    if (session.timerInterval) { clearInterval(session.timerInterval); session.timerInterval = null; }

    const q = session.questions[session.currentIndex];

    if (gagnantQuestion) {
      const gagnant = joueurs.get(gagnantQuestion);
      await client.sendMessage(remoteJid, {
        text: `╭━〔 ✅ BONNE RÉPONSE 〕━⬣
┃ 🏆 *${gagnant.name}* a trouvé en premier !
┃ 📖 Réponse : *${q.reponse}*
┃ 🎯 Score : ${gagnant.score} pt${gagnant.score > 1 ? "s" : ""}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`,
        mentions: [gagnantQuestion]
      });
    } else {
      await client.sendMessage(remoteJid, {
        text: `╭━〔 ⏰ TEMPS ÉCOULÉ 〕━⬣
┃ 😬 Personne n'a trouvé !
┃ 📖 Réponse : *${q.reponse}*
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
      });
    }

    session.currentIndex++;
    await delay(2500);

    if (session.currentIndex >= session.questions.length) {
      await terminerQuiz();
    } else {
      await lancerQuestion();
    }
  }

  async function lancerQuestion() {
    if (!session.active) return;

    reponsesRecues = new Map();
    gagnantQuestion = null;
    questionTerminee = false;

    const q = session.questions[session.currentIndex];
    const num = session.currentIndex + 1;
    const total = session.questions.length;

    // Scoreboard rapide
    const scores = [...joueurs.entries()]
      .sort((a, b) => b[1].score - a[1].score)
      .map(([, j]) => `┃ ${j.name} : ${j.score} pt${j.score > 1 ? "s" : ""}`)
      .join("\n");

    await client.sendMessage(remoteJid, {
      text: `╭━〔 📚 QUESTION ${num}/${total} 〕━⬣
┃ ❓ *${q.question}*
┃ ⏳ 30 secondes !
┃ 💬 Tous les joueurs doivent répondre
╰━━〔 ⚡ ${config.BotName} 〕━⬣`
    });

    // Timer
    let tempsRestant = 30;
    session.timerInterval = setInterval(async () => {
      tempsRestant--;
      if (!session.active) { clearInterval(session.timerInterval); return; }

      // Rappels
      if ((tempsRestant === 20 || tempsRestant === 10 || tempsRestant === 5) && !questionTerminee) {
        // Qui n'a pas encore répondu ?
        const absents = [...joueurs.entries()]
          .filter(([jid]) => !reponsesRecues.has(jid))
          .map(([jid, j]) => `@${jid.replace(/[^0-9]/g, "")}`);

        if (absents.length > 0) {
          await client.sendMessage(remoteJid, {
            text: `⏰ *${tempsRestant}s* restantes ! En attente de : ${absents.join(", ")}`,
            mentions: [...joueurs.keys()].filter(jid => !reponsesRecues.has(jid))
          }).catch(() => {});
        }
      }

      if (tempsRestant <= 0 && !questionTerminee) {
        clearInterval(session.timerInterval);
        await terminerQuestion(true);
      }
    }, 1000);
  }

  // Handler des réponses des joueurs
  const responseHandler = async (chatUpdate) => {
    const msg = chatUpdate.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    if (msg.key.remoteJid !== remoteJid) return;
    if (!session.active || questionTerminee) return;

    const jid = msg.key.participant || msg.key.remoteJid;

    // ✅ Seuls les joueurs inscrits
    if (!joueurs.has(jid)) return;

    let text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if (!text || text.startsWith(".")) return;

    // Déjà répondu cette question ?
    if (reponsesRecues.has(jid)) return;

    reponsesRecues.set(jid, text);

    const q = session.questions[session.currentIndex];
    const joueur = joueurs.get(jid);
    const correct = verifierReponse(text, q.reponse);

    if (correct && !gagnantQuestion) {
      // Premier à avoir la bonne réponse !
      gagnantQuestion = jid;
      joueur.score++;

      await client.sendMessage(remoteJid, {
        text: `🎯 @${jid.replace(/[^0-9]/g, "")} a répondu — en attente des autres...`,
        mentions: [jid]
      }).catch(() => {});

      // Vérifier si tout le monde a répondu
      const tousOntRepondu = [...joueurs.keys()].every(j => reponsesRecues.has(j));
      if (tousOntRepondu) await terminerQuestion();

    } else if (!correct) {
      await client.sendMessage(remoteJid, {
        text: `❌ @${jid.replace(/[^0-9]/g, "")} a répondu (faux 😬)`,
        mentions: [jid]
      }).catch(() => {});

      // Vérifier si tout le monde a répondu
      const tousOntRepondu = [...joueurs.keys()].every(j => reponsesRecues.has(j));
      if (tousOntRepondu) await terminerQuestion();

    } else {
      // Correct mais pas le premier
      await client.sendMessage(remoteJid, {
        text: `✅ @${jid.replace(/[^0-9]/g, "")} a aussi trouvé... mais trop tard 😅`,
        mentions: [jid]
      }).catch(() => {});

      const tousOntRepondu = [...joueurs.keys()].every(j => reponsesRecues.has(j));
      if (tousOntRepondu) await terminerQuestion();
    }
  };

  session.responseHandler = responseHandler;
  client.ev.on("messages.upsert", responseHandler);

  // ──────────────────────────────────────────
  //  FIN DU QUIZ
  // ──────────────────────────────────────────
  async function terminerQuiz() {
    if (!session.active) return;
    session.active = false;

    if (session.timerInterval) clearInterval(session.timerInterval);
    if (session.responseHandler) client.ev.off("messages.upsert", session.responseHandler);

    // Tri final
    const classement = [...joueurs.entries()]
      .sort((a, b) => b[1].score - a[1].score);

    const maxScore = session.questions.length;
    const mentions = classement.map(([jid]) => jid);

    // Construire le podium
    let podium = "";
    classement.forEach(([jid, j], i) => {
      const medaille = MEDAILLES[i] || "🎖️";
      const numero = jid.replace(/[^0-9]/g, "");
      const pourcentage = Math.round((j.score / maxScore) * 100);
      podium += `┃ ${medaille} @${numero} — ${j.score} pt${j.score > 1 ? "s" : ""} (${pourcentage}%)\n`;
    });

    // Insultes pour tout sauf le premier
    let insulteSection = "";
    if (classement.length > 1) {
      insulteSection = "\n┣━━━━━━━━━━━━━━━━━━━━⬣\n┃ 😂 QUE DES MABOULE :\n";
      classement.slice(1).forEach(([jid, j]) => {
        const numero = jid.replace(/[^0-9]/g, "");
        insulteSection += `┃ @${numero} ${insulteAleatoire()}\n`;
      });
    }

    // Message au gagnant
    const gagnant = classement[0];
    const gagnantNom = gagnant[1].name;
    const gagnantJid = gagnant[0];

    await client.sendMessage(remoteJid, {
      text: `╭━〔 🏆 𝐅𝐈𝐍 𝐃𝐔 𝐐𝐔𝐈𝐙 〕━⬣
┃ 🎉 Quiz terminé ! ${classement.length} joueurs
┣━━━━━━━━━━━━━━━━━━━━⬣
┃ 📊 CLASSEMENT FINAL :
${podium}┣━━━━━━━━━━━━━━━━━━━━⬣
┃ 👑 Bravo à @${gagnantJid.replace(/[^0-9]/g, "")} !
┃ Tu domines ces loosers ! 🔥${insulteSection}┣━━━━━━━━━━━━━━━━━━━━⬣
┃ 👑 Dev : ${config.nameCreator}
╰━━〔 ⚡ ${config.BotName} 〕━⬣`,
      mentions
    });

    activeQuizzes.delete(remoteJid);
  }

  // Lancer la première question
  await lancerQuestion();
}
