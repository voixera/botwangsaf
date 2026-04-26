module.exports = {
  name: "stiker",
  aliases: ["sticker", "s"],
  description: "Membuat stiker dari gambar/video pendek yang dikirim atau direply.",
  usage: "stiker",
  async execute({ message, state }) {
    let sourceMessage = message;

    if (!message.hasMedia && message.hasQuotedMsg) {
      sourceMessage = await message.getQuotedMessage();
    }

    if (!sourceMessage.hasMedia) {
      await message.reply("Kirim atau reply gambar/video lalu ketik `.stiker`.");
      return;
    }

    const media = await sourceMessage.downloadMedia();
    if (!media) {
      await message.reply("Media gagal dibaca. Coba kirim ulang.");
      return;
    }

    const isImage = media.mimetype.startsWith("image/");
    const isVideo = media.mimetype.startsWith("video/");

    if (!isImage && !isVideo) {
      await message.reply("Media harus berupa gambar atau video.");
      return;
    }

    await message.reply(media, undefined, {
      sendMediaAsSticker: true,
      stickerName: state.config.stickerPackname,
      stickerAuthor: state.config.stickerAuthor,
    });
  },
};
