const { success, warn } = require("./_style");

module.exports = {
  name: "endtanya",
  aliases: ["stoptanya"],
  description: "Mengakhiri mode tanya AI.",
  usage: "endtanya",
  async execute({ message, state, helpers }) {
    if (!helpers.isPrivateUserChat(message)) {
      await message.reply(warn("Command ini hanya bisa dipakai di chat private bot."));
      return;
    }

    if (!state.activeTanya?.has(message.from)) {
      await message.reply(warn("Mode tanya sedang tidak aktif."));
      return;
    }

    state.activeTanya.delete(message.from);
    await message.reply(success("𝚃𝙰𝙽𝚈𝙰 𝙰𝙸", "Mode tanya AI telah dimatikan."));
  },
};
