const { box } = require("./_style");

module.exports = {
  name: "prefix",
  aliases: ["prefixes"],
  description: "Melihat prefix aktif.",
  usage: "prefix",
  async execute({ message, state }) {
    await message.reply(
      box("𝙿𝚁𝙴𝙵𝙸𝚇", [`⌬ Prefix aktif`, `⌬ ${state.config.prefixes.join(" ")}`])
    );
  },
};
