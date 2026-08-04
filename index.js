const fs = require("fs");
const http = require("http");
const path = require("path");
const readline = require("readline");
const crypto = require("crypto");
const qrcode = require("qrcode-terminal");
const P = require("pino");
const {
  default: makeWASocket,
  Browsers,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
  downloadContentFromMessage,
  jidDecode,
} = require("@whiskeysockets/baileys");

const PREFIXES = [".", "/", "!"];
// Keep local and Railway credentials completely separate.  A Railway volume can
// be mounted at /data; locally the credentials stay in the project directory.
const runtime = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || "local";
const defaultAuthPath = runtime === "local"
  ? path.join(__dirname, ".baileys_auth-local")
  : path.join(process.env.WA_DATA_DIR || "/data", ".baileys_auth-server");
const AUTH_PATH = process.env.WA_AUTH_PATH || defaultAuthPath;
const state = {
  activeCurhat: new Map(), activeMenfess: new Map(), activeTanya: new Map(),
  lastMedia: new Map(), config: {
    prefixes: PREFIXES,
    stickerPackname: process.env.STICKER_PACKNAME || "Made with ❤️ by DrxDvs",
    stickerAuthor: process.env.STICKER_AUTHOR || "ENGINE V6 | DrxDvs",
  },
};
const messages = new Map();
let latestQr = null;
const qrViewToken = crypto.randomBytes(24).toString("hex");

function publicBaseUrl(port) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return `http://localhost:${port}`;
}

