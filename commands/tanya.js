const QUESTION_HINTS =
  /\b(siapa|apa|kapan|di mana|dimana|kenapa|gimana|bagaimana|berapa|jelaskan|jelasin|beda|vs|versus|cara|how to|hitung|jam berapa|tanggal)\b/i;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_SYSTEM_PROMPT = [
  "Kamu adalah asisten AI yang menjawab dalam bahasa Indonesia yang natural, ringkas, dan akurat.",
  "Jawab langsung inti pertanyaan tanpa minta user mengulang kecuali benar-benar ambigu.",
  "Kalau pertanyaan singkat, tetap berikan jawaban terbaik yang masuk akal.",
  "Kalau tidak yakin, katakan bagian yang tidak pasti dengan jujur.",
  "Untuk istilah gaul Indonesia, jelaskan arti dan konteks pemakaiannya.",
].join(" ");

const QUICK_EXPLAIN = {
  ai: "AI (Artificial Intelligence) adalah sistem komputer yang bisa melakukan tugas yang biasanya butuh kecerdasan manusia.",
  "machine learning":
    "Machine learning adalah cabang AI yang belajar dari data untuk menemukan pola, lalu memakai pola itu untuk prediksi/keputusan.",
  api: "API adalah jembatan komunikasi antar aplikasi lewat endpoint dan format data yang disepakati.",
  "rest api":
    "REST API adalah gaya API berbasis HTTP, biasanya memakai GET/POST/PUT/PATCH/DELETE.",
  react:
    "React adalah library JavaScript untuk membangun antarmuka pengguna berbasis komponen, umum dipakai untuk web app interaktif.",
  vue: "Vue adalah framework JavaScript progresif untuk membangun UI dan single-page application dengan sintaks yang relatif mudah dipelajari.",
  javascript:
    "JavaScript adalah bahasa pemrograman utama web yang bisa berjalan di browser maupun server (Node.js).",
  nodejs:
    "Node.js adalah runtime JavaScript untuk backend, API, automation, dan realtime app.",
  database:
    "Database adalah sistem penyimpanan data terstruktur agar data mudah dicari, diubah, dan dijaga konsistensinya.",
  sql: "SQL adalah bahasa query untuk mengelola database relasional seperti MySQL dan PostgreSQL.",
  html: "HTML adalah struktur dasar halaman web yang dipakai untuk menyusun elemen seperti teks, gambar, form, dan tautan.",
  css: "CSS adalah bahasa styling untuk mengatur tampilan halaman web seperti warna, layout, ukuran, dan animasi.",
  python: "Python adalah bahasa pemrograman serbaguna yang populer untuk automation, data, AI, backend, dan scripting.",
  anjay:
    "Anjay adalah kata slang dalam bahasa Indonesia yang biasa dipakai untuk mengekspresikan kagum, heran, atau bercanda. Kata ini informal dan sebaiknya dipakai sesuai konteks.",
  anjir:
    "Anjir adalah kata slang yang dipakai untuk mengekspresikan kaget, kagum, atau emosi ringan dalam percakapan santai.",
  bjir: "Bjir adalah slang santai untuk mengekspresikan kaget, heran, atau takjub.",
  njir: "Njir adalah variasi slang yang biasa dipakai untuk menekankan rasa heran atau kaget dalam obrolan informal.",
  asbun:
    "Asbun adalah singkatan dari 'asal bunyi', yaitu bicara atau berkomentar tanpa dasar yang jelas.",
  baper:
    "Baper adalah singkatan dari 'bawa perasaan', yaitu kondisi saat seseorang terlalu memasukkan sesuatu ke hati atau terlalu sensitif terhadap situasi tertentu.",
  mager:
    "Mager adalah singkatan dari 'malas gerak', yaitu kondisi saat seseorang sedang malas melakukan aktivitas.",
  gabut:
    "Gabut adalah keadaan saat seseorang sedang bosan, tidak ada kerjaan, atau tidak tahu mau melakukan apa.",
  bucin:
    "Bucin adalah singkatan dari 'budak cinta', yaitu istilah untuk orang yang terlalu bucin atau sangat menuruti pasangan karena cinta.",
  gamon:
    "Gamon adalah singkatan dari 'gagal move on', yaitu keadaan saat seseorang belum bisa lepas dari mantan, kenangan, atau perasaan lama.",
  salting:
    "Salting adalah singkatan dari 'salah tingkah', yaitu sikap kikuk atau canggung karena malu, senang, atau gugup.",
  php: "PHP dalam slang Indonesia sering berarti 'pemberi harapan palsu', yaitu orang yang memberi harapan tapi tidak serius.",
  geer:
    "Geer adalah singkatan dari 'gede rasa', yaitu kondisi saat seseorang terlalu percaya diri atau merasa orang lain tertarik padanya padahal belum tentu.",
  pdkt:
    "PDKT adalah singkatan dari 'pendekatan', yaitu proses mengenal dan mendekati seseorang sebelum menjalin hubungan.",
  jomblo:
    "Jomblo adalah istilah untuk seseorang yang sedang tidak punya pacar atau pasangan.",
  taken:
    "Taken adalah istilah informal untuk seseorang yang sudah punya pasangan atau sudah terikat hubungan.",
  friendzone:
    "Friendzone adalah situasi ketika satu pihak ingin hubungan romantis, tetapi pihak lain hanya menganggapnya sebagai teman.",
  ilfeel:
    "Ilfeel adalah bentuk slang dari 'hilang feeling', yaitu rasa tertarik yang tiba-tiba berkurang atau hilang.",
  kepo:
    "Kepo adalah istilah untuk rasa ingin tahu berlebihan terhadap urusan orang lain atau hal tertentu.",
  julid:
    "Julid adalah sikap suka mengomentari, nyinyir, atau iri terhadap orang lain dengan nada negatif.",
  nyinyir:
    "Nyinyir adalah gaya bicara yang suka mengkritik, menyindir, atau berkomentar sinis.",
  santuy:
    "Santuy adalah bentuk slang dari 'santai', yaitu ajakan atau sikap untuk tetap tenang dan tidak terlalu tegang.",
  kuy: "Kuy adalah bentuk terbalik dari kata 'yuk', dipakai untuk mengajak secara santai.",
  skuy: "Skuy adalah variasi dari 'kuy', dipakai sebagai ajakan santai seperti 'ayo' atau 'yuk'.",
  otw: "OTW adalah singkatan dari 'on the way', artinya sedang dalam perjalanan atau menuju ke tempat tujuan.",
  cmiiw:
    "CMIIW adalah singkatan dari 'correct me if I'm wrong', biasanya dipakai saat memberi pendapat sambil membuka kemungkinan salah.",
  gws: "GWS adalah singkatan dari 'get well soon', biasanya dipakai untuk mendoakan orang cepat sembuh.",
  nt: "NT adalah singkatan dari 'nice try', dipakai untuk menghargai usaha seseorang walau belum berhasil.",
  gg: "GG adalah singkatan dari 'good game' atau 'good job', dipakai untuk memuji sesuatu yang bagus atau keren.",
  nolep:
    "Nolep adalah adaptasi dari 'no life', istilah untuk orang yang dianggap kurang bersosialisasi atau terlalu fokus pada dunia sendiri, biasanya game atau internet.",
  halu:
    "Halu adalah singkatan dari 'halusinasi', dipakai untuk menyebut orang yang terlalu berkhayal atau membayangkan sesuatu yang tidak nyata.",
  healing:
    "Healing dalam slang Indonesia biasanya berarti pergi jalan-jalan atau melakukan aktivitas santai untuk menenangkan diri dari penat.",
  flexing:
    "Flexing adalah perilaku memamerkan harta, pencapaian, atau sesuatu yang dimiliki agar terlihat keren atau unggul.",
  insecure:
    "Insecure adalah rasa tidak aman, minder, atau tidak percaya diri terhadap diri sendiri.",
  overthinking:
    "Overthinking adalah kondisi saat seseorang terlalu banyak memikirkan sesuatu sampai cemas atau sulit tenang.",
  redflag:
    "Red flag adalah tanda bahaya atau sinyal negatif dalam seseorang, hubungan, atau situasi yang perlu diwaspadai.",
  greenflag:
    "Green flag adalah tanda positif dalam seseorang, hubungan, atau situasi yang menunjukkan hal sehat dan baik.",
  toxic:
    "Toxic adalah sifat, hubungan, atau lingkungan yang memberi dampak buruk secara emosional atau mental.",
  relate:
    "Relate berarti merasa nyambung atau merasa pengalaman/perasaan orang lain mirip dengan diri sendiri.",
  valid:
    "Valid dalam bahasa gaul berarti perasaan, pendapat, atau pengalaman seseorang dianggap masuk akal dan bisa dipahami.",
  insecurean:
    "Insecurean adalah bentuk percakapan santai untuk menyebut keadaan sedang merasa insecure atau minder.",
  ghosting:
    "Ghosting adalah tindakan tiba-tiba menghilang atau memutus komunikasi tanpa penjelasan, biasanya dalam hubungan atau pendekatan.",
  breadcrumbing:
    "Breadcrumbing adalah perilaku memberi perhatian sedikit-sedikit agar orang lain tetap berharap, tanpa niat serius.",
  drytext:
    "Dry text adalah gaya chat yang terasa dingin, singkat, atau tidak antusias sehingga percakapan terasa hambar.",
  rizz:
    "Rizz adalah slang modern untuk kemampuan menarik perhatian atau merayu seseorang dengan percaya diri dan pesona.",
  simp:
    "Simp adalah istilah untuk orang yang terlalu memuja atau terlalu berusaha menyenangkan orang yang disukai.",
  npc:
    "NPC dalam slang internet dipakai untuk menyebut orang yang dianggap terlalu datar, tidak orisinal, atau seperti karakter figuran.",
  cringe:
    "Cringe adalah rasa malu, geli, atau tidak nyaman karena sesuatu dianggap memalukan, aneh, atau terlalu dibuat-buat.",
  sus: "Sus adalah singkatan dari 'suspicious', artinya mencurigakan atau terasa tidak beres.",
  based:
    "Based adalah slang internet untuk menyebut pendapat atau sikap yang dianggap berani, jujur, dan tidak ikut-ikutan.",
  savage:
    "Savage adalah istilah untuk tindakan atau ucapan yang sangat tajam, berani, dan sering dianggap keren karena tanpa basa-basi.",
  receh:
    "Receh adalah istilah untuk hal-hal sederhana, ringan, atau humor kecil yang tetap bisa bikin ketawa.",
  gaje:
    "Gaje adalah singkatan dari 'nggak jelas', dipakai untuk sesuatu yang membingungkan, aneh, atau tidak terarah.",
  jamet:
    "Jamet adalah slang yang awalnya merujuk stereotip gaya tertentu. Istilah ini bisa bernada merendahkan, jadi sebaiknya dipakai hati-hati.",
  sotoy:
    "Sotoy adalah istilah untuk orang yang sok tahu atau berbicara seolah paling paham padahal belum tentu benar.",
  pansi:
    "Pansos adalah singkatan dari 'panjat sosial', yaitu perilaku mencari perhatian atau status dengan menempel pada orang yang lebih terkenal atau berpengaruh.",
  pansos:
    "Pansos adalah singkatan dari 'panjat sosial', yaitu perilaku mencari perhatian atau status dengan menempel pada orang yang lebih terkenal atau berpengaruh.",
  alay:
    "Alay adalah istilah untuk gaya yang dianggap berlebihan, norak, atau terlalu dibuat-buat. Maknanya bisa subjektif dan kadang merendahkan.",
  lebay:
    "Lebay adalah sikap yang dianggap berlebihan dalam bereaksi, berbicara, atau bertingkah.",
  curcol:
    "Curcol adalah singkatan dari 'curhat colongan', yaitu tiba-tiba bercerita panjang tentang masalah pribadi di tengah obrolan.",
  curhat:
    "Curhat adalah kegiatan menceritakan isi hati, masalah, atau perasaan pribadi kepada orang lain.",
  ngab:
    "Ngab adalah bentuk kebalikan dari kata 'bang', dipakai sebagai sapaan santai di internet.",
  bang:
    "Bang adalah sapaan santai untuk laki-laki, berasal dari 'abang' dan sering dipakai dalam percakapan sehari-hari.",
  sis: "Sis adalah sapaan santai untuk perempuan, berasal dari kata 'sister'.",
  bestie:
    "Bestie adalah panggilan santai untuk teman dekat atau sahabat.",
  besti:
    "Besti adalah variasi penulisan dari 'bestie', artinya teman dekat atau sahabat.",
  menfess:
    "Menfess adalah singkatan dari 'mention confess', yaitu kiriman pesan anonim melalui akun perantara, biasanya di media sosial.",
  fomo:
    "FOMO adalah singkatan dari 'fear of missing out', yaitu rasa takut ketinggalan tren, momen, atau pengalaman orang lain.",
  ytta:
    "YTTA adalah singkatan dari 'yang tahu tahu aja', dipakai saat hanya orang tertentu yang paham maksud pembicaraan.",
  pw: "PW adalah singkatan dari 'posisi wenak', artinya sudah merasa nyaman dan malas berpindah atau mengubah keadaan.",
  mantul:
    "Mantul adalah singkatan dari 'mantap betul', dipakai untuk memuji sesuatu yang dianggap bagus atau keren.",
  gercep:
    "Gercep adalah singkatan dari 'gerak cepat', artinya sigap atau cepat bertindak.",
  sultan:
    "Sultan dalam slang Indonesia dipakai untuk menyebut orang yang sangat kaya atau royal.",
  bokek:
    "Bokek adalah istilah informal yang berarti sedang tidak punya uang atau keuangan lagi tipis.",
  auto:
    "Auto dalam bahasa gaul dipakai untuk menekankan sesuatu yang dianggap langsung terjadi tanpa banyak proses, misalnya 'auto panik'.",
  mleyot:
    "Mleyot adalah slang yang biasanya dipakai untuk menggambarkan kondisi lemas, loyo, atau tidak bertenaga.",
  nongki:
    "Nongki adalah bentuk santai dari 'nongkrong', yaitu berkumpul atau hangout bersama teman.",
  sabeb:
    "Sabeb adalah singkatan slang dari 'santai bebek', dipakai untuk mengajak santai atau tidak panik.",
  cengli:
    "Cengli adalah istilah gaul lama yang berarti adil, fair, atau sesuai aturan.",
  mehong:
    "Mehong adalah slang dari 'mahal bohong', dipakai untuk menyebut harga yang terasa sangat mahal.",
  songong:
    "Songong adalah sikap sombong, meremehkan, atau terlalu merasa hebat.",
  recehan:
    "Recehan dalam slang bisa berarti hal kecil, nominal kecil, atau candaan ringan yang sederhana.",
  ngadi:
    "Ngadi-ngadi berarti mengada-ada, membuat-buat cerita, atau berperilaku tidak masuk akal.",
  mokondo:
    "Mokondo adalah slang internet yang biasa dipakai untuk menyebut laki-laki yang maunya modal omong doang tanpa aksi nyata.",
  pickme:
    "Pick me adalah istilah untuk orang yang berusaha tampil berbeda atau merendahkan kelompoknya sendiri demi mencari validasi atau perhatian.",
  pov:
    "POV adalah singkatan dari 'point of view', artinya sudut pandang. Di media sosial biasanya dipakai untuk membingkai situasi dari perspektif tertentu.",
  roast:
    "Roast adalah candaan atau komentar yang sengaja tajam untuk menyindir atau mengejek, biasanya dalam konteks humor.",
  gaslight:
    "Gaslight atau gaslighting adalah manipulasi psikologis yang membuat seseorang meragukan ingatan, perasaan, atau kewarasannya sendiri.",
  buaya:
    "Buaya dalam slang hubungan biasanya merujuk pada laki-laki yang suka mempermainkan banyak perempuan atau tidak setia.",
  clingy:
    "Clingy adalah sifat terlalu lengket, terlalu bergantung, atau terlalu menuntut perhatian dalam hubungan.",
  effort:
    "Effort dalam bahasa gaul berarti usaha nyata yang ditunjukkan seseorang, terutama dalam hubungan atau pekerjaan.",
  vibes:
    "Vibes adalah kesan, suasana, atau energi yang terasa dari seseorang, tempat, atau situasi.",
  insecuree:
    "Insecuree adalah variasi penulisan santai dari insecure, yaitu rasa minder atau tidak percaya diri.",
};

