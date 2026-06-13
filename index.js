const fs = require("fs");
const http = require("http");
const path = require("path");
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");

function requireDependency(moduleName) {
  try {
    return require(moduleName);
  } catch (error) {
    const isMissing =
      error &&
      error.code === "MODULE_NOT_FOUND" &&
      typeof error.message === "string" &&
      error.message.includes(`'${moduleName}'`);

    if (isMissing) {
      console.error(`Module not found: ${moduleName}`);
      console.error("Install dependency dulu:");
      console.error("  npm install");
      process.exit(1);
    }

    throw error;
  }
}

const qrcode = requireDependency("qrcode-terminal");
const { Client, LocalAuth } = requireDependency("whatsapp-web.js");

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile();

const PREFIXES = [".", "/", "!"];
const STICKER_PACKNAME = process.env.STICKER_PACKNAME || "Made with ❤️ by DrxDvs";
const STICKER_AUTHOR = process.env.STICKER_AUTHOR || "ENGINE V6 | DrxDvs";

const LOGIN_METHOD_ENV =
  (process.env.LOGIN_METHOD || process.env.WA_LOGIN_METHOD || "").toLowerCase();
const PAIRING_PHONE_ENV =
  process.env.PAIRING_PHONE || process.env.WA_PAIRING_PHONE || null;
const PAIRING_SHOW_NOTIFICATION =
  !["0", "false", "no", "off"].includes(
    String(process.env.PAIRING_SHOW_NOTIFICATION || "").toLowerCase()
  );
const PAIRING_INTERVAL_MS = Number(process.env.PAIRING_INTERVAL_MS) || 180000;
const DEFAULT_WWEBJS_DATA_PATH =
  process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, ".wwebjs_auth");
const WWEBJS_DATA_PATH =
  process.env.WWEBJS_DATA_PATH || DEFAULT_WWEBJS_DATA_PATH;
const WWEBJS_CLIENT_ID = process.env.WWEBJS_CLIENT_ID || undefined;
const PUPPETEER_EXECUTABLE_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || undefined;

const state = {
  activeCurhat: new Map(),
  activeMenfess: new Map(),
  activeTanya: new Map(),
  config: {
    prefixes: PREFIXES,
    stickerPackname: STICKER_PACKNAME,
    stickerAuthor: STICKER_AUTHOR,
  },
};

let loginMethod = "qr";
let pairingPhone = null;
let client = null;
let healthServer = null;

const runtimeStatus = {
  whatsapp: "starting",
  lastError: null,
};

function startHealthServer() {
  const rawPort = process.env.PORT;
  if (!rawPort) return null;

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port <= 0) {
    console.warn(`PORT tidak valid untuk health server: ${rawPort}`);
    return null;
  }

  const server = http.createServer((request, response) => {
    if (request.url === "/" || request.url === "/health") {
      const payload = JSON.stringify({
        status: "ok",
        whatsapp: runtimeStatus.whatsapp,
        lastError: runtimeStatus.lastError,
        uptimeSeconds: Math.floor(process.uptime()),
      });

      response.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      });
      response.end(payload);
      return;
    }

    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Not found");
  });

  server.on("error", (error) => {
    console.error("Health server gagal:", error.message);
    process.exit(1);
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`Health server aktif di port ${port}.`);
  });

  return server;
}

