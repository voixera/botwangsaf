const { box } = require("./_style");

function formatUptime(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return [
    days ? `${days} hari` : "",
    hours ? `${hours} jam` : "",
    minutes ? `${minutes} menit` : "",
    `${seconds} detik`,
  ]
    .filter(Boolean)
    .join(" ");
}

module.exports = {
  name: "runtime",
  aliases: ["uptime"],
  description: "Cek lama bot aktif.",
  usage: "runtime",
  async execute({ message }) {
    await message.reply(
      box("𝚁𝚄𝙽𝚃𝙸𝙼𝙴", [`⌬ Aktif selama`, `⌬ ${formatUptime(process.uptime())}`])
    );
  },
};
