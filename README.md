# 👻 NO NAME MD — Multi-Session + MongoDB

A complete multi-session WhatsApp bot system where **every phone number gets its own bot instance**, with its own owner and config, all persisted in MongoDB so sessions survive server restarts.

---

## 🏗️ Architecture

```
index.js               ← HTTP server + boot logic
handler.js             ← Per-session command dispatcher
config.js              ← Global bot config (name, newsletters…)

lib/
  db.js                ← MongoDB connection + Sessions/Creds helpers
  mongoAuthState.js    ← Baileys auth state backed by MongoDB
  sessionManager.js    ← Start/stop/reload bot sessions

public/
  pair.html            ← User-facing pairing page

commands/              ← All bot commands (unchanged)
```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set MONGO_URI
```

For **MongoDB Atlas** (recommended for Render/Railway):
```
MONGO_URI=mongodb+srv://user:password@cluster.xxxxx.mongodb.net/noname_md
```

### 3. Start

```bash
npm start
```

The bot will:
1. Connect to MongoDB
2. Start the HTTP server on port `8077`
3. **Auto-restore all validated sessions** from the database

---

## 📱 How Users Connect

1. Open `http://your-server:8077/pair`
2. Enter their WhatsApp number (country code + number, no `+`)
3. Click **Get Pairing Code**
4. Open WhatsApp → Settings → Linked Devices → Link a Device → Enter code manually
5. Done! Their bot is now running and will **auto-restart on server reboot**

---

## 🗄️ MongoDB Collections

| Collection   | Purpose                                      |
|-------------|----------------------------------------------|
| `sessions`  | Session metadata (numero, status, config)    |
| `auth_keys` | Baileys auth state keys per session          |
| `creds`     | (legacy) raw creds backup                   |

### Session document example

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

## 🌐 HTTP API

| Method   | Endpoint                       | Description                     |
|----------|--------------------------------|---------------------------------|
| `GET`    | `/pair`                        | Pairing page (HTML)             |
| `GET`    | `/api/status`                  | Live stats (total/connected)    |
| `GET`    | `/api/sessions`                | List all sessions from DB       |
| `GET`    | `/api/session/:numero`         | Single session info             |
| `POST`   | `/api/pair`                    | Request pairing code `{numero}` |
| `POST`   | `/api/session/:numero/stop`    | Stop a session (keep in DB)     |
| `POST`   | `/api/session/:numero/restart` | Restart a stopped session       |
| `DELETE` | `/api/session/:numero`         | Delete session + auth keys      |

---

## ⚙️ Per-Session Config

Each session has its own config stored in MongoDB:

```json
{
  "owner": "24177994005",
  "mode": "public",
  "prefix": "."
}
```

The `owner` is **auto-detected** when the session first connects (it's the number that paired).

Commands can update this config per session using `updateConfig(newConfig)` — changes persist to MongoDB automatically.

---

## 🔄 Session Lifecycle

```
User requests code → temp client created → code sent to user
  → user enters code in WhatsApp
    → connection.open fires
      → session saved as "validated" in MongoDB
        → real session started

Server restart:
  → connectDB()
    → reloadValidatedSessions()
      → all "validated" sessions restarted
```

---

## 🚢 Deploy on Render.com

1. Create a **Web Service**, point to this repo
2. Set **Start Command**: `npm start`
3. Add **Environment Variable**: `MONGO_URI=mongodb+srv://...`
4. Use a free **MongoDB Atlas** cluster (free tier = 512 MB, plenty for hundreds of sessions)

---

## 📦 Key Dependencies

- `@whiskeysockets/baileys` — WhatsApp Web API
- `mongodb` — Native MongoDB driver
- `pino` — Logger
- `@hapi/boom` — Error handling