function normalizeNumber(rawNumber) {
  const digits = String(rawNumber || "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

function toUserJid(phone) {
  const normalized = normalizeNumber(phone);
  return normalized ? `${normalized}@c.us` : null;
}

function isPrivateUserChat(message) {
  return !message.from.endsWith("@g.us");
}

function parseCommand(body) {
  const text = String(body || "").trim();
  if (!text) return null;

  const prefix = PREFIXES.find((item) => text.startsWith(item));
  if (!prefix) return null;

  const withoutPrefix = text.slice(prefix.length).trim();
  if (!withoutPrefix) return null;

  const [rawCommand, ...args] = withoutPrefix.split(/\s+/);
  return {
    prefix,
    name: rawCommand.toLowerCase(),
    args,
    text: args.join(" ").trim(),
  };
}

function loadCommands() {
  const commandsDir = path.join(__dirname, "commands");
  const files = fs
    .readdirSync(commandsDir)
    .filter((file) => file.endsWith(".js") && !file.startsWith("_"))
    .sort();

  const commandMap = new Map();

  for (const file of files) {
    let command;

    try {
      command = require(path.join(commandsDir, file));
    } catch (error) {
      const missingMatch =
        error &&
        error.code === "MODULE_NOT_FOUND" &&
        typeof error.message === "string" &&
        error.message.match(/Cannot find module '([^']+)'/);

      if (missingMatch) {
        console.warn(
          `Skip command ${file} (dependency missing: ${missingMatch[1]}).`
        );
        continue;
      }

      throw error;
    }

    if (!command || !command.name || typeof command.execute !== "function") {
      continue;
    }

    commandMap.set(command.name, command);
    for (const alias of command.aliases || []) {
      commandMap.set(alias, command);
    }
  }

  return commandMap;
}

const commands = loadCommands();

function createClient() {
  fs.mkdirSync(WWEBJS_DATA_PATH, { recursive: true });

  const options = {
    authStrategy: new LocalAuth({
      dataPath: WWEBJS_DATA_PATH,
      clientId: WWEBJS_CLIENT_ID,
    }),
    puppeteer: {
      headless: true,
      executablePath: PUPPETEER_EXECUTABLE_PATH,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    },
  };

  if (loginMethod === "pairing") {
    options.pairWithPhoneNumber = {
      phoneNumber: pairingPhone,
      showNotification: PAIRING_SHOW_NOTIFICATION,
      intervalMs: PAIRING_INTERVAL_MS,
    };
  }

  return new Client(options);
}

function getAuthSessionPath() {
  const sessionName = WWEBJS_CLIENT_ID ? `session-${WWEBJS_CLIENT_ID}` : "session";
  return path.join(WWEBJS_DATA_PATH, sessionName);
}

function hasAuthSession() {
  return fs.existsSync(getAuthSessionPath());
}

async function removeAuthSession() {
  await fs.promises.rm(getAuthSessionPath(), {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 500,
  });
}

function setEnvLoginMethod() {
  if (LOGIN_METHOD_ENV === "qr") {
    loginMethod = "qr";
    console.log("Mode login (env): QR Code");
    return true;
  }

  if (LOGIN_METHOD_ENV === "pairing" || (!LOGIN_METHOD_ENV && PAIRING_PHONE_ENV)) {
    const normalized = normalizeNumber(PAIRING_PHONE_ENV);
    if (!normalized) {
      throw new Error(
        "LOGIN_METHOD=pairing tapi PAIRING_PHONE kosong/tidak valid (contoh 6281234567890)."
      );
    }

    loginMethod = "pairing";
    pairingPhone = normalized;
    console.log(`Mode login (env): Pairing nomor (${pairingPhone})`);
    return true;
  }

  return false;
}

async function askPairingPhone() {
  const rl = readline.createInterface({ input, output });

  try {
    const rawPhone = await rl.question(
      "Masukkan nomor WhatsApp (contoh 6281234567890 atau 081234567890): "
    );
    const normalized = normalizeNumber(rawPhone);

    if (!normalized) {
      throw new Error("Nomor tidak valid untuk pairing.");
    }

    loginMethod = "pairing";
    pairingPhone = normalized;
    console.log(`Mode login: Pairing nomor (${pairingPhone})`);
  } finally {
    rl.close();
  }
}

async function configureStartupSession() {
  const sessionExists = hasAuthSession();

  console.log("Mencari sesi WhatsApp...");
  if (sessionExists) {
    console.log(`Sesi ditemukan: ${getAuthSessionPath()}`);
  } else {
    console.log("Sesi belum ada.");
  }

  const isInteractive = Boolean(input.isTTY && output.isTTY);
  if (!isInteractive) {
    if (sessionExists) {
      console.log("Console non-interaktif, lanjut memakai sesi sekarang.");
      return;
    }

    if (!setEnvLoginMethod()) {
      loginMethod = "qr";
      console.log("Mode login: QR Code (non-interactive environment)");
      console.log(
        "Tip: set LOGIN_METHOD=pairing dan PAIRING_PHONE=628xxxxxxxxxx untuk pairing tanpa prompt."
      );
    }

    return;
  }

  while (true) {
    const currentSessionExists = hasAuthSession();
    const rl = readline.createInterface({ input, output });
    let choice;

    try {
      console.log("");
      console.log("=== Koneksi WhatsApp ===");
      console.log("1. Login QR");
      console.log("2. Login Pairing Kode");
      console.log("3. Reset Sesi");
      if (currentSessionExists) {
        console.log("4. Lanjut Sesi Sekarang");
      }

      choice = (await rl.question("Pilih opsi: ")).trim();
    } finally {
      rl.close();
    }

    if (choice === "1") {
      if (hasAuthSession()) {
        await removeAuthSession();
        console.log(`Sesi lama dihapus: ${getAuthSessionPath()}`);
      }

      loginMethod = "qr";
      pairingPhone = null;
      console.log("Mode login: QR Code");
      return;
    }

    if (choice === "2") {
      if (hasAuthSession()) {
        await removeAuthSession();
        console.log(`Sesi lama dihapus: ${getAuthSessionPath()}`);
      }

      await askPairingPhone();
      return;
    }

    if (choice === "3") {
      if (hasAuthSession()) {
        await removeAuthSession();
        console.log(`Sesi direset: ${getAuthSessionPath()}`);
      } else {
        console.log("Tidak ada sesi yang perlu direset.");
      }
      continue;
    }

    if (choice === "4" && hasAuthSession()) {
      console.log("Lanjut memakai sesi WhatsApp sekarang.");
      return;
    }

    console.log("Pilihan tidak valid.");
  }
}

function getConnectedNumber() {
  const wid = client?.info?.wid;
  const rawNumber = wid?.user || wid?._serialized;
  return normalizeNumber(rawNumber) || "-";
}

function registerClientEvents() {
  client.on("code", (code) => {
    runtimeStatus.whatsapp = "waiting_for_pairing_code";
    runtimeStatus.lastError = null;
    console.log("");
    console.log(`Kode pairing untuk ${pairingPhone}: ${code}`);
    console.log("Buka WhatsApp > Perangkat tertaut > Tautkan dengan nomor telepon.");
    console.log("Masukkan kode pairing di atas sebelum kedaluwarsa.");
    console.log("");
  });

  client.on("qr", (qr) => {
    if (loginMethod === "qr") {
      runtimeStatus.whatsapp = "waiting_for_qr";
      runtimeStatus.lastError = null;
      qrcode.generate(qr, { small: true });
      console.log("Scan QR di atas untuk login bot WhatsApp MD.");
    }
  });

  client.on("ready", () => {
    runtimeStatus.whatsapp = "ready";
    runtimeStatus.lastError = null;
    console.log("Bot WhatsApp MD aktif.");
    console.log(`Nomor terkoneksi: ${getConnectedNumber()}`);
  });

  client.on("authenticated", () => {
    runtimeStatus.whatsapp = "authenticated";
    runtimeStatus.lastError = null;
    console.log("Sesi WhatsApp berhasil diautentikasi.");
  });

  client.on("auth_failure", (message) => {
    runtimeStatus.whatsapp = "auth_failure";
    runtimeStatus.lastError = String(message || "Autentikasi gagal");
    console.error("Autentikasi WhatsApp gagal:", message);
  });

  client.on("disconnected", (reason) => {
    runtimeStatus.whatsapp = "disconnected";
    runtimeStatus.lastError = String(reason || "Terputus");
    console.log("Bot WhatsApp terputus:", reason);
  });

  client.on("loading_screen", (percent, message) => {
    runtimeStatus.whatsapp = "loading";
    console.log(`Loading WhatsApp ${percent}% - ${message}`);
  });

  client.on("message", async (message) => {
  try {
    if (message.fromMe) return;

    const commandInput = parseCommand(message.body);

    if (commandInput) {
      const command = commands.get(commandInput.name);

      if (!command) {
        await message.reply("Command tidak dikenal. Ketik `.menu`.");
        return;
      }

      await command.execute({
        client,
        message,
        args: commandInput.args,
        text: commandInput.text,
        state,
        commands,
        helpers: {
          normalizeNumber,
          toUserJid,
          isPrivateUserChat,
        },
      });
      return;
    }

    const menfessCommand = commands.get("menfess");
    if (menfessCommand && typeof menfessCommand.handleSessionMessage === "function") {
      const handled = await menfessCommand.handleSessionMessage({
        client,
        message,
        state,
        helpers: {
          isPrivateUserChat,
        },
      });

      if (handled) return;
    }

    const curhatCommand = commands.get("curhat");
    if (curhatCommand && typeof curhatCommand.handleSessionMessage === "function") {
      const handled = await curhatCommand.handleSessionMessage({
        client,
        message,
        state,
        helpers: {
          isPrivateUserChat,
        },
      });

      if (handled) return;
    }

    const tanyaCommand = commands.get("tanya");
    if (tanyaCommand && typeof tanyaCommand.handleSessionMessage === "function") {
      const handled = await tanyaCommand.handleSessionMessage({
        client,
        message,
        state,
        helpers: {
          isPrivateUserChat,
        },
      });

      if (handled) return;
    }
  } catch (error) {
    console.error("Error:", error);

    try {
      await message.reply("Terjadi error saat memproses pesan.");
    } catch {
    }
  }
  });
}

async function startBot() {
  await configureStartupSession();
  client = createClient();
  registerClientEvents();
  await client.initialize();
}

healthServer = startHealthServer();

startBot().catch((error) => {
  runtimeStatus.whatsapp = "failed";
  runtimeStatus.lastError = error.message;
  console.error("Gagal start bot:", error.message);
  process.exit(1);
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    console.log(`Terima signal ${signal}. Menutup bot...`);
    if (client) {
      await client.destroy();
    }

    if (healthServer) {
      await new Promise((resolve) => healthServer.close(resolve));
    }
  } catch (error) {
    console.error("Gagal menutup bot dengan rapi:", error.message);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