function htmlEscape(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function qrAsText(qr) {
  let terminalQr = "";
  qrcode.generate(qr, { small: false }, (value) => { terminalQr = value; });
  // qrcode-terminal uses terminal background colours. Convert those to solid
  // blocks so the exact QR matrix is preserved in a browser <pre> element.
  return terminalQr
    .replace(/\x1b\[40m  \x1b\[0m/g, "██")
    .replace(/\x1b\[47m  \x1b\[0m/g, "  ")
    .replace(/\x1b\[[0-9;]*m/g, "");
}

function startHealthServer() {
  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port <= 0) return;
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    if (url.pathname === "/pairing-qr") {
      if (url.searchParams.get("token") !== qrViewToken) {
        response.writeHead(403, { "Content-Type": "text/plain" });
        response.end("QR link tidak valid.");
        return;
      }
      if (!latestQr) {
        response.writeHead(503, { "Content-Type": "text/plain", "Retry-After": "3" });
        response.end("QR belum siap. Muat ulang halaman dalam beberapa detik.");
        return;
      }
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      response.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>WhatsApp QR</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111;color:#fff;font-family:system-ui}main{text-align:center;padding:20px}pre{display:inline-block;margin:16px 0;background:#fff;color:#000;padding:16px;font:8px/8px monospace;letter-spacing:0;white-space:pre}p{max-width:360px;margin:auto}</style></head><body><main><h1>Scan QR WhatsApp</h1><pre>${htmlEscape(qrAsText(latestQr))}</pre><p>Scan dengan WhatsApp &rarr; Perangkat tertaut. Halaman ini otomatis tidak berlaku setelah QR diganti atau bot berhasil terhubung.</p></main></body></html>`);
      return;
    }
    if (url.pathname === "/" || url.pathname === "/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: "ok", uptime: Math.floor(process.uptime()) }));
      return;
    }
    response.writeHead(404);
    response.end("Not found");
  });
  server.listen(port, "0.0.0.0", () => console.log(`Health server aktif di port ${port}.`));
}

function normalizeNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? (digits.startsWith("0") ? `62${digits.slice(1)}` : digits) : null;
}
function toUserJid(value) { const n = normalizeNumber(value); return n ? `${n}@s.whatsapp.net` : null; }
function isPrivateUserChat(message) { return !String(message.from).endsWith("@g.us"); }
function parseCommand(body) {
  const text = String(body || "").trim();
  const prefix = PREFIXES.find((p) => text.startsWith(p));
  if (!prefix) return null;
  const [name, ...args] = text.slice(prefix.length).trim().split(/\s+/);
  return name ? { prefix, name: name.toLowerCase(), args, text: args.join(" ") } : null;
}
function loadCommands() {
  const map = new Map();
  for (const file of fs.readdirSync(path.join(__dirname, "commands"))) {
    if (!file.endsWith(".js") || file.startsWith("_")) continue;
    try {
      const command = require(path.join(__dirname, "commands", file));
      if (!command?.name || typeof command.execute !== "function") continue;
      map.set(command.name, command);
      for (const alias of command.aliases || []) map.set(alias, command);
    } catch (error) { console.warn(`Command ${file} dilewati: ${error.message}`); }
  }
  return map;
}
const commands = loadCommands();

function unwrapContent(message) {
  let content = message.message || {};
  if (content.ephemeralMessage) content = content.ephemeralMessage.message;
  if (content.viewOnceMessage) content = content.viewOnceMessage.message;
  return content;
}
function bodyOf(message) {
  const c = unwrapContent(message);
  return c.conversation || c.extendedTextMessage?.text || c.imageMessage?.caption || c.videoMessage?.caption || "";
}
function mediaNode(message) {
  const c = unwrapContent(message);
  return c.imageMessage || c.videoMessage || c.stickerMessage || c.documentMessage || null;
}
function makeMessage(sock, raw) {
  const key = raw.key;
  const from = key.remoteJid;
  const content = unwrapContent(raw);
  const quotedContext = content.extendedTextMessage?.contextInfo;
  const wrapped = {
    _raw: raw, _data: { from, chatId: from, author: key.participant },
    id: { _serialized: key.id, id: key.id, remote: from, participant: key.participant, fromMe: Boolean(key.fromMe) },
    from, to: from, author: key.participant, body: bodyOf(raw), fromMe: Boolean(key.fromMe),
    type: mediaNode(raw) ? (unwrapContent(raw).imageMessage ? "image" : "video") : "chat",
    hasMedia: Boolean(mediaNode(raw)), hasQuotedMsg: Boolean(quotedContext?.stanzaId),
    async reply(value, _unused, options = {}) {
      return sendContent(sock, from, value, { ...options, quoted: raw });
    },
    async downloadMedia() { return downloadMedia(raw); },
    async getQuotedMessage() {
      const id = unwrapContent(raw).extendedTextMessage?.contextInfo?.stanzaId;
      return id ? messages.get(`${from}:${id}`) || null : null;
    },
    async getChat() { return { id: { _serialized: from }, name: from, participants: [] }; },
    async getContact() { return { id: { _serialized: from }, number: from.split("@")[0] }; },
  };
  return wrapped;
}
function sendContent(sock, jid, content, options = {}) {
  if (typeof content === "string") return sock.sendMessage(jid, { text: content }, options);
  if (content?.data && content?.mimetype) {
    const buffer = Buffer.from(content.data, "base64");
    if (content.mimetype === "image/webp" || options.sendMediaAsSticker) {
      return sock.sendMessage(jid, { sticker: buffer }, options);
    }
    const type = content.mimetype.startsWith("video/") ? "video" : "image";
    return sock.sendMessage(jid, { [type]: buffer, caption: options.caption || "" }, options);
  }
  if (content?.id?._serialized) return sock.sendMessage(jid, { text: content.id._serialized }, options);
  return sock.sendMessage(jid, { text: String(content ?? "") }, options);
}
async function downloadMedia(raw) {
  const node = mediaNode(raw);
  if (!node || !node.url) return null;
  const kind = unwrapContent(raw).imageMessage ? "image" : unwrapContent(raw).videoMessage ? "video" : "document";
  const stream = await downloadContentFromMessage(node, kind);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return { mimetype: node.mimetype || `${kind}/*`, data: Buffer.concat(chunks).toString("base64"), filename: node.fileName };
}
function makeClient(sock) {
  return { sendMessage: (jid, content, options) => sendContent(sock, jid, content, options),
    getNumberId: async (number) => ({ _serialized: toUserJid(number) }), getContactById: async (jid) => ({ id: { _serialized: jid } }) };
}
async function handleMessage(sock, raw) {
  if (!raw.message || raw.key.remoteJid === "status@broadcast") return;
  const message = makeMessage(sock, raw);
  messages.set(`${message.from}:${raw.key.id}`, message);
  if (message.hasMedia) state.lastMedia.set(message.from, message);
  const input = parseCommand(message.body);
  console.log(`[Pesan ${message.fromMe ? "sendiri" : "masuk"}] tipe=${message.type} media=${message.hasMedia} body=${JSON.stringify(message.body)}`);
  if (input) console.log(`[Command] ${input.prefix}${input.name}`);
  const client = makeClient(sock);
  try {
    if (input) {
      const command = commands.get(input.name);
      if (!command) return message.reply("Command tidak dikenal. Ketik `.menu`.");
      return command.execute({ client, message, args: input.args, text: input.text, state, commands,
        helpers: { normalizeNumber, toUserJid, isPrivateUserChat } });
    }
    for (const name of ["menfess", "curhat", "tanya"]) {
      const command = commands.get(name);
      if (command?.handleSessionMessage && await command.handleSessionMessage({ client, message, state, helpers: { isPrivateUserChat } })) return;
    }
  } catch (error) { console.error("Error command:", error); await message.reply("Terjadi error saat memproses pesan."); }
}
async function start(selectedMode) {
  const mode = selectedMode || await chooseLoginMode();
  if (mode === "reset") {
    resetAuthSession();
    console.log("Sesi dihapus. Jalankan ulang bot untuk login kembali.");
    return;
  }
  fs.mkdirSync(AUTH_PATH, { recursive: true });
  const { state: auth, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
  let version;
  try {
    const latest = await Promise.race([
      fetchLatestBaileysVersion(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
    ]);
    version = latest.version;
    console.log(`Versi WhatsApp Web: ${version.join(".")}`);
  } catch { console.log("Versi WhatsApp Web terbaru tidak tersedia, memakai versi bawaan Baileys."); }
  let sock;
  sock = makeWASocket({
    auth,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    ...(version ? { version } : {}),
    browser: Browsers.windows("WAResource"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    // Pairing may take longer on a cloud host. Do not abort the request while
    // WhatsApp is waiting for the code entered on the phone.
    defaultQueryTimeoutMs: undefined,
  });
  sock.ev.on("creds.update", saveCreds);
  let pairingRequested = false;
  const requestPairingCode = async () => {
    if (pairingRequested || auth.creds.registered || mode !== "pairing") return;
    const phone = normalizeNumber(process.env.PAIRING_PHONE || "");
    if (!phone) throw new Error("Nomor pairing belum diisi. Set PAIRING_PHONE, contoh: 628xxxxxxxxxx");
    pairingRequested = true;
    try {
      const code = await sock.requestPairingCode(phone);
      console.log(`\nKode pairing: ${code}`);
      console.log("Buka WhatsApp > Perangkat tertaut > Tautkan perangkat > Tautkan dengan nomor telepon, lalu masukkan kode ini.\n");
    } catch (error) {
      pairingRequested = false;
      console.error(`Gagal meminta kode pairing: ${error.message}`);
    }
  };
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    // Baileys emits `qr` only after the registration handshake is ready. A
    // pairing code requested earlier can be displayed but rejected by WhatsApp.
    if (qr && mode === "pairing") void requestPairingCode();
    if (qr && mode === "qr") {
      latestQr = qr;
      const port = Number(process.env.PORT) || 3000;
      const qrUrl = `${publicBaseUrl(port)}/pairing-qr?token=${qrViewToken}`;
      console.log(`Buka link ini untuk scan QR WhatsApp: ${qrUrl}`);
      if (!process.env.PUBLIC_URL && !process.env.RAILWAY_PUBLIC_DOMAIN && runtime !== "local") {
        console.warn("Set PUBLIC_URL ke domain Railway agar link QR dapat dibuka dari browser.");
      }
    }
    if (connection === "open") {
      latestQr = null;
      console.log(`Bot Baileys aktif. Nomor: ${jidDecode(sock.user?.id)?.user || sock.user?.id || "-"}`);
      console.log(`Sesi tersimpan di: ${AUTH_PATH}`);
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const reason = lastDisconnect?.error?.message || "alasan tidak diketahui";
      if (code !== DisconnectReason.loggedOut) {
        console.log(`Koneksi terputus (kode ${code || "-"}: ${reason}), menyambungkan ulang dengan mode ${mode}...`);
        setTimeout(() => start(mode), 2000);
      }
      else console.error("Sesi logout. Hapus .baileys_auth lalu jalankan ulang.");
    }
  });
  sock.ev.on("messages.upsert", ({ messages: incoming }) => incoming.forEach((raw) => handleMessage(sock, raw)));
}

function resetAuthSession() {
  if (!fs.existsSync(AUTH_PATH)) return;
  fs.rmSync(AUTH_PATH, { recursive: true, force: true });
}

async function chooseLoginMode() {
  // Pairing is the zero-interaction login flow. Set LOGIN_METHOD=qr only when
  // a QR login is explicitly preferred.
  const configured = String(process.env.LOGIN_METHOD || "qr").toLowerCase();
  const hasSession = fs.existsSync(AUTH_PATH) && fs.readdirSync(AUTH_PATH).length > 0;
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    if (configured === "pairing") return "pairing";
    if (hasSession) return "continue";
    return "qr";
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (question) => new Promise((resolve) => rl.question(question, resolve));
  console.log("\n=== WAResource Login ===");
  console.log("1. Login QR");
  console.log("2. Login Pairing");
  console.log("3. Reset sesi");
  console.log(`4. Lanjutkan sesi${hasSession ? " (tersedia)" : " (belum ada sesi)"}`);
  const choice = (await ask("Pilih [1-4]: ")).trim();
  rl.close();
  if (choice === "2") return "pairing";
  if (choice === "3") return "reset";
  if (choice === "4" && hasSession) return "continue";
  return "qr";
}
startHealthServer();
start().catch((error) => { console.error("Gagal start bot:", error); process.exit(1); });

let closing = false;
async function shutdown(signal) {
  if (closing) return;
  closing = true;
  console.log(`Menutup bot (${signal})... Sesi tetap disimpan.`);
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
