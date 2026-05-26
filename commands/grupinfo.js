const { box, warn } = require("./_style");

module.exports = {
  name: "grupinfo",
  aliases: ["groupinfo", "gcinfo"],
  description: "Info grup saat ini.",
  usage: "grupinfo",
  async execute({ message, helpers }) {
    if (helpers.isPrivateUserChat(message)) {
      await message.reply(warn("Command ini hanya bisa dipakai di grup."));
      return;
    }

    const chat = await message.getChat();
    await message.reply(
      box("𝙶𝚁𝚄𝙿 𝙸𝙽𝙵𝙾", [
        `⌬ Nama   : ${chat.name || "-"}`,
        `⌬ ID     : ${chat.id?._serialized || message.from}`,
        `⌬ Member : ${chat.participants?.length || 0}`,
        `⌬ Desk   : ${chat.description || "-"}`,
      ])
    );
  },
};
