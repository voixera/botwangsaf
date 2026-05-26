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

function splitLongWord(word, maxLength) {
  const chunks = [];
  for (let index = 0; index < word.length; index += maxLength) {
    chunks.push(word.slice(index, index + maxLength));
  }
  return chunks;
}

function getWords(text) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => (word.length > 13 ? splitLongWord(word, 13) : word));
}

function buildRows(words) {
  const rows = [];
  const targetChars = words.length <= 4 ? 12 : words.length <= 10 ? 14 : 17;
  let currentRow = [];
  let currentLength = 0;

  for (const word of words) {
    const nextLength = currentLength + word.length;
    const canAdd =
      currentRow.length < 3 &&
      (currentRow.length === 0 || nextLength <= targetChars);

    if (canAdd) {
      currentRow.push(word);
      currentLength = nextLength;
      continue;
    }

    rows.push(currentRow);
    currentRow = [word];
    currentLength = word.length;
  }

  if (currentRow.length) {
    rows.push(currentRow);
  }

  return rows.slice(0, 7);
}

function getBratLayout(text) {
  const words = getWords(text);
  const rows = buildRows(words);
  const longestWord = Math.max(...words.map((word) => word.length), 1);
  const byWidth = Math.floor(650 / (longestWord * 0.54));
  const byHeight = Math.floor(640 / Math.max(rows.length, 1));
  const fontSize = Math.max(70, Math.min(156, byWidth, byHeight));
  const oneWord = words.length === 1;

  return {
    rows,
    fontSize,
    lineHeight: Math.round(fontSize * 0.92),
    oneWord,
  };
}

function getWordSlots(row, rowIndex, totalRows, oneWord) {
  if (oneWord) {
    return [{ word: row[0], x: 384, anchor: "middle" }];
  }

  if (row.length === 1) {
    return [{ word: row[0], x: 58, anchor: "start" }];
  }

  if (row.length === 2) {
    return [
      { word: row[0], x: 58, anchor: "start" },
      { word: row[1], x: 710, anchor: "end" },
    ];
  }

  const middleX = rowIndex === totalRows - 1 ? 384 : 400;
  return [
    { word: row[0], x: 58, anchor: "start" },
    { word: row[1], x: middleX, anchor: "middle" },
    { word: row[2], x: 710, anchor: "end" },
  ];
}

function buildSvg(text) {
  const { rows, fontSize, lineHeight, oneWord } = getBratLayout(text);
  const totalHeight = lineHeight * (rows.length - 1) + fontSize;
  const startY = oneWord
    ? Math.round((768 - fontSize) / 2)
    : Math.max(48, Math.round((768 - totalHeight) / 2) - 18);
  const textNodes = rows
    .map((row, rowIndex) => {
      const y = startY + rowIndex * lineHeight;
      return getWordSlots(row, rowIndex, rows.length, oneWord)
        .map(
          ({ word, x, anchor }) => `
            <text
              x="${x}"
              y="${y}"
              text-anchor="${anchor}"
              dominant-baseline="hanging"
              font-family="Arial, Helvetica, sans-serif"
              font-size="${fontSize}"
              font-weight="400"
              letter-spacing="-3"
              fill="#111111"
              filter="url(#bratBlur)"
            >${escapeXml(word)}</text>`
        )
        .join("");
    })
    .join("");

  return `
    <svg width="768" height="768" viewBox="0 0 768 768" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bratBlur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.65"/>
        </filter>
      </defs>
      <rect width="768" height="768" fill="#ffffff"/>
      ${textNodes}
    </svg>
  `;
}

module.exports = {
  name: "brat",
  description: "Membuat stiker brat dari teks.",
  usage: "brat <teks>",
  async execute({ message, text, state }) {
    const bratText = text.replace(/\s+/g, " ").trim();

    if (!bratText) {
      await message.reply("Masukkan teks.\nContoh: `.brat halo dunia`");
      return;
    }

    if (bratText.length > 120) {
      await message.reply("Teks terlalu panjang. Maksimal 120 karakter.");
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