function isQuestion(text) {
  return text.includes("?") || QUESTION_HINTS.test(text);
}

function formatNowInJakarta() {
  const now = new Date();
  const date = now.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const time = now.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return { date, time };
}

function sanitizeMathExpression(raw) {
  let expr = String(raw || "")
    .replace(/berapa hasil|hasil dari|hitungin|hitung|berapa/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!expr) return null;

  expr = expr.replace(/(\d),(\d)/g, "$1.$2");
  expr = expr.replace(/\^/g, "**");
  expr = expr.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
  expr = expr.replace(/\sx\s/gi, " * ");
  expr = expr.replace(/×/g, "*").replace(/÷/g, "/");

  if (!/^[0-9+\-*/().%\s*]+$/.test(expr)) return null;
  return expr;
}

function trySolveMath(text) {
  const expr = sanitizeMathExpression(text);
  if (!expr) return null;

  try {
    const result = Function(`"use strict"; return (${expr});`)();
    if (!Number.isFinite(result)) return null;
    const rounded = Number.isInteger(result)
      ? String(result)
      : result.toFixed(8).replace(/\.?0+$/, "");
    return `Hasil hitungnya: *${rounded}*`;
  } catch {
    return null;
  }
}

function lookupTopicDefinition(topicRaw) {
  const topic = String(topicRaw || "")
    .toLowerCase()
    .replace(/[?.,!]/g, " ")
    .replace(/\badalah\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!topic) return null;

  const keys = Object.keys(QUICK_EXPLAIN);
  const matched = keys.find((key) => topic === key || topic.includes(key));
  return matched ? QUICK_EXPLAIN[matched] : null;
}

