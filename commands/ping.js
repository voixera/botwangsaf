const { box } = require("./_style");

module.exports = {
  name: "ping",
  aliases: ["p"],
  description: "Cek respons bot.",
  usage: "ping",
  async execute({ message }) {
    const start = Date.now();
    const sent = await message.reply("Pong...");
    const latency = Date.now() - start;
    const reply = box("𝙿𝙸𝙽𝙶", [`⌬ Status : online`, `⌬ Speed  : ${latency}ms`]);

    if (sent && typeof sent.edit === "function") {
      await sent.edit(reply);
      return;
    }

    await message.reply(reply);
  },
};
