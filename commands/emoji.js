const { Resvg } = require("@resvg/resvg-js");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

const emojiPattern = /\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|\p{Emoji_Component}/u;

function parseEmoji(text) {
  return String(text || "")
    .replace(/^\s*\.emoji\s*/i, "")
    .split(/\s*\+\s*|\s+/u)
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildSvg(items) {
  const gap = 768 / (items.length + 1);
  const size = Math.min(180, Math.floor(620 / Math.max(items.length, 3)));
  const nodes = items.map((item, index) => `<text x="${Math.round(gap * (index + 1))}" y="410" text-anchor="middle" font-family="Noto Color Emoji, Apple Color Emoji, Segoe UI Emoji, sans-serif" font-size="${size}">${item}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768"><rect width="768" height="768" fill="none"/>${nodes}</svg>`;
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
      const png = new Resvg(buildSvg(items), { fitTo: { mode: "width", value: 768 } }).render().asPng();
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
      await message.reply("Emoji tidak didukung renderer server. Coba emoji standar lain.");
    }
  },
  parseEmoji,
};
