function normalizeNumber(rawNumber) {
  const digits = String(rawNumber || "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

module.exports = {
  name: "owner",
  aliases: ["creator", "admin"],
  description: "Menampilkan kontak owner bot.",
  usage: "owner",
  async execute({ client, message }) {
    const ownerNumber = normalizeNumber(process.env.OWNER_NUMBER || process.env.BOT_OWNER);

    if (!ownerNumber) {
      await message.reply("Nomor owner belum diatur di .env.");
      return;
    }

    const numberId =
      typeof client.getNumberId === "function"
        ? await client.getNumberId(ownerNumber)
        : null;
    const ownerJid = numberId?._serialized || `${ownerNumber}@c.us`;
    const contact = await client.getContactById(ownerJid);

    await message.reply(contact);
  },
};
