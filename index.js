const fs = require("fs");
const path = require("path");
const readline = require("readline");
const qrcode = require("qrcode-terminal");
const P = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadContentFromMessage,
  jidDecode,
} = require("@whiskeysockets/baileys");

const PREFIXES = [".", "/", "!"];
const AUTH_PATH = process.env.WA_AUTH_PATH || path.join(__dirname, ".baileys_auth");
const state = {
  activeCurhat: new Map(), activeMenfess: new Map(), activeTanya: new Map(),
  lastMedia: new Map(), config: {
    prefixes: PREFIXES,
    stickerPackname: process.env.STICKER_PACKNAME || "Made with ❤️ by DrxDvs",
    stickerAuthor: process.env.STICKER_AUTHOR || "ENGINE V6 | DrxDvs",
  },
};
const messages = new Map();

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
  let sock;
  sock = makeWASocket({
    auth,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["WAResource", "Chrome", "1.0.0"],
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
  });
  sock.ev.on("creds.update", saveCreds);
  if (mode === "pairing" && !auth.creds.registered) {
    const phone = normalizeNumber(process.env.PAIRING_PHONE || "");
    if (!phone) throw new Error("Nomor pairing belum diisi. Set PAIRING_PHONE, contoh: 628xxxxxxxxxx");
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phone);
        console.log(`Kode pairing: ${code}`);
        console.log("Masukkan di WhatsApp > Perangkat tertaut > Tautkan dengan nomor telepon.");
      } catch (error) { console.error(`Gagal meminta kode pairing: ${error.message}`); }
    }, 1500);
  }
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) { qrcode.generate(qr, { small: true }); console.log("Scan QR di atas untuk login bot WhatsApp MD."); }
    if (connection === "open") {
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
  const configured = String(process.env.LOGIN_METHOD || "").toLowerCase();
  const hasSession = fs.existsSync(AUTH_PATH) && fs.readdirSync(AUTH_PATH).length > 0;
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    if (hasSession) return "continue";
    return configured === "pairing" ? "pairing" : "qr";
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
