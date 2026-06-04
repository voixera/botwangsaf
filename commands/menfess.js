function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

function extractPhoneKey(jid) {
  const normalized = normalizePhone(jid);
  if (normalized) return normalized;

  const match = String(jid || "").match(/(\d{6,})/);
  return match ? match[1] : null;
}

function buildJidAliases(jid) {
  const raw = String(jid || "").trim();
  const aliases = new Set();

  if (raw) {
    aliases.add(raw);
  }

  const phoneKey = extractPhoneKey(raw);
  if (phoneKey) {
    aliases.add(phoneKey);
    aliases.add(`${phoneKey}@c.us`);
    aliases.add(`${phoneKey}@lid`);
  }

  return [...aliases];
}

function toSendableJid(jid) {
  const phoneKey = extractPhoneKey(jid);
  return phoneKey ? `${phoneKey}@c.us` : String(jid || "").trim();
}

async function resolvePeerChatId(client, session) {
  const peerPhone = extractPhoneKey(session?.peerPhone || session?.peer);
  if (peerPhone && typeof client.getNumberId === "function") {
    try {
      const numberId = await client.getNumberId(peerPhone);
      if (numberId && numberId._serialized) {
        return numberId._serialized;
      }
    } catch {
    }
  }

  return toSendableJid(session?.peer);
}

function setTwoWaySession(state, userA, userB) {
  const createdAt = Date.now();
  const sessionA = {
    peer: toSendableJid(userB.jid || userB.phone),
    peerPhone: extractPhoneKey(userB.phone || userB.jid),
    ownerPhone: extractPhoneKey(userA.phone || userA.jid),
    createdAt,
  };
  const sessionB = {
    peer: toSendableJid(userA.jid || userA.phone),
    peerPhone: extractPhoneKey(userA.phone || userA.jid),
    ownerPhone: extractPhoneKey(userB.phone || userB.jid),
    createdAt,
  };

  for (const alias of buildJidAliases(userA.jid || userA.phone)) {
    state.activeMenfess.set(alias, sessionA);
  }

  if (userA.phone) {
    state.activeMenfess.set(userA.phone, sessionA);
  }

  for (const alias of buildJidAliases(userB.jid || userB.phone)) {
    state.activeMenfess.set(alias, sessionB);
  }

  if (userB.phone) {
    state.activeMenfess.set(userB.phone, sessionB);
  }
}

function getSession(state, jid) {
  for (const alias of buildJidAliases(jid)) {
    if (state.activeMenfess.has(alias)) {
      return state.activeMenfess.get(alias);
    }
  }

  return null;
}

async function resolveSessionFromMessage(state, message) {
  const candidates = new Set();

  const pushCandidate = (value) => {
    if (!value) return;
    candidates.add(String(value).trim());
  };

  pushCandidate(message.from);
  pushCandidate(message.author);
  pushCandidate(message.to);

  if (message.id) {
    pushCandidate(message.id.remote);
    pushCandidate(message.id.participant);
    pushCandidate(message.id.fromMe ? message.to : message.from);
  }

  if (message._data) {
    pushCandidate(message._data.from);
    pushCandidate(message._data.author);
    pushCandidate(message._data.chatId);
  }

  try {
    const contact = await message.getContact();
    if (contact) {
      pushCandidate(contact.number);
      pushCandidate(contact.id && contact.id._serialized);
      pushCandidate(contact.id && contact.id.user);
      pushCandidate(contact.pushname);
      pushCandidate(contact.name);
    }
  } catch {
  }

  try {
    const chat = await message.getChat();
    if (chat && chat.id) {
      pushCandidate(chat.id._serialized);
      pushCandidate(chat.id.user);
    }
  } catch {
  }

  for (const candidate of candidates) {
    const session = getSession(state, candidate);
    if (session) {
      return session;
    }
  }

  for (const candidate of candidates) {
    const phone = extractPhoneKey(candidate);
    if (!phone) continue;

    for (const session of state.activeMenfess.values()) {
      if (session && session.ownerPhone === phone) {
        return session;
      }
    }
  }

  return null;
}

function buildMediaCaption(prefix, text) {
  return text ? `${prefix}\n\n${text}` : prefix;
}

function isStickerPayload(message, media) {
  return (
    message?.type === "sticker" ||
    media?.mimetype === "image/webp" ||
    String(media?.mimetype || "").includes("webp")
  );
}

