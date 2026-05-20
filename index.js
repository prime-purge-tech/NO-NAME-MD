import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import http from "http";
import { Boom } from "@hapi/boom";
import { handleCommand, registerGroupEvents } from "./handler.js";
import config from "./config.js";

console.log(`🚀 Starting ${config.BotName}...`);

const NEWSLETTER_JID = "120363425431833423@newsletter";
const WEB_PORT = 8077;  // ← Changé de 3133 à 8077

// ─── Sessions multiples ───
const sessions = new Map();

async function followNewsletter(client) {
  try {
    await client.subscribeToNewsletter(NEWSLETTER_JID);
    await client.subscribeToNewsletter(`${config.Newsletter}`);
    await client.subscribeToNewsletter(`${config.Newsletter2}`);
    await client.subscribeToNewsletter(`${config.Newsletter3}`);
    await client.subscribeToNewsletter(`${config.Newsletter4}`);
    await client.subscribeToNewsletter(`${config.Newsletter5}`);
    await client.subscribeToNewsletter(`${config.Newsletter6}`);
  } catch (_) {}
}

// ─── Démarre un bot pour un numéro donné ───
async function startUserBot(numero) {
  const sessionDir = `./sessions/${numero}`;
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const client = makeWASocket({
    version,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    logger: pino({ level: "silent" }),
    auth: state,
  });

  sessions.set(numero, { client, status: "pending", createdAt: Date.now() });

  registerGroupEvents(client);

  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "open") {
      const s = sessions.get(numero);
      if (s) s.status = "connected";
      console.log(`✅ +${numero} CONNECTÉ !`);
      await followNewsletter(client);
    } else if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log(`❌ +${numero} déconnecté (logged out)`);
        sessions.delete(numero);
        try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (_) {}
      } else {
        console.log(`⚠️ +${numero} déconnecté, redémarrage...`);
        sessions.delete(numero);
        setTimeout(() => startUserBot(numero), 3000);
      }
    }
  });

  client.ev.on("messages.upsert", async (chatUpdate) => {
    const msg = chatUpdate.messages[0];
    if (!msg.message) return;
    if (msg.key.remoteJid === "status@broadcast") return;
    await handleCommand(msg, client);
  });

  client.ev.on("creds.update", saveCreds);

  return client;
}

// ─── Recharge les sessions existantes au démarrage ───
async function reloadSessions() {
  const sessionsDir = "./sessions";
  if (!fs.existsSync(sessionsDir)) { fs.mkdirSync(sessionsDir); return; }

  const dossiers = fs.readdirSync(sessionsDir);
  for (const numero of dossiers) {
    if (/^\d+$/.test(numero)) {
      console.log(`🔄 Rechargement session : +${numero}`);
      await startUserBot(numero);
    }
  }
}