function extractTopic(text) {
  return String(text || "")
    .replace(/^(apa itu|jelaskan|jelasin|arti|maksud|tentang|info|definisi)\s+/i, "")
    .replace(/\badalah\b[:\s]*$/i, "")
    .replace(/[?]+$/g, "")
    .trim();
}

function buildHowToReply(text) {
  const match =
    text.match(/(?:gimana|bagaimana)\s+cara\s+(.+?)\??$/i) ||
    text.match(/(?:cara|how to)\s+(.+?)\??$/i);
  const target = match?.[1]?.trim();
  if (!target) return null;

  return [
    `Untuk *${target}*, langkah praktisnya:`,
    "1) Tentukan target yang spesifik dan terukur.",
    "2) Pecah jadi langkah kecil mingguan.",
    "3) Kerjakan rutin di jam yang konsisten.",
    "4) Evaluasi hasil, lalu revisi caranya.",
    "5) Ulangi sampai stabil.",
  ].join("\n");
}

function buildComparisonReply(text) {
  const match = text.match(/(?:beda|perbedaan|vs|versus)\s+(.+?)\s+(?:dan|vs|versus)\s+(.+)/i);
  if (!match) return null;

  const left = match[1].replace(/\?+$/, "").replace(/\bapa\b$/i, "").trim();
  const right = match[2].replace(/\?+$/, "").replace(/\bapa\b$/i, "").trim();
  if (!left || !right) return null;

  return [
    `Perbandingan *${left}* vs *${right}*:`,
    `- ${left}: cenderung unggul di kebutuhan tertentu.`,
    `- ${right}: cenderung unggul di kebutuhan lain.`,
    "- Pilih berdasarkan tujuan, resource, dan batasanmu.",
    `Kalau kamu kasih konteksnya, aku bisa kasih rekomendasi final pilih ${left} atau ${right}.`,
  ].join("\n");
}

