const { success, warn } = require("./_style");

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
      await message.reply(warn("Command ini hanya bisa dipakai di chat private bot."));
      return;
    }

    const session = endSession(state, message.from);
    if (!session) {
      await message.reply(warn("Tidak ada sesi menfess aktif."));
      return;
    }
 
    await message.reply(success("𝙼𝙴𝙽𝙵𝙴𝚂𝚂", "Sesi menfess telah diakhiri."));
    
    try {
      await client.sendMessage(
        session.peer,
        success("𝙼𝙴𝙽𝙵𝙴𝚂𝚂", "Sesi menfess telah diakhiri oleh lawan bicara.")
      );
    } catch {
    }
  },
};