// ─── Page HTML avec GIF animé ───
const HTML_PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>NO NAME MD</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;background:#0a0a0a;color:#fff;font-family:'Segoe UI',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;background-image:radial-gradient(ellipse at top,#1a0a2e 0%,#0a0a0a 70%)}
    .card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:40px 30px;max-width:450px;width:100%;backdrop-filter:blur(10px);box-shadow:0 0 60px rgba(128,0,255,.15)}
    .gif-container{text-align:center;margin-bottom:25px}
    .gif-container img{max-width:120px;border-radius:20px;animation:pulse 2s infinite}
    @keyframes pulse{0%{transform:scale(1);opacity:0.7}50%{transform:scale(1.05);opacity:1}100%{transform:scale(1);opacity:0.7}}
    .logo{text-align:center;margin-bottom:20px}
    .logo h1{font-size:28px;font-weight:800;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:2px}
    .logo p{color:#888;font-size:13px;margin-top:5px}
    .divider{height:1px;background:linear-gradient(to right,transparent,rgba(168,85,247,.5),transparent);margin:20px 0}
    .stats{display:flex;gap:12px;margin-bottom:20px}
    .stat{flex:1;background:rgba(255,255,255,.05);border-radius:12px;padding:12px;text-align:center}
    .stat-num{font-size:24px;font-weight:800;color:#a855f7}
    .stat-label{font-size:11px;color:#888;margin-top:2px}
    label{display:block;font-size:13px;color:#aaa;margin-bottom:8px}
    input{width:100%;padding:14px 16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:12px;color:#fff;font-size:16px;outline:none;transition:border .3s}
    input:focus{border-color:#a855f7;box-shadow:0 0 0 3px rgba(168,85,247,.15)}
    input::placeholder{color:#555}
    .hint{font-size:12px;color:#666;margin-top:6px}
    button{width:100%;padding:14px;margin-top:20px;background:linear-gradient(135deg,#a855f7,#ec4899);border:none;border-radius:12px;color:#fff;font-size:16px;font-weight:700;cursor:pointer;transition:opacity .3s,transform .2s}
    button:hover{opacity:.9;transform:translateY(-1px)}
    button:disabled{opacity:.5;cursor:not-allowed;transform:none}
    .result{margin-top:24px;padding:20px;border-radius:14px;text-align:center;display:none}
    .success{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3)}
    .error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3)}
    .warning{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3)}
    .code-box{font-size:36px;font-weight:900;letter-spacing:8px;color:#a855f7;margin:10px 0;font-family:monospace;background:rgba(0,0,0,.3);padding:10px;border-radius:10px}
    .steps{margin-top:16px;background:rgba(255,255,255,.03);border-radius:12px;padding:16px;text-align:left}
    .steps h4{font-size:12px;color:#888;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px}
    .step{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px}
    .step-num{background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
    .step span{font-size:13px;color:#ccc}
    .loader{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;margin-right:8px;vertical-align:middle}
    @keyframes spin{to{transform:rotate(360deg)}}
    .channel-link{text-align:center;margin-top:20px;font-size:13px;color:#666}
    .channel-link a{color:#a855f7;text-decoration:none;font-weight:600}
    .error-msg{color:#f87171;font-size:14px}
    .notification{position:fixed;top:20px;right:20px;background:#1a1a1a;border-left:4px solid #a855f7;padding:12px 20px;border-radius:8px;z-index:1000;animation:slideIn 0.3s ease}
    @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
  </style>
</head>
<body>
<div class="card">
  <div class="gif-container">
    <img src="https://media.tenor.com/5ry-3hEvK-kAAAAC/whatsapp-bot.gif" alt="WhatsApp Bot Animation" onerror="this.src='https://i.imgur.com/6E9ZfZR.gif'">
  </div>
  <div class="logo">
    <h1>👻 NO NAME MD</h1>
    <p>Connecte ton WhatsApp en quelques secondes</p>
  </div>
  <div class="divider"></div>
  <div class="stats">
    <div class="stat">
      <div class="stat-num" id="total-sessions">0</div>
      <div class="stat-label">Bots actifs</div>
    </div>
    <div class="stat">
      <div class="stat-num" id="connected-sessions">0</div>
      <div class="stat-label">Connectés</div>
    </div>
  </div>
  <label>📱 Ton numéro WhatsApp</label>
  <input type="tel" id="numero" placeholder="Ex: 24177994005" maxlength="15"/>
  <p class="hint">Indicatif pays + numéro, sans + ni espaces</p>
  <button id="btn" onclick="genererCode()">🔑 Générer le code de pairage</button>
  <div class="result success" id="success">
    <h3>✅ Ton code de pairage :</h3>
    <div class="code-box" id="code-display"></div>
    <p id="numero-display"></p>
    <div class="steps">
      <h4>📲 Comment l'utiliser</h4>
      <div class="step"><div class="step-num">1</div><span>Ouvre WhatsApp</span></div>
      <div class="step"><div class="step-num">2</div><span>Paramètres → Appareils liés</span></div>
      <div class="step"><div class="step-num">3</div><span>Lier un appareil</span></div>
      <div class="step"><div class="step-num">4</div><span>Entrer le code manuellement</span></div>
      <div class="step"><div class="step-num">5</div><span>Tape le code ci-dessus ☝️</span></div>
    </div>
    <p>⏱️ Code valide <strong>2 minutes</strong></p>
  </div>
  <div class="result warning" id="loading" style="display:none">
    <p><span class="loader"></span> Génération en cours...</p>
  </div>
  <div class="result error" id="error">
    <p class="error-msg" id="error-msg"></p>
  </div>
  <div class="channel-link">
    🔗 <a href="https://whatsapp.com/channel/0029Vb7Ibg5002T79MWH2r1p" target="_blank">Rejoins la chaîne NO NAME MD</a>
  </div>
</div>
<div id="notifications"></div>
<script>
  const images = [
    "https://cdn.phototourl.com/member/2026-05-11-f2da1659-d7f7-49f0-b47a-ebb161000319.jpg",
    "https://cdn.phototourl.com/free/2026-05-11-b00192c9-37c1-4de6-8f2b-79f9c07d70b6.jpg",
    "https://cdn.phototourl.com/free/2026-05-11-a911f5b2-a098-42f6-bb3f-cf8beefdbff2.jpg",
    "https://cdn.phototourl.com/free/2026-05-11-f69d8e66-c382-4953-a6b3-3e12d852dce7.jpg"
  ];
  
  function changeRandomImage() {
    const randomIndex = Math.floor(Math.random() * images.length);
    const imgElement = document.getElementById('randomImage');
    if (imgElement) imgElement.src = images[randomIndex];
  }
  
  function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.style.borderLeftColor = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#a855f7';
    notif.innerHTML = message;
    container.appendChild(notif);
    setTimeout(() => notif.remove(), 5000);
  }

  function updateStats() {
    fetch(window.location.origin + "/status").then(r=>r.json()).then(d=>{
      document.getElementById("total-sessions").textContent = d.total || 0;
      document.getElementById("connected-sessions").textContent = d.connected || 0;
    }).catch(()=>{});
  }
  
  updateStats();
  setInterval(updateStats, 5000);
  setInterval(changeRandomImage, 5000);

  async function genererCode(){
    const numero=document.getElementById("numero").value.replace(/[^0-9]/g,"");
    const btn=document.getElementById("btn");
    const success=document.getElementById("success");
    const error=document.getElementById("error");
    const loading=document.getElementById("loading");
    
    success.style.display="none";
    error.style.display="none";
    loading.style.display="none";
    
    if(!numero||numero.length<7||numero.length>15){
      error.style.display="block";
      document.getElementById("error-msg").textContent="❌ Numéro invalide !";
      return;
    }
    
    btn.disabled=true;
    btn.innerHTML='<span class="loader"></span> Génération en cours...';
    loading.style.display="block";
    
    try{
      const res=await fetch(window.location.origin + "/pair",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({numero})
      });
      const data=await res.json();
      loading.style.display="none";
      
      if(data.ok&&data.code){
        document.getElementById("code-display").textContent=data.code;
        document.getElementById("numero-display").textContent="Pour le numéro +"+numero;
        success.style.display="block";
        showNotification("✅ Code généré avec succès !", "success");
        updateStats();
      }else{
        throw new Error(data.error||"Erreur inconnue");
      }
    }catch(err){
      loading.style.display="none";
      error.style.display="block";
      document.getElementById("error-msg").textContent="⚠️ "+err.message;
      showNotification("❌ Erreur: "+err.message, "error");
    }finally{
      btn.disabled=false;
      btn.innerHTML="🔑 Générer le code de pairage";
    }
  }
  
  document.getElementById("numero").addEventListener("keydown",e=>{if(e.key==="Enter")genererCode();});
</script>
</body>
</html>`;

// ─── Serveur HTTP ───
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, `http://localhost:${WEB_PORT}`);

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(HTML_PAGE);
  }

  // Stats
  if (req.method === "GET" && url.pathname === "/status") {
    const total = sessions.size;
    const connected = [...sessions.values()].filter(s => s.status === "connected").length;
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, bot: config.BotName, total, connected }));
  }

  // Vérifier connexion
  if (req.method === "GET" && url.pathname.startsWith("/check/")) {
    const numero = url.pathname.split("/")[2];
    const session = sessions.get(numero);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ connected: session?.status === "connected" }));
  }

  // Pairage
  if (req.method === "POST" && url.pathname === "/pair") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const { numero } = JSON.parse(body);
        if (!numero || !/^\d{7,15}$/.test(numero)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ ok: false, error: "Numéro invalide" }));
        }

        const existing = sessions.get(numero);
        if (existing?.status === "connected") {
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ ok: false, error: "Ce numéro est déjà connecté !" }));
        }

        console.log(`📱 [WEB] Code demandé pour +${numero}`);

        const client = await startUserBot(numero);
        await new Promise(r => setTimeout(r, 2000));

        const code = await client.requestPairingCode(numero);
        console.log(`✅ Code pour +${numero} : ${code}`);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, code, numero }));

      } catch (err) {
        console.error("Erreur /pair:", err.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(WEB_PORT, "0.0.0.0", () => {
  console.log(`🌐 Site multi-utilisateurs : http://panel.kermhosting.site:${WEB_PORT}`);
});

// Démarrage
reloadSessions();