const { box } = require("./_style");

module.exports = {
  name: "id",
  aliases: ["jid"],
  description: "Melihat ID chat dan pengirim.",
  usage: "id",
  async execute({ message }) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    await message.reply(
      box("𝙸𝙳 𝙸𝙽𝙵𝙾", [
        `⌬ Chat : ${chat?.id?._serialized || message.from}`,
        `⌬ User : ${contact?.id?._serialized || message.author || message.from}`,
        `⌬ Nomor: ${contact?.number || "-"}`,
      ])
    );
  },
};
