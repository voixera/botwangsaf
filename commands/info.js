const pkg = require("../package.json");
const { box } = require("./_style");

module.exports = {
  name: "info",
  aliases: ["botinfo", "infobot"],
  description: "Info singkat bot.",
  usage: "info",
  async execute({ message, state }) {
    await message.reply(
      box("𝙳𝚇 𝙱𝙾𝚃", [
        `⌬ Versi  : ${pkg.version || "1.0.0"}`,
        `⌬ Node   : ${process.version}`,
        `⌬ Prefix : ${state.config.prefixes.join(" ")}`,
        "⌬ Fitur  : media, AI, menfess, utilitas",
      ])
    );
  },
};