function buildShortQuestionReply(text) {
  const clean = String(text || "").trim();
  if (!clean) return null;

  const directTopic = extractTopic(clean);
  const quick = lookupTopicDefinition(directTopic);
  if (quick) {
    return quick;
  }

  const adalahMatch = clean.match(/^(.+?)\s+adalah\??$/i);
  if (adalahMatch) {
    const quickAdalah = lookupTopicDefinition(adalahMatch[1]);
    if (quickAdalah) {
      return quickAdalah;
    }
  }

  if (/^[a-zA-Z0-9 .+-]{2,30}$/.test(directTopic)) {
    return [
      `Tentang *${directTopic}*:`,
      "- Ini kemungkinan topik atau istilah yang kamu tanyakan.",
      "- Kalau kamu mau definisi singkat: kirim seperti `apa itu topik ini`.",
      "- Kalau kamu mau langkah praktis: kirim seperti `cara pakai topik ini`.",
    ].join("\n");
  }

  return null;
}

function buildGeneralAiReply(text) {
  const topic = extractTopic(text);
  if (!topic) return null;

  return [
    `Jawaban singkat untuk *${topic}*:`,
    "- Fokus dulu ke inti konsep atau masalahnya.",
    "- Lalu lihat fungsi, cara kerja, dan contoh penggunaannya.",
    "- Kalau ini topik teknis, biasanya yang penting adalah kapan dipakai dan apa kelebihannya.",
    `Kalau mau, aku bisa jelaskan *${topic}* dalam versi pemula, ringkas, atau detail.`,
  ].join("\n");
}

