const pkg = require("../package.json");
const { box } = require("./_style");

module.exports = {
  name: "info",
  aliases: ["botinfo", "infobot"],
  description: "Info singkat bot.",
  usage: "info",
  async execute({ message }) {
    await message.reply(
      box("VX Bot", [
        `⌬ Versi  : ${pkg.version || "1.0.0"}`,
        `⌬ Node   : ${process.version}`,
        "⌬ Fitur  : media, menfess, utilitas",
      ])
    );
  },
};
