const { Resvg } = require("@resvg/resvg-js");
const { MessageMedia } = require("whatsapp-web.js");

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text, maxLength = 15) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= maxLength) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 5);
}

function buildSvg(text) {
  const lines = wrapText(text, 8);
  const fontSize = lines.length > 3 ? 150 : 190;
  const startX = 56;
  const startY = 170;
  const lineHeight = fontSize - 10;
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="${startX}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("");

  return `
    <svg width="768" height="768" viewBox="0 0 768 768" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur"/>
          <feOffset dx="4" dy="6" result="offsetBlur"/>
          <feMerge>
            <feMergeNode in="offsetBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="768" height="768" fill="#f2f2f2"/>
      <rect x="28" y="28" width="712" height="712" rx="6" fill="#f2f2f2"/>
      <text
        x="${startX}"
        y="${startY}"
        text-anchor="start"
        dominant-baseline="hanging"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="400"
        fill="#000000"
        filter="url(#softShadow)"
      >${tspans}</text>
    </svg>
  `;
}

module.exports = {
  name: "brat",
  description: "Membuat stiker brat dari teks.",
  usage: "brat <teks>",
  async execute({ message, text, state }) {
    const bratText = text.trim();

    if (!bratText) {
      await message.reply("Masukkan teks.\nContoh: `.brat halo dunia`");
      return;
    }

    const svg = buildSvg(bratText);
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 768 } });
    const pngBuffer = resvg.render().asPng();
    const media = new MessageMedia(
      "image/png",
      pngBuffer.toString("base64"),
      "brat.png"
    );

    await message.reply(media, undefined, {
      sendMediaAsSticker: true,
      stickerName: state.config.stickerPackname,
      stickerAuthor: state.config.stickerAuthor,
    });
  },
};