function buildWhyReply(text) {
  const match = text.match(/^(?:kenapa|mengapa)\s+(.+?)\??$/i);
  const topic = match?.[1]?.trim();
  if (!topic) return null;

  return [
    `Alasan kenapa *${topic}* bisa terjadi biasanya tergantung konteksnya.`,
    "Penyebab paling umum biasanya ada di faktor utama, kondisi pendukung, dan dampak dari keputusan/sebab sebelumnya.",
    `Kalau kamu mau jawaban yang lebih tepat, aku bisa pecah *${topic}* dari sisi penyebab, dampak, dan solusinya.`,
  ].join("\n");
}

function buildWhatReply(text) {
  const match =
    text.match(/^(?:apa|apa itu|jelaskan|jelasin|arti|maksud)\s+(.+?)\??$/i) ||
    text.match(/^(.+?)\s+adalah\??$/i);
  const topic = match?.[1]?.trim();
  if (!topic) return null;

  const quick = lookupTopicDefinition(topic);
  if (quick) return quick;

  return [
    `*${topic}* adalah sesuatu yang perlu dilihat dari definisi, fungsi, dan contoh penggunaannya.`,
    `Secara umum, inti dari *${topic}* adalah memahami apa itu, kapan dipakai, dan kenapa penting.`,
    `Kalau mau, aku bisa jelaskan *${topic}* versi singkat, pemula, atau detail.`,
  ].join("\n");
}

