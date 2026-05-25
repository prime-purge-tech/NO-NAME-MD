markdown
<p align="center">
  <img src="https://files.catbox.moe/imvdf4.jpg" alt="NO NAME MD Banner" width="100%"/>
</p>

<h1 align="center">👻 NO NAME MD — Multi-Session + MongoDB</h1>

<p align="center">
  <strong>Un système de bot WhatsApp multi-session complet où chaque numéro de téléphone possède sa propre instance de bot</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" />
</p>

<p align="center">
  <i>✨ Chaque numéro a son propre propriétaire et sa propre configuration, le tout persistant dans MongoDB pour que les sessions survivent aux redémarrages du serveur ✨</i>
</p>

---

## 🏗️ Architecture

```

📁 NO NAME MD
├── 📄 index.js               ← HTTP server + boot logic
├── 📄 handler.js             ← Per-session command dispatcher
├── 📄 config.js              ← Global bot config (name, newsletters…)
│
├── 📁 lib/
│   ├── 📄 db.js              ← MongoDB connection + Sessions/Creds helpers
│   ├── 📄 mongoAuthState.js  ← Baileys auth state backed by MongoDB
│   └── 📄 sessionManager.js  ← Start/stop/reload bot sessions
│
├── 📁 public/
│   └── 📄 pair.html          ← User-facing pairing page
│
├── 📁 commands/              ← All bot commands (unchanged)
│
└── 📄 .env                   ← Environment variables

```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.example .env
# Edit .env and set MONGO_URI
```

Pour MongoDB Atlas (recommandé pour Render/Railway) :

```env
MONGO_URI=mongodb+srv://user:password@cluster.xxxxx.mongodb.net/noname_md
PORT=8077
```

3. Start

```bash
npm start
```

Le bot va :

1. 🔌 Se connecter à MongoDB
2. 🌐 Démarrer le serveur HTTP sur le port 8077
3. 🔄 Restaurer automatiquement toutes les sessions validées depuis la base de données

---

📱 Comment les utilisateurs se connectent

<p align="center">
  <img src="https://files.catbox.moe/1mmsk0.jpg" alt="Pairing Steps" width="80%"/>
</p>

1. 🌐 Ouvrir http://ton-serveur:8077/pair
2. 📞 Entrer leur numéro WhatsApp (indicatif + numéro, sans le +)
3. 🔘 Cliquer sur Get Pairing Code
4. 📱 Ouvrir WhatsApp → Paramètres → Appareils connectés → Connecter un appareil → Entrer le code manuellement
5. ✅ Terminé ! Leur bot est maintenant actif et redémarre automatiquement au redémarrage du serveur

---

🗄️ Collections MongoDB

Collection Objectif
sessions Métadonnées des sessions (numero, status, config)
auth_keys Clés d'état d'authentification Baileys par session
creds Sauvegarde brute des identifiants

Exemple de document session

```json
{
  "numero": "24177994005",
  "status": "validated",
  "config": {
    "owner": "24177994005",
    "mode": "public",
    "prefix": "."
  },
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T12:00:00Z"
}
```

---

🌐 API HTTP

Méthode Endpoint Description
GET /pair Page de connexion (HTML)
GET /api/status Statistiques (total/connecté)
GET /api/sessions Liste toutes les sessions
GET /api/session/:numero Infos d'une session
POST /api/pair Demander un code {numero}
POST /api/session/:numero/stop Arrêter une session
POST /api/session/:numero/restart Redémarrer une session
DELETE /api/session/:numero Supprimer session + clés

---

⚙️ Configuration par Session

Chaque session possède sa propre configuration stockée dans MongoDB :

```json
{
  "owner": "24177994005",
  "mode": "public",
  "prefix": "."
}
```

Le owner est détecté automatiquement lors de la première connexion de la session (c'est le numéro qui a fait le pairing).

Les commandes peuvent mettre à jour cette configuration par session en utilisant updateConfig(newConfig) — les modifications persistent automatiquement dans MongoDB.

---

🔄 Cycle de vie d'une session

```
📱 User demande un code
   ↓
🔧 Client temporaire créé
   ↓
📨 Code envoyé à l'utilisateur
   ↓
📱 User entre le code dans WhatsApp
   ↓
🔌 connection.open se déclenche
   ↓
💾 Session sauvegardée comme "validated" dans MongoDB
   ↓
🚀 Session réelle démarrée

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 Redémarrage du serveur :
   ↓
🔌 connectDB()
   ↓
🔄 reloadValidatedSessions()
   ↓
🚀 Toutes les sessions "validated" sont redémarrées
```

---

🚢 Déploiement sur Render.com

1. 📝 Créer un Web Service et pointer vers ce dépôt
2. ⚙️ Définir la Start Command : npm start
3. 🔐 Ajouter la Variable d'environnement : MONGO_URI=mongodb+srv://...
4. 🆓 Utiliser un cluster MongoDB Atlas gratuit (512 MB, largement suffisant pour des centaines de sessions)

---

📦 Dépendances principales

```json
{
  "@whiskeysockets/baileys": "^6.7.8",  // WhatsApp Web API
  "mongodb": "^6.0.0",                  // Native MongoDB driver
  "pino": "^9.6.0",                     // Logger
  "@hapi/boom": "^10.0.1",              // Error handling
  "express": "^4.18.0",                 // HTTP server
  "axios": "^1.7.9"                     // HTTP requests
}
```

---

🎨 Commandes du bot

Commande Description
.pair 241XXXXXXXX Connecter un WhatsApp
.status Voir état du bot
.disconnect Déconnecter
.help Aide complète
.mode public/private Changer le mode
.broadcast Envoyer un message à tous les groupes

---

👑 Créateur

<p align="center">
  <img src="https://img.shields.io/badge/DEV-@dev_no_namee-blue?style=for-the-badge&logo=telegram" />
</p>

<p align="center">
  <a href="https://t.me/dev_no_namee">
    <img src="https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" />
  </a>
  <a href="https://t.me/prime_purge_tech">
    <img src="https://img.shields.io/badge/Prime%20Tech-FF0000?style=for-the-badge&logo=telegram&logoColor=white" />
  </a>
</p>

---

📄 Licence

MIT © NO NAME MD

---

<p align="center">
  <i>👻 NO NAME MD — Le bot WhatsApp nouvelle génération 👻</i>
</p>
```