async function forwardMenfessMedia({ client, chatId, message, media, text, introText }) {
  if (isStickerPayload(message, media)) {
    await client.sendMessage(chatId, media, { sendMediaAsSticker: true });
    if (text) {
      await client.sendMessage(chatId, text);
    } else if (introText) {
      await client.sendMessage(chatId, introText);
    }
    return;
  }

  await client.sendMessage(chatId, media, {
    caption: buildMediaCaption(introText, text),
  });
}

function buildMenfessText(targetLabel, text) {
  return [
    "Hallo kami dari Choco Bot🍫",
    "Ada pesan nih buat kamuuuu..",
    "",
    "Dari : Private",
    `Untuk : ${targetLabel}`,
    `Pesan : ${text}`,
    "",
    "Trimakasih....",
  ].join("\n");
}

module.exports = {
  name: "menfess",
  description: "Mengirim pesan anonim dan membuka sesi balas 2 arah.",
  usage: "menfess <nomor>|<untuk siapa>|<pesan>",
  async execute({ client, message, text, state, helpers }) {
    if (!helpers.isPrivateUserChat(message)) {
      await message.reply("Command menfess hanya bisa dipakai di chat private bot.");
      return;
    }

    if (state.activeCurhat && state.activeCurhat.has(message.from)) {
      await message.reply("Kamu sedang di mode curhat. Akhiri dulu dengan `.endcurhat`.");
      return;
    }

    const rawInput = text.trim();
    const [targetRaw = "", targetLabelRaw = "", ...messageParts] = rawInput.split("|");
    const targetJid = helpers.toUserJid(targetRaw);
    const targetLabel = targetLabelRaw.trim();
    const confessText = messageParts.join("|").trim();
    const hasMedia = message.hasMedia;

    if (!targetJid) {
      await message.reply(
        "Format salah.\nContoh: `.menfess 6281234567890|Untuk Rina|hai kamu`"
      );
      return;
    }

    if (targetJid === message.from) {
      await message.reply("Nomor tujuan tidak boleh nomor sendiri.");
      return;
    }

    if (!targetLabel) {
      await message.reply("Bagian 'untuk siapa' wajib diisi.");
      return;
    }

    if (!hasMedia && !confessText) {
      await message.reply("Pesan kosong. Tambahkan teks atau kirim media.");
      return;
    }

    let senderPhone = extractPhoneKey(message.from);
    try {
      const senderContact = await message.getContact();
      senderPhone = normalizePhone(senderContact?.number) || senderPhone;
    } catch {
    }

    setTwoWaySession(
      state,
      { jid: message.from, phone: senderPhone },
      { jid: targetJid, phone: extractPhoneKey(targetJid) }
    );

    if (hasMedia) {
      const media = await message.downloadMedia();
      if (!media) {
        await message.reply("Media gagal dibaca. Coba kirim ulang.");
        return;
      }

      await forwardMenfessMedia({
        client,
        chatId: targetJid,
        message,
        media,
        text: confessText,
        introText: buildMenfessText(targetLabel, confessText || "(media)"),
      });
    } else {
      await client.sendMessage(targetJid, buildMenfessText(targetLabel, confessText));
    }

    await client.sendMessage(
      targetJid,
      "Balas chat ini ke bot kalau mau membalas pesan dari sender."
    );
    await message.reply("Pesan terkirim. Sesi balas 2 arah sudah aktif.");
  },
  async handleSessionMessage({ client, message, state, helpers }) {
    if (!helpers.isPrivateUserChat(message)) return false;
    const session = await resolveSessionFromMessage(state, message);
    if (!session) return false;
    const peerChatId = await resolvePeerChatId(client, session);

    if (!peerChatId) {
      await message.reply("Tujuan balasan tidak valid atau tidak ditemukan.");
      return true;
    }

    const replyText = (message.body || "").trim();
    const hasMedia = message.hasMedia;

    if (!replyText && !hasMedia) {
      await message.reply("Mohon isi Pesan dahulu, Pesan yang kosong tidak bisa diteruskan.");
      return true;
    }

    if (hasMedia) {
      const media = await message.downloadMedia();
      if (!media) {
        await message.reply("Media yang dikirim gagal dibaca. Coba kirim ulang.");
        return true;
      }

      await forwardMenfessMedia({
        client,
        chatId: peerChatId,
        message,
        media,
        text: replyText,
        introText: "Balasan (media):",
      });
      await message.reply("Pesan sudah diteruskan.");
      return true;
    }

    await client.sendMessage(
      peerChatId,
      ["Balasan menfess:", "", replyText].join("\n")
    );
    await message.reply("Pesan sudah diteruskan.");
    return true;
  },
};
