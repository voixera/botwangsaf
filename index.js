const fs = require("fs");
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
const WWEBJS_DATA_PATH =
  process.env.WWEBJS_DATA_PATH || path.join(__dirname, ".wwebjs_auth");
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

const client = new Client({
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
});

let loginMethod = "qr";
let pairingPhone = null;
let pairingRequested = false;
let qrShown = false;

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
    .filter((file) => file.endsWith(".js"))
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

async function askLoginMethod() {
  if (LOGIN_METHOD_ENV === "qr") {
    loginMethod = "qr";
    console.log("Mode login (env): QR Code");
    return;
  }

  if (LOGIN_METHOD_ENV === "pairing") {
    const normalized = normalizeNumber(PAIRING_PHONE_ENV);
    if (!normalized) {
      throw new Error(
        "LOGIN_METHOD=pairing tapi PAIRING_PHONE kosong/tidak valid (contoh 6281234567890)."
      );
    }

    loginMethod = "pairing";
    pairingPhone = normalized;
    console.log(`Mode login (env): Pairing nomor (${pairingPhone})`);
    return;
  }

  const isInteractive = Boolean(input.isTTY && output.isTTY);
  if (!isInteractive) {
    loginMethod = "qr";
    console.log("Mode login: QR Code (non-interactive environment)");
    console.log(
      "Tip: set LOGIN_METHOD=pairing dan PAIRING_PHONE=628xxxxxxxxxx untuk pairing tanpa prompt."
    );
    return;
  }

  const rl = readline.createInterface({ input, output });

  try {
    console.log("Pilih metode login WhatsApp:");
    console.log("1. QR Code");
    console.log("2. Pairing Nomor");

    const choice = (await rl.question("Masukkan pilihan (1/2): ")).trim();

    if (choice === "2") {
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
      return;
    }

    loginMethod = "qr";
    console.log("Mode login: QR Code");
  } finally {
    rl.close();
  }
}

async function requestPairingCodeWithRetry() {
  if (loginMethod !== "pairing" || pairingRequested) return;

  if (typeof client.requestPairingCode !== "function") {
    console.log("Versi whatsapp-web.js ini belum mendukung pairing code. Pakai QR.");
    loginMethod = "qr";
    return;
  }

  pairingRequested = true;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const code = await client.requestPairingCode(pairingPhone);
      console.log(`Kode pairing untuk ${pairingPhone}: ${code}`);
      console.log("Masukkan kode di WhatsApp > Perangkat tertaut > Tautkan dengan nomor.");
      return;
    } catch (error) {
      console.error(
        `Gagal generate pairing code (${attempt}/3):`,
        error.message
      );

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  console.log("Pairing code gagal. Lanjutkan login dengan QR cadangan di terminal.");
}

client.on("qr", (qr) => {
  if (loginMethod === "pairing" && !qrShown) {
    console.log("Mencoba pairing code. QR di bawah tetap bisa dipakai sebagai cadangan.");
  }

  if (loginMethod === "qr" || !qrShown) {
    qrcode.generate(qr, { small: true });
    console.log("Scan QR di atas untuk login bot WhatsApp MD.");
    qrShown = true;
  }
});

client.on("ready", () => {
  console.log("Bot WhatsApp MD aktif.");
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

async function startBot() {
  await askLoginMethod();
  await client.initialize();

  if (loginMethod === "pairing") {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    await requestPairingCodeWithRetry();
  }
}

startBot().catch((error) => {
  console.error("Gagal start bot:", error.message);
  process.exit(1);
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    console.log(`Terima signal ${signal}. Menutup bot...`);
    await client.destroy();
  } catch (error) {
    console.error("Gagal menutup bot dengan rapi:", error.message);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
