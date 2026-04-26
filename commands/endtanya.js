module.exports = {
  name: "endtanya",
  aliases: ["stoptanya"],
  description: "Mengakhiri mode tanya AI.",
  usage: "endtanya",
  async execute({ message, state, helpers }) {
    if (!helpers.isPrivateUserChat(message)) {
      await message.reply("Command ini hanya bisa dipakai di chat private bot.");
      return;
    }

    if (!state.activeTanya?.has(message.from)) {
      await message.reply("Mode tanya sedang tidak aktif.");
      return;
    }

    state.activeTanya.delete(message.from);
    await message.reply("Mode tanya AI dimatikan. Kalau mau mulai lagi, ketik `.tanya`.");
  },
};
