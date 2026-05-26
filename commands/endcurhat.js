const { success, warn } = require("./_style");

module.exports = {
  name: "endcurhat",
  aliases: ["stopcurhat"],
  description: "Mengakhiri mode curhat.",
  usage: "endcurhat",
  async execute({ message, state, helpers }) {
    if (!helpers.isPrivateUserChat(message)) {
      await message.reply(warn("Command ini hanya bisa dipakai di chat private bot."));
      return;
    }

    if (!state.activeCurhat.has(message.from)) {
      await message.reply(warn("Mode curhat sedang tidak aktif."));
      return;
    }

    state.activeCurhat.delete(message.from);
    await message.reply(success("𝙲𝚄𝚁𝙷𝙰𝚃", "Mode curhat telah dimatikan."));
  },
};
