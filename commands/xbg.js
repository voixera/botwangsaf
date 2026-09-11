async function getSourceMessage(message, state) {
  if (message.hasMedia) return message;

  if (message.hasQuotedMsg) {
    const quoted = await message.getQuotedMessage();
    if (quoted?.hasMedia) return quoted;
  }

  return state.lastMedia.get(message.from) || null;
}

module.exports = {
  name: "xbg",
  aliases: ["removebg", "rmbg"],
  description: "Menghapus background gambar.",
  usage: "xbg",
  async execute({ message, state }) {
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      await message.reply("Command `.xbg` belum aktif. Isi `REMOVE_BG_API_KEY` terlebih dahulu.");
      return;
    }

    let sourceMessage;
    try {
      sourceMessage = await getSourceMessage(message, state);
    } catch {
      sourceMessage = null;
    }

    if (!sourceMessage?.hasMedia) {
      await message.reply("Kirim atau reply gambar dengan caption `.xbg`.");
      return;
    }

    const media = await sourceMessage.downloadMedia();
    const mimeType = String(media?.mimetype || "").toLowerCase();
    if (!media?.data || !mimeType.startsWith("image/")) {
      await message.reply("Media harus berupa gambar.");
      return;
    }

    const form = new FormData();
    form.append("image_file", new Blob([Buffer.from(media.data, "base64")], { type: mimeType }), "image");
    form.append("size", "auto");

    try {
      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
        body: form,
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`remove.bg ${response.status}: ${detail.slice(0, 160)}`);
      }

      const result = Buffer.from(await response.arrayBuffer());
      await message.reply({
        mimetype: "image/png",
        data: result.toString("base64"),
        filename: "no-background.png",
      });
    } catch (error) {
      console.warn(`Penghapusan background gagal: ${error.message}`);
      await message.reply("Background gagal dihapus. Coba gambar lain.");
    }
  },
};
