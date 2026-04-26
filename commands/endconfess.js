function endSession(state, userJid) {
  const session = state.activeMenfess.get(userJid);
  if (!session) return null;

  state.activeMenfess.delete(userJid);
  state.activeMenfess.delete(session.peer);
  return session;
}

module.exports = {
  name: "endconfess",
  aliases: ["endmenfess", "stopconfess", "stopmenfess"],
  description: "Mengakhiri sesi menfess yang sedang aktif.",
  usage: "endconfess",
  async execute({ client, message, state, helpers }) {
    if (!helpers.isPrivateUserChat(message)) {
      await message.reply("Command ini hanya bisa dipakai di chat private bot.");
      return;
    }

    const session = endSession(state, message.from);
    if (!session) {
      await message.reply("Tidak ada sesi menfess aktif.");
      return;
    }
 
    awaitmessage.reply("Sesi Menfess telah diakhiri.")
    
    try {
      await client.sendMessage(
        session.peer,
        "Sesi menfess telah diakhiri oleh lawan bicara."
      );
    } catch {
    }
  },
};
