const { box } = require("./_style");

const QUOTES = [
  "Pelan-pelan tetap jalan. Yang penting jangan berhenti cuma karena hari ini berat.",
  "Tidak semua hal harus selesai hari ini. Beberapa hal cukup dimulai dulu.",
  "Kalau capek, istirahat. Bukan menyerah.",
  "Langkah kecil yang konsisten sering lebih kuat daripada semangat besar yang sebentar.",
  "Kamu tidak harus sempurna untuk mulai jadi lebih baik.",
  "Hari buruk bukan berarti hidupmu buruk.",
  "Yang penting bukan selalu cepat, tapi tetap arah.",
  "Jaga dirimu juga termasuk bagian dari berjuang.",
];

module.exports = {
  name: "quote",
  aliases: ["quotes", "motivasi"],
  description: "Kirim quote singkat.",
  usage: "quote",
  async execute({ message }) {
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    await message.reply(box("𝚀𝚄𝙾𝚃𝙴", [`“${quote}”`]));
  },
};