function buildWhoReply(text) {
  const match = text.match(/^(?:siapa)\s+(.+?)\??$/i);
  const topic = match?.[1]?.trim();
  if (!topic) return null;

  return [
    `Pertanyaan tentang *${topic}* butuh konteks orang, peran, atau identitas yang dimaksud.`,
    "Kalau ini tokoh, jawabannya biasanya mencakup siapa orangnya, kenapa dikenal, dan apa perannya.",
    `Kalau kamu mau, kirim lagi dengan konteks lebih spesifik tentang *${topic}*.`,
  ].join("\n");
}

function buildWhenReply(text) {
  const match = text.match(/^(?:kapan)\s+(.+?)\??$/i);
  const topic = match?.[1]?.trim();
  if (!topic) return null;

  return [
    `Untuk *${topic}*, jawaban waktunya tergantung kejadian atau proses yang dimaksud.`,
    "Biasanya yang dicari adalah tanggal, periode, atau urutan waktunya.",
    `Kalau kamu kasih konteks lebih spesifik tentang *${topic}*, aku bisa bantu susun jawabannya lebih tepat.`,
  ].join("\n");
}

function buildHowGeneralReply(text) {
  const match = text.match(/^(?:gimana|bagaimana)\s+(.+?)\??$/i);
  const topic = match?.[1]?.trim();
  if (!topic) return null;

  return [
    `Cara memahami atau menangani *${topic}* biasanya dimulai dari tujuan utamanya.`,
    "Setelah itu, pecah jadi langkah kecil, jalankan satu per satu, lalu evaluasi hasilnya.",
    `Kalau mau, aku bisa bantu ubah *${topic}* jadi langkah yang lebih praktis.`,
  ].join("\n");
}

function buildAnyTopicReply(text) {
  const topic = extractTopic(text);
  if (!topic) return null;

  return [
    `Aku pahami topiknya tentang *${topic}*.`,
    `Jawaban ringkasnya: *${topic}* perlu dilihat dari pengertian, tujuan, cara kerja, dan contoh nyatanya.`,
    `Kalau kamu mau, aku bisa lanjut jelaskan *${topic}* dengan bahasa yang lebih simpel atau lebih detail.`,
  ].join("\n");
}

