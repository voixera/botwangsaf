const PERSONA_NAME = process.env.CURHAT_PERSONA_NAME || "Nara";
const GROK_API_URL =
  process.env.GROK_API_URL || "https://api.x.ai/v1/chat/completions";
const GROK_MODEL = process.env.GROK_MODEL || "grok-3.3";
const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const MAX_HISTORY_MESSAGES = 12;

const NARA_SYSTEM_PROMPT = [
  `Kamu adalah ${PERSONA_NAME}, teman curhat yang hangat, sabar, dan terasa manusiawi.`,
  "Balas selalu dalam bahasa Indonesia yang natural, santai, dan empatik.",
  "Tugasmu mendengarkan, menenangkan, membantu user mengurai perasaan, dan memberi sudut pandang yang lembut tapi jujur.",
  "Jangan terdengar seperti dokter, terapis formal, atau chatbot kaku.",
  "Jangan menghakimi, jangan meremehkan perasaan user, dan jangan terlalu cepat menyuruh user positif.",
  "Kalau user minta solusi, berikan langkah kecil yang realistis.",
  "Kalau user hanya ingin didengar, validasi perasaannya dan ajukan satu pertanyaan lanjutan yang nyaman.",
  "Kalau user membahas bahaya serius seperti ingin menyakiti diri sendiri, menyakiti orang lain, atau kondisi darurat, sarankan segera menghubungi orang terdekat atau layanan darurat setempat.",
  "Jawaban idealnya 2-5 paragraf pendek. Jangan terlalu panjang kecuali user minta detail.",
].join(" ");

const conversationHistory = new Map();

function getHistory(userId) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }

  return conversationHistory.get(userId);
}

function remember(userId, role, content) {
  const history = getHistory(userId);
  history.push({ role, content });

  while (history.length > MAX_HISTORY_MESSAGES) {
    history.shift();
  }
}

function extractAiText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const texts = content
      .map((part) => (typeof part?.text === "string" ? part.text.trim() : ""))
      .filter(Boolean);
    return texts.length ? texts.join("\n").trim() : null;
  }

  return null;
}

async function askGrok(userId, input) {
  if (!GROK_API_KEY) {
    return null;
  }

  const history = getHistory(userId);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(GROK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        temperature: 0.7,
        stream: false,
        messages: [
          {
            role: "system",
            content: NARA_SYSTEM_PROMPT,
          },
          ...history,
          {
            role: "user",
            content: input,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return extractAiText(data);
  } finally {
    clearTimeout(timeout);
  }
}

function buildOfflineReply(input) {
  const text = input.toLowerCase();

  if (/\b(capek|cape|lelah|burnout|penat)\b/i.test(text)) {
    return [
      `${PERSONA_NAME} dengerin ya. Capek kayak gitu biasanya bukan cuma soal badan, tapi juga pikiran yang kebanyakan menahan.`,
      "Kamu boleh banget pelan dulu. Dari semua yang bikin berat, bagian mana yang paling menguras kamu sekarang?",
    ].join("\n\n");
  }

  if (/\b(sedih|nangis|kecewa|nyesek|patah hati|sakit hati)\b/i.test(text)) {
    return [
      `Aduh, kedengarannya sakit banget. ${PERSONA_NAME} di sini, kamu nggak perlu buru-buru keliatan kuat.`,
      "Coba cerita pelan-pelan, bagian mana yang paling bikin kamu nyesek?",
    ].join("\n\n");
  }

  if (/\b(takut|cemas|overthinking|khawatir|panik|stres|stress)\b/i.test(text)) {
    return [
      "Aku paham, pikiran yang muter terus itu melelahkan banget. Kita pelan dulu ya, satu napas, satu hal.",
      "Yang paling kamu takutkan sekarang apa, dan itu sudah terjadi atau masih kemungkinan?",
    ].join("\n\n");
  }

  return [
    `${PERSONA_NAME} dengerin. Ceritamu sudah masuk, tapi mode AI Grok belum aktif karena \`GROK_API_KEY\` atau \`XAI_API_KEY\` belum diatur.`,
    "Sambil itu, coba lanjut ceritain: kejadian apa yang paling bikin kamu kepikiran sekarang?",
  ].join("\n\n");
}

async function buildReply(userId, input) {
  try {
    const aiReply = await askGrok(userId, input);
    if (aiReply) {
      remember(userId, "user", input);
      remember(userId, "assistant", aiReply);
      return aiReply;
    }
  } catch (error) {
    console.error("Grok curhat error:", error.message);
  }

  const fallback = buildOfflineReply(input);
  remember(userId, "user", input);
  remember(userId, "assistant", fallback);
  return fallback;
}

module.exports = {
  name: "curhat",
  aliases: ["nara"],
  description: `Mengaktifkan sesi curhat AI dengan persona ${PERSONA_NAME}.`,
  usage: "curhat [isi curhat]",
  async execute({ message, text, state, helpers }) {
    if (!helpers.isPrivateUserChat(message)) {
      await message.reply("Command curhat hanya bisa dipakai di chat private bot.");
      return;
    }

    if (state.activeTanya?.has(message.from)) {
      await message.reply("Kamu sedang di mode tanya. Akhiri dulu dengan `.endtanya`.");
      return;
    }

    if (state.activeMenfess?.has(message.from)) {
      await message.reply("Kamu masih ada di sesi menfess. Akhiri dulu dengan `.endconfess`.");
      return;
    }

    const userId = message.from;
    const input = String(text || "").trim();

    state.activeCurhat.set(userId, {
      startedAt: Date.now(),
    });
    conversationHistory.set(userId, []);

    if (!input) {
      await message.reply(
        [
          `Mode curhat AI aktif. Aku ${PERSONA_NAME}.`,
          "Kirim cerita kamu tanpa perlu pakai `.curhat` lagi.",
          "Untuk berhenti, ketik `.endcurhat`.",
        ].join("\n")
      );
      return;
    }

    await message.reply(await buildReply(userId, input));
  },
  async handleSessionMessage({ message, state, helpers }) {
    if (!helpers.isPrivateUserChat(message)) return false;
    if (!state.activeCurhat?.has(message.from)) return false;

    if (message.hasMedia) {
      await message.reply("Mode curhat Nara baru menerima pesan teks. Ketik `.endcurhat` untuk keluar.");
      return true;
    }

    const input = String(message.body || "").trim();
    if (!input) {
      await message.reply("Ceritain lewat teks ya, atau ketik `.endcurhat` untuk berhenti.");
      return true;
    }

    await message.reply(await buildReply(message.from, input));
    return true;
  },
};
