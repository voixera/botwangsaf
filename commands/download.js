const { download, findUrl, parseUrl } = require("../services/downloader");

const activeLinks = new Set();
const aliases = ["video", "audio", "tiktok", "ig", "yt"];

function box(title, lines) {
  return [`╭───「 ${title} 」───`, ...lines.map((line) => `│ ${line}`), "╰────────────────"].join("\n");
}

function kindFor(name) {
  return name === "audio" ? "audio" : "video";
}

async function executeDownload({ message, text, commandName = "download" }) {
  const target = findUrl(text) || parseUrl(text);
  if (!target) {
    await message.reply("Format: .download <URL>\nPlatform: Instagram, TikTok, YouTube, Facebook, X, Pinterest, Reddit.");
    return;
  }
  const key = target.url;
  if (activeLinks.has(key)) return;
  activeLinks.add(key);
  const kind = kindFor(commandName);
  await message.reply(box("DOWNLOAD", [`Platform: ${target.platform}`, "Status: Processing..."]));
  try {
    const result = await download(target.url, kind);
    const mimetype = kind === "audio" ? "audio/mpeg" : "video/mp4";
    await message.reply({ mimetype, data: result.data.toString("base64"), filename: kind === "audio" ? "audio.mp3" : "video.mp4", seconds: result.duration }, undefined, {
      caption: box("DOWNLOAD COMPLETE", [`Platform: ${result.platform}`, "Status: Success"]),
    });
  } catch (error) {
    await message.reply(box("DOWNLOAD FAILED", [`Platform: ${target.platform}`, `Status: ${error.message}`]));
  } finally {
    activeLinks.delete(key);
  }
}

module.exports = {
  name: "download",
  aliases,
  description: "Download media dari link publik yang didukung.",
  usage: "download <URL> | video <URL> | audio <URL>",
  async execute({ message, text, commandName }) {
    return executeDownload({ message, text, commandName });
  },
  async auto({ message, text }) { return executeDownload({ message, text, commandName: "download" }); },
};