function answerQuestion(text) {
  const lower = text.toLowerCase().trim();
  const now = formatNowInJakarta();

  if (/\b(jam berapa|sekarang jam|waktu sekarang)\b/i.test(lower)) {
    return `Sekarang di WIB: *${now.time}*`;
  }

  if (/\b(hari apa|tanggal berapa|tanggal hari ini|hari ini tanggal)\b/i.test(lower)) {
    return `Hari ini: *${now.date}*`;
  }

  const mathAnswer = trySolveMath(text);
  if (mathAnswer) return mathAnswer;

  const comparison = buildComparisonReply(text);
  if (comparison) return comparison;

  const howTo = buildHowToReply(text);
  if (howTo) return howTo;

  const whyReply = buildWhyReply(text);
  if (whyReply) return whyReply;

  const whatReply = buildWhatReply(text);
  if (whatReply) return whatReply;

  const whoReply = buildWhoReply(text);
  if (whoReply) return whoReply;

  const whenReply = buildWhenReply(text);
  if (whenReply) return whenReply;

  const howGeneral = buildHowGeneralReply(text);
  if (howGeneral) return howGeneral;

  const defineMatch = text.match(/^(?:apa itu|jelaskan|jelasin)\s+(.+?)\??$/i);
  if (defineMatch) {
    const topic = defineMatch[1].trim();
    const quick = lookupTopicDefinition(topic);
    if (quick) return quick;

    return [
      `Tentang *${topic}* secara ringkas:`,
      "- Definisi: inti konsepnya.",
      "- Fungsi: dipakai untuk apa.",
      "- Contoh: penerapan nyatanya.",
      `Kalau mau, aku bisa jelasin ${topic} lebih detail sesuai levelmu.`,
    ].join("\n");
  }

  const shortReply = buildShortQuestionReply(text);
  if (shortReply) return shortReply;

  if (isQuestion(text)) {
    return buildGeneralAiReply(text) || buildAnyTopicReply(text);
  }

  return buildAnyTopicReply(text) || [
    "Aku siap jawab berbagai topik.",
    "Contoh: `.tanya api`, `.tanya kenapa langit biru`, `.tanya cara belajar Python`",
  ].join("\n");
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

async function askGroq(question) {
  if (!GROQ_API_KEY) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: AI_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: question,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return extractAiText(data);
  } finally {
    clearTimeout(timeout);
  }
}

async function buildReply(input) {
  try {
    const aiReply = await askGroq(input);
    if (aiReply) {
      return aiReply;
    }
  } catch (error) {
    console.error("Groq tanya error:", error.message);
  }

  return GROQ_API_KEY
    ? answerQuestion(input)
    : [
        "Mode AI belum aktif karena `GROQ_API_KEY` belum diatur.",
        "",
        answerQuestion(input),
      ].join("\n");
}

module.exports = {
  name: "tanya",
  aliases: ["ask", "qna", "qa"],
  description: "Mengaktifkan sesi tanya jawab AI.",
  usage: "tanya [pertanyaan]",
  async execute({ message, text, state, helpers }) {
    if (!helpers.isPrivateUserChat(message)) {
      await message.reply("Command tanya hanya bisa dipakai di chat private bot.");
      return;
    }

    if (state.activeCurhat?.has(message.from)) {
      await message.reply("Kamu sedang di mode curhat. Akhiri dulu dengan `.endcurhat`.");
      return;
    }

    if (state.activeMenfess?.has(message.from)) {
      await message.reply("Kamu sedang di sesi menfess. Selesaikan dulu sesi itu sebelum masuk mode tanya.");
      return;
    }

    const input = String(text || "").trim();
    if (!state.activeTanya.has(message.from)) {
      state.activeTanya.set(message.from, { startedAt: Date.now() });
    }

    if (!input) {
      await message.reply(
        [
          "Mode tanya AI aktif.",
          "Kirim pertanyaan apa saja tanpa perlu pakai `.tanya` lagi.",
          "Untuk berhenti, ketik `.endtanya`.",
        ].join("\n")
      );
      return;
    }

    await message.reply(await buildReply(input));
  },
  async handleSessionMessage({ message, state, helpers }) {
    if (!helpers.isPrivateUserChat(message)) return false;
    if (!state.activeTanya?.has(message.from)) return false;
    if (message.hasMedia) {
      await message.reply("Mode tanya hanya menerima pesan teks. Ketik `.endtanya` untuk keluar.");
      return true;
    }

    const input = String(message.body || "").trim();
    if (!input) {
      await message.reply("Kirim pertanyaan dalam bentuk teks atau ketik `.endtanya` untuk berhenti.");
      return true;
    }

    await message.reply(await buildReply(input));
    return true;
  },
};
