module.exports = {
  name: "endcurhat",
  aliases: ["stopcurhat"],
  description: "Mengakhiri mode curhat.",
  usage: "endcurhat",
  async execute({ message, state, helpers }) {
    if (!helpers.isPrivateUserChat(message)) {
      await message.reply("Command ini hanya bisa dipakai di chat private bot.");
      return;
    }

    if (!state.activeCurhat.has(message.from)) {
      await message.reply("Mode curhat sedang tidak aktif.");
      return;
    }

    state.activeCurhat.delete(message.from);
    await message.reply("Mode curhat telah dimatikan. Kalau ada apa-apa lagi, jangan sungkan buat ketik `.curhat` lagi ya. Nara selalu siap dengerin kok. Semangat terus!");
  },
};
