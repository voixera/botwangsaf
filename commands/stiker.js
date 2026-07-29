const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { randomUUID } = require("crypto");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

const execFileAsync = promisify(execFile);
const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function requestMediaDownload(message) {
  // This is only an optimization for older WhatsApp Web versions. The
  // internal WAWebCollections API changes frequently, especially locally.
  // Never let it prevent whatsapp-web.js' public downloadMedia() from running.
  if (!message.client?.pupPage || !message.id?._serialized) return false;

  try {
    return await message.client.pupPage.evaluate(async (messageId) => {
      const collections = window.require?.("WAWebCollections");
      const collection = collections?.Msg;
      if (!collection) return false;

      const message =
        collection.get(messageId) ||
        (await collection.getMessagesById?.([messageId]))?.messages?.[0];
      if (!message?.mediaData || message.mediaData.mediaStage === "REUPLOADING") {
        return false;
      }
      if (message.mediaData.mediaStage !== "RESOLVED") {
        await message.downloadMedia?.({
          downloadEvenIfExpensive: true,
          rmrReason: 1,
        });
      }
      return message.mediaData.mediaStage === "RESOLVED";
    }, message.id._serialized);
  } catch {
    return false;
  }
}

async function downloadMediaWithRetry(message) {
  let lastError;

  // New incoming media can still be in WhatsApp's FETCHING state when the
  // message event arrives. Wait for WhatsApp Web to resolve it before asking
  // whatsapp-web.js to decrypt and return the file.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      // Give WhatsApp Web a moment to finish fetching the encrypted media.
      await requestMediaDownload(message);
      const media = await message.downloadMedia();
      if (media?.data) return media;
    } catch (error) {
      lastError = error;
    }

    if (attempt < 5) {
      await delay(1500);
    }
  }

  if (lastError) {
    const detail = lastError?.message || String(lastError);
    throw new Error(`WhatsApp tidak mengembalikan media setelah 6 percobaan: ${detail}`);
  }
  return null;
}

function getErrorMessage(error) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    if (error.message) return String(error.message);
    if (error.name) return String(error.name);
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "unknown error";
  }
}

async function getQuotedMediaWithRetry(message) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const quoted = await message.getQuotedMessage();
      if (quoted?.hasMedia) return quoted;
    } catch (error) {
      lastError = error;
    }
    if (attempt < 2) await delay(1000);
  }
  if (lastError) {
    throw new Error(`pesan reply tidak bisa dibaca (${getErrorMessage(lastError)})`);
  }
  return null;
}

async function convertToWebp(media) {
  const mimeType = String(media.mimetype || "").toLowerCase();
  const extension = mimeType.split("/")[1] || "bin";
  const id = randomUUID();
  const inputPath = path.join(os.tmpdir(), `wa-sticker-${id}.${extension}`);
  const outputPath = path.join(os.tmpdir(), `wa-sticker-${id}.webp`);

  try {
    await fs.writeFile(inputPath, Buffer.from(media.data, "base64"));
    // Keep the complete original image. WhatsApp requires a square canvas, so
    // fit the image inside 512x512 and use transparent space around it instead
    // of cropping the user's photo or adding black bars.
    const squareFilter =
      "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=yuva420p";
    const videoFilter = mimeType.startsWith("video/")
      ? `fps=10,${squareFilter}`
      : squareFilter;

    await execFileAsync(FFMPEG_PATH, [
      "-y",
      "-i",
      inputPath,
      "-vf",
      videoFilter,
      "-vcodec",
      "libwebp",
      "-lossless",
      "0",
      "-q:v",
      "75",
      ...(mimeType.startsWith("video/") ? ["-t", "6", "-loop", "0", "-an"] : ["-loop", "0"]),
      outputPath,
    ]);

    const stickerBuffer = await fs.readFile(outputPath);
    const packName = process.env.STICKER_PACKNAME || "Made with ❤️ by DrxDvs";
    const author = process.env.STICKER_AUTHOR || "ENGINE V6 | DrxDvs";
    // Use the formatter's WhatsApp-compatible EXIF writer. Hand-building the
    // EXIF chunk can produce a sticker that sends but cannot be downloaded.
    const finalBuffer = await new Sticker(stickerBuffer, {
      pack: packName,
      author,
      type: StickerTypes.FULL,
      categories: ["✨"],
      background: "#00000000",
    }).toBuffer();

    return {
      mimetype: "image/webp",
      data: finalBuffer.toString("base64"),
      filename: "sticker.webp",
    };
  } finally {
    await Promise.allSettled([fs.unlink(inputPath), fs.unlink(outputPath)]);
  }
}

module.exports = {
  name: "stiker",
  aliases: ["sticker", "s"],
  description: "Membuat stiker dari gambar/video pendek yang dikirim atau direply.",
  usage: "stiker / s",
  async execute({ message, state }) {
    let sourceMessage = message;

    if (!message.hasMedia) {
      sourceMessage = null;

      if (message.hasQuotedMsg) {
        try {
          sourceMessage = await getQuotedMediaWithRetry(message);
        } catch (error) {
          console.warn(
            `Media reply untuk stiker tidak tersedia: ${getErrorMessage(error)}`
          );
        }
      }

      sourceMessage = sourceMessage?.hasMedia
        ? sourceMessage
        : state.lastMedia.get(message.from);
    }

    if (!sourceMessage?.hasMedia) {
      await message.reply("Kirim gambar/video dengan caption `.s`, reply media dengan `.s`, atau kirim `.s` setelah media.");
      return;
    }

    let media;
    try {
      media = await downloadMediaWithRetry(sourceMessage);
    } catch (error) {
      console.warn(
        `Media stiker gagal diunduh: ${getErrorMessage(error)}`
      );
      await message.reply("Media gagal diunduh. Coba kirim ulang gambar/video lalu ketik `.s`.");
      return;
    }

    if (!media) {
      await message.reply("Media gagal dibaca. Coba kirim ulang lalu ketik `.s`.");
      return;
    }

    const mimeType = String(media.mimetype || "").toLowerCase();
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");

    if (!isImage && !isVideo) {
      await message.reply("Media harus berupa gambar atau video.");
      return;
    }

    try {
      const stickerMedia = await convertToWebp(media);
      await message.reply(stickerMedia, undefined, {
        sendMediaAsSticker: true,
        stickerName: state.config.stickerPackname,
        stickerAuthor: state.config.stickerAuthor,
      });
    } catch (error) {
      console.warn(`Pembuatan stiker gagal: ${getErrorMessage(error)}`);
      await message.reply(
        isVideo
          ? "Video tidak bisa dijadikan stiker. Gunakan video pendek (maks. 16 detik) atau gambar, lalu ketik `.s`."
          : "Gagal membuat stiker dari gambar ini. Coba kirim gambar lain lalu ketik `.s`."
      );
    }
  },
};
