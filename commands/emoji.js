const puppeteer = require("puppeteer");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

const emojiPattern = /\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|\p{Emoji_Component}/u;

function parseEmoji(text) {
  return String(text || "")
    .replace(/^\s*\.emoji\s*/i, "")
    .split(/\s*\+\s*|\s+/u)
    .map((value) => value.trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
}

async function renderEmoji(items) {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROMIUM_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
    ],
    headless: true,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 768, height: 768, deviceScaleFactor: 1 } });
    page.setDefaultNavigationTimeout(15000);
    await page.setContent(`<!doctype html><style>
      html,body { margin:0; width:768px; height:768px; overflow:hidden; background:transparent; }
      main { width:768px; height:768px; display:flex; align-items:center; justify-content:center; gap:36px; }
      span { font: 190px/1 "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif; }
    </style><main>${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</main>`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return page.screenshot({ type: "png", omitBackground: true });
  } finally {
    await browser.close();
  }
}

module.exports = {
  name: "emoji",
  description: "Menggabungkan emoji menjadi sticker.",
  usage: "emoji 😁 + 🙏",
  async execute({ message, text, state }) {
    const items = parseEmoji(text);
    if (items.length < 2 || items.length > 8 || items.some((item) => !emojiPattern.test(item))) {
      await message.reply("Format: .emoji 😁 + 🙏\nContoh: .emoji 😂 + ❤️ + 🔥\nMinimal 2 emoji, maksimal 8.");
      return;
    }
    await message.reply("╭───「 EMOJI STICKER 」───\n│ Processing your emojis...\n╰────────────────");
    try {
      const png = await renderEmoji(items);
      const webp = await new Sticker(png, {
        pack: state.config.stickerPackname,
        author: state.config.stickerAuthor,
        type: StickerTypes.FULL,
        categories: ["✨"],
        background: "#00000000",
      }).toBuffer();
      await message.reply({ mimetype: "image/webp", data: webp.toString("base64"), filename: "emoji.webp" }, undefined, { sendMediaAsSticker: true });
    } catch (error) {
      console.warn(`Emoji sticker gagal: ${error.message}`);
      await message.reply("Renderer emoji gagal dijalankan di server. Pastikan Chromium dan font Noto Color Emoji tersedia, lalu coba lagi.");
    }
  },
  parseEmoji,
};
