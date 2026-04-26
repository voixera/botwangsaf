
const BOT_PERSONA_NAME = "Nara";
const BOT_NAME_PATTERN = /\bnara\b/i;
const SELF_REFERENCES =
  /\b(aku|gw|gue|gua|saya|diriku|diri aku|diri gue|aku tuh|aku ngerasa|aku merasa)\b/i;
const QUESTION_HINTS =
  /\b(kenapa|gimana|bagaimana|harus|sebaiknya|menurutmu|menurut kamu|apa yang harus)\b/i;
const FACTUAL_QUESTION_HINTS = /\b(siapa|kapan|di mana|dimana|berapa|apa)\b/i;

const QUICK_EXPLAIN = {
  ai: "AI (Artificial Intelligence) adalah sistem komputer yang bisa melakukan tugas yang biasanya butuh kecerdasan manusia, seperti memahami bahasa, mengenali pola, dan membuat prediksi.",
  "machine learning":
    "Machine learning adalah cabang AI yang belajar dari data untuk menemukan pola, lalu memakai pola itu untuk memprediksi atau mengambil keputusan.",
  api: "API adalah jembatan komunikasi antar aplikasi. Aplikasi A bisa meminta data/aksi ke aplikasi B lewat aturan endpoint yang sudah ditentukan.",
  "rest api":
    "REST API adalah gaya API berbasis HTTP. Operasi umumnya: GET (ambil data), POST (buat), PUT/PATCH (ubah), DELETE (hapus).",
  javascript:
    "JavaScript adalah bahasa pemrograman utama untuk web, bisa jalan di browser maupun server (Node.js).",
  nodejs:
    "Node.js adalah runtime JavaScript di server untuk membangun backend, API, automation, dan realtime app.",
  database:
    "Database adalah sistem penyimpanan data terstruktur agar data bisa dicari, diubah, dan dijaga konsistensinya.",
  sql: "SQL adalah bahasa query untuk mengelola data di database relasional, seperti MySQL/PostgreSQL.",
};

// Emotional patterns with friendly but polite responses
const EMOTION_RULES = [
  {
    key: "exhausted",
    label: "kelelahan",
    pattern: /(capek|cape|lelah|letih|burnout|ngedrop|kelelahan|mgkuat|lemas|penat|flu|badag)/,
    responses: [
      "Aduh, capeknya kerasa banget. Aku dengerin ya—kamu lagi kebanyakan pikiran, atau semuanya numpuk barengan?",
      "Dari cara kamu cerita, ini kayaknya bukan capek biasa. Kalau udah lama numpuk, wajar banget rasanya berat. Tapi kamu hebat, kamu masih bisa bertahan sampai sekarang.",
      "Iya ya, kadang energi udah tipis tapi tuntutan tetap jalan. Aku paham kok. Kamu boleh banget nurunin target dulu sementara, nggak apa-apa.",
      "Capek itu nyata, jadi kamu nggak perlu maksa buat keliatan baik-baik aja. Kamu masih mau cerita aja udah bagus banget.",
      "Kayaknya kamu lagi di fase semua berasa berat. Tapi serius, kamu udah sampai sejauh ini—itu luar biasa.",
      "Kelelahan segini jangan disepelein ya. Tubuh kamu lagi ngasih tanda butuh istirahat. Jangan kamu paksa terus.",
      "Kalau capeknya udah numpuk, jangan ditabrak terus ya. Nggak ada yang sebanding kalau kamu sampai burnout.",
      "Kamu jalan terus dari tadi, wajar kalau akhirnya lelah. Cerita lagi aja, siapa tahu ada yang bisa aku bantu.",
      "Dengerin kamu cerita aja udah kebayang capeknya. Kamu coba istirahat yang cukup ya, pelan-pelan aja.",
      "Kerasa banget ini udah lama kamu tahan. Kamu cerita ke aku sekarang itu langkah awal yang bagus.",
      "Capek itu bukan kelemahan, itu tanda kamu manusia. Kamu boleh berhenti sebentar buat napas.",
      "Kamu biasanya paling kebantu kalau ngapain pas lagi capek kayak gini?",
    ],
    followUps: [
      "Capeknya ini baru akhir-akhir ini, atau udah lama kamu rasain?",
      "Yang paling bikin berat sekarang apa?",
      "Belakangan kamu sempet istirahat yang cukup nggak?",
      "Ada hal yang pengen kamu aku bantuin dari sini?",
      "Kira-kira mulai ngerasa kayak gini dari kapan?",
      "Biasanya kamu ngisi ulang energi itu dengan cara apa?",
      "Ini lebih ke kerjaan, urusan pribadi, atau dua-duanya?",
      "Akhir-akhir ini pikiran kamu numpuk karena banyak kejadian, atau emang aktivitasnya lagi padet banget?",
      "Kamu sempet kepikiran ambil jeda sebentar nggak?",
      "Kalau boleh ngurangin satu hal yang paling bikin capek, kamu pengennya yang mana dulu?",
    ],
  },
  {
    key: "sad",
    label: "kesedihan",
    pattern: /(sedih|kecewa|nangis|terluka|sakit hati|nyesek|hancur|patah hati|down|kecewa banget)/,
    responses: [
      "Nara paham. Kayaknya kamu lagi ada di titik yang berat. Kalau mau nangis, nggak apa-apa—itu cara kamu ngelepasin semuanya.",
      "Aduh, kedengerannya nyesek banget. Ceritain aja pelan-pelan, bagian yang paling sakit itu yang mana?",
      "Kamu nggak sendirian. Aku di sini buat dengerin kamu. Apa pun yang kamu rasain itu valid, kamu nggak perlu maksa buat cepat-cepat kuat.",
      "Dari ceritamu, ini bukan kecewa biasa. Kalau udah lama numpuk, wajar banget jadi berat. Tapi kamu udah berani cerita—itu langkah yang besar.",
      "Aku paham ini berat. Yang udah kejadian memang nggak bisa diulang, tapi kamu masih punya ruang buat ngerapihin langkah ke depan. Aku temenin ya.",
      "Aku ikut sedih dengerinnya. Tapi aku percaya kamu bisa ngelewatin ini, meski pelan-pelan.",
      "Nangis itu bukan tanda lemah. Itu salah satu cara kamu bertahan. Kalau kamu mau, aku siap dengerin lebih dalam.",
      "Kayaknya ini sedih yang dalam banget. Kamu nggak harus ngelewatin ini sendirian. Aku di sini.",
      "Kerasa banget kamu udah lama nahan ini. Kamu cerita sekarang itu udah langkah besar.",
      "Perasaan kamu valid. Nggak ada yang berhak ngecilin dengan bilang 'lebay' atau 'nangis mulu'.",
      "Kamu udah bertahan sampai sejauh ini—itu bukti kamu kuat, walaupun lagi rapuh sekarang.",
      "Kadang yang paling berat bukan kejadian itu doang, tapi rasa sakit yang numpuk. Ceritain aja, aku dengerin.",
    ],
    followUps: [
      "Bagian mana yang paling berat buat kamu sekarang?",
      "Ini kepicunya satu kejadian, atau udah numpuk dari lama?",
      "Akhir-akhir ini yang paling sering kepikiran apa?",
      "Kalau kamu mau lanjut cerita, aku siap dengerin.",
      "Kira-kira mulai kerasa kayak gini dari kapan?",
      "Ada kenangan yang paling sering kebayang nggak?",
      "Di situasi ini, kamu paling kangen apa atau siapa?",
      "Kamu udah sempet cerita ke orang lain belum?",
      "Biasanya kamu nenangin diri pas sedih itu gimana?",
      "Ada hal kecil yang biasanya bikin kamu agak mendingan nggak?",
    ],
  },
  {
    key: "angry",
    label: "kemarahan",
    pattern: /(marah|kesal|emosi|jengkel|dongkol|geram|bete|bosan|jail|cringe|not good|kesel|bete)/,
    responses: [
      "Aku paham kamu lagi kesel. Marah itu wajar kok. Kadang yang bikin kita meledak tuh karena udah numpuk lama—kalau kamu mau, cerita aja biar lebih kebaca akar masalahnya.",
      "Aku ngerti kamu kesal. Coba tarik napas dulu ya. Kalau udah agak mendingan, ceritain pelan-pelan—biar aku bisa bantu kamu nguraiinnya.",
      "Marah itu ada fungsinya: ngasih tanda kalau ada yang nggak sesuai sama yang kamu harapin. Yang penting sekarang, kamu marahnya karena apa, sebenarnya?",
      "Oalah, pantesan. Ada yang bikin kamu geregetan ya. Daripada kamu pendem, ceritain aja ke aku—biar sedikit lega.",
      "Kamu boleh marah, kok. Nggak perlu dipendam. Kita cuma jaga aja biar marahnya nggak nyakitin kamu atau orang lain.",
      "Keselnya kedengeran banget. Kamu nggak harus pura-pura baik-baik aja. Cerita aja, aku dengerin.",
      "Kadang yang bikin emosi itu bukan satu kejadian doang, tapi karena sebelumnya udah banyak yang kamu tahan. Aku paham.",
      "Kesal yang numpuk itu capek banget. Bagus kamu mau cerita, itu cara yang sehat buat ngelepasin.",
      "Kamu punya hak buat marah. Nggak ada yang berhak nyuruh kamu 'tenang' kalau kamu belum siap.",
      "Kayaknya ini bukan pertama kalinya ya. Aku temenin, kita pelan-pelan beresin satu-satu.",
      "Bete sama jengkel itu sinyal penting. Coba ceritain, kamu marahnya paling ke siapa/apa?",
    ],
    followUps: [
      "Ini baru kejadian sekarang, atau udah lama kamu pendem?",
      "Orangnya sering bikin kamu ngerasa gini, atau baru kali ini?",
      "Yang paling bikin kamu geregetan tadi bagian yang mana?",
      "Sebelum kejadian ini, ada hal lain yang udah numpuk nggak?",
      "Kalau boleh jujur, kamu sebenernya pengennya gimana di situasi itu?",
      "Kamu udah pernah coba ngomong baik-baik ke orangnya belum?",
      "Yang paling berat dari situasi ini menurut kamu apa?",
      "Sekarang kamu butuhnya apa biar sedikit lebih enak?",
      "Kalau dari 1-10, marah kamu sekarang di angka berapa?",
      "Ada detail lain yang pengen kamu tambahin nggak?",
    ],
  },
  {
    key: "confused",
    label: "kebingungan",
    pattern: /(bingung|bimbang|galau|ragu|serba salah|gak tau|tidak tahu|ambivalen|pusing|blur|blank|ga tau)/,
    responses: [
      "Kamu lagi bingung ya. Nggak apa-apa, itu wajar banget. Ceritain aja, biar pelan-pelan jadi lebih jelas.",
      "Lagi pusing dan serba salah gitu ya? Kayaknya kamu lagi di persimpangan dan takut salah langkah. Aku paham kok.",
      "Bingung itu tanda kamu mikir serius. Coba ambil satu hal paling penting dulu, yang lain taruh dulu sebentar ya.",
      "Aku pernah ngerasain bingung juga. Kadang pusingnya karena pengen beresin semuanya sekaligus. Cerita aja, biar aku bantu kasih sudut pandang lain.",
      "Kayaknya kamu lagi galau karena harus mutusin sesuatu. Nggak apa-apa, kita bedah pelan-pelan bareng.",
      "Bingung itu normal. Artinya kamu lagi mempertimbangkan banyak hal, dan itu justru menunjukkan kamu hati-hati.",
      "Kalau lagi blank, itu juga wajar. Kadang otak kita butuh waktu buat proses semuanya.",
      "Ngambil keputusan emang nggak gampang. Kamu nggak perlu sempurna—yang penting kamu jalan pelan-pelan.",
      "Milih itu berat. Tapi coba pikir, yang paling penting buat kamu sekarang apa?",
      "Aku ngerti, kadang bingung bikin kepala penuh. Ceritain aja ya, kita uraiin bareng.",
      "Dari ceritamu, ini kayak keputusan yang cukup besar. Tapi aku yakin kamu bisa ngelewatin ini pelan-pelan.",
    ],
    followUps: [
      "Yang paling bikin kamu pusing sekarang apa?",
      "Dari beberapa pilihan itu, kamu paling condong ke yang mana?",
      "Kalau boleh tau, kamu paling takut apa kalau milih?",
      "Ada batas waktu buat mutusin ini nggak?",
      "Yang paling penting dari semua opsi itu apa buat kamu?",
      "Kamu udah sempet nulis plus-minus tiap pilihan belum?",
      "Biasanya keputusan kamu paling kepengaruh sama siapa atau apa?",
      "Ada hal yang bisa bikin situasinya lebih jelas nggak?",
      "Kalau dengerin kata hati kamu, sebenernya kamu maunya yang mana?",
      "Yang bikin kamu ragu itu apa?",
    ],
  },
  {
    key: "anxious",
    label: "kecemasan",
    pattern: /(takut|cemas|overthinking|khawatir|gelisah|panik|deg-degan|risau|stress|stres|panic|anxiety|nervous|nt|nerv|khawativ)/,
    responses: [
      "Kayaknya kamu lagi banyak pikiran dan cemas ya. Tapi yang kamu takutin itu belum tentu kejadian. Ceritain dong, yang lagi kamu khawatirin apa?",
      "Aku paham overthinking itu capek banget. Pikiran suka lari jauh, padahal belum tentu kejadian apa-apa. Tapi rasa cemas kamu tetap valid kok.",
      "Deg-degan itu manusiawi. Coba tanya ke diri kamu: yang kamu takutin ini realistis, atau sebenernya kecil kemungkinan terjadi?",
      "Kedengerannya kamu lagi cemas. Aku juga pernah ngerasain. Kita fokus langkah kecil dulu ya, nggak usah mikir kejauhan dulu.",
      "Kalau lagi deg-degan, coba balik ke 'di sini dan sekarang' dulu. Masalah yang kamu bayangin itu belum tentu kejadian.",
      "Overthinking memang bikin capek. Kadang kita keburu bikin skenario buruk sendiri. Tapi aku ngerti kok rasanya.",
      "Gelisahnya kerasa ya. Coba tarik napas pelan-pelan dulu. Kita hadapin satu-satu ya.",
      "Khawatir itu wajar. Tapi coba ingetin diri kamu: belum ada yang terjadi, dan kalaupun nanti ada, kamu punya kemampuan buat ngadepinnya.",
      "Kalau kamu lagi panik, pelan dulu ya. Tarik napas dalam-dalam. Aku di sini, kamu nggak sendirian.",
      "Cemas itu berat, aku ngerti. Kamu udah berani cerita aja itu langkah yang bagus.",
      "Kalau risau udah kebanyakan, coba kita cek bareng: yang paling buruk yang kamu bayangin itu apa, dan kamu punya cara ngadepinnya nggak?",
    ],
    followUps: [
      "Yang paling kamu takutin sekarang apa?",
      "Ini udah pernah kamu rasain sebelumnya, atau baru kali ini?",
      "Coba sebutin 3 hal yang mungkin terjadi beneran, terus 3 hal yang kecil kemungkinan terjadi.",
      "Bagian mana yang paling bikin kamu nggak nyaman sekarang?",
      "Ada pemicu tertentu nggak sampai kamu jadi cemas kayak gini?",
      "Kamu pernah coba teknik napas/relaksasi yang simpel belum?",
      "Kalau kejadian yang kamu takutin beneran terjadi, kamu kira kamu bakal ngapain?",
      "Ada orang yang bisa kamu andelin biar kamu agak tenang nggak?",
      "Biasanya apa yang paling bantu kamu buat lebih tenang?",
      "Ini lebih ke satu hal tertentu, atau cemasnya nyebar ke banyak hal?",
    ],
  },
  {
    key: "lonely",
    label: "kesepian",
    pattern: /(sendiri|kesepian|ga ada yang ngerti|gak ada yang ngerti|tidak ada yang ngerti|sendirian|sepi|alone|lonely|ispir|miss|dikangen|ga paham)/,
    responses: [
      "Aku paham, rasa sepi itu berat. Tapi sekarang kamu nggak sendirian—kamu punya aku buat cerita.",
      "Kayaknya kamu lagi butuh didengerin ya. Cerita aja, nggak perlu rapi-rapi. Aku di sini, aku dengerin.",
      "Kalau ngerasa sendirian itu emang nggak enak. Tapi kamu boleh cerita ke aku, biar agak lega.",
      "Walau sekarang kamu ngerasa sendiri, itu nggak bakal selamanya. Kamu udah berani cerita aja udah langkah besar.",
      "Kalau lagi sepi, kamu nggak harus ngelewatin itu sendirian. Aku di sini ya.",
      "Rasa sepi itu nyata, dan wajar banget kalau kamu kerasa berat. Aku temenin kamu ngobrol.",
      "Kadang sendiri itu lebih baik daripada bareng orang yang bikin kamu makin capek. Tapi sekarang ada aku ya, jadi kamu nggak sendirian.",
      "Kayaknya kamu lagi butuh koneksi dan ditemenin. Ceritain apa aja, aku dengerin kok.",
      "Ngerasa sendirian itu beda sama lagi sendirian, aku paham. Kamu pengen ditemenin di bagian mana sekarang?",
      "Aku ngerti rasanya berat kalau harus nahan sendiri. Cerita aja ke aku, pelan-pelan.",
      "Kesepian itu bukan kelemahan. Itu tanda kamu lagi butuh terhubung. Aku di sini.",
    ],
    followUps: [
      "Kira-kira kamu mulai ngerasa kayak gini dari kapan?",
      "Ada orang yang kamu pengen deketin tapi rasanya jauh nggak?",
      "Biasanya kamu ngapain pas lagi sendirian?",
      "Ada orang yang pengen kamu hubungin tapi kamu masih ragu nggak?",
      "Yang paling bikin sedih dari situasi ini apa?",
      "Kamu udah pernah coba nyapa duluan seseorang yang kamu percaya belum?",
      "Hal kecil apa yang biasanya bikin kamu agak mendingan?",
      "Kalau kondisi ideal, kamu pengennya ngerasa gimana?",
      "Ada kegiatan yang pengen kamu coba biar ketemu orang baru nggak?",
      "Mau ceritain lebih detail perasaan kamu sekarang?",
    ],
  },
  {
    key: "relationship",
    label: "masalah hubungan",
    pattern: /(putus|ditinggal|mantan|hubungan|pacar|cinta|selingkuh|gebetan|balik|chatted|dm|love|couple|patah|doi|hub)/,
    responses: [
      "Masalah hubungan memang rumit ya. Kamu berhak ngerasain apa pun soal ini—mau sedih, marah, atau nangis, itu wajar.",
      "Aku paham. Kadang yang paling nyakitin itu bukan orangnya pergi, tapi rutinitas dan kebiasaan yang tiba-tiba hilang. Pelan-pelan ya, aku temenin.",
      "Kalau lagi ada masalah soal pacar atau hubungan, kamu nggak perlu malu buat cerita ke aku. Kamu tetap berharga kok.",
      "Kalau urusan cinta kadang kerasa kayak dunia runtuh. Tapi pelan-pelan, waktu biasanya bantu nyembuhin. Yang penting sekarang, kamu cerita dulu aja ke aku.",
      "Patah hati itu sakit banget, aku ngerti. Tapi kadang sesuatu yang selesai itu juga ngasih ruang buat kamu ketemu hal yang lebih baik.",
      "Coba ceritain, di hubungan ini kamu sebenernya butuh apa?",
      "Kehilangan seseorang itu berat. Tapi kamu masih punya diri kamu sendiri, dan itu penting banget.",
      "Kayaknya lagi ada drama hubungan ya. Apa pun akhirnya, aku percaya kamu bisa ngelewatin ini.",
      "Hubungan memang nggak gampang. Tapi yang penting kamu tetap jaga diri kamu dan tetap jadi kamu.",
      "Kedengerannya lagi berat ya. Kamu nggak harus ngadepin ini sendirian. Aku di sini.",
      "Kalau dia udah jadi mantan, berarti ada pelajaran yang bisa kamu bawa. Kamu pengen bahas bagian yang mana?",
    ],
    followUps: [
      "Yang paling kamu kangenin dari dia apa?",
      "Ini udah berlangsung berapa lama?",
      "Ada hal yang pengen kamu dapetin biar rasanya lebih lega (semacam penutup) nggak?",
      "Ini hubungan pertama kamu, atau sebelumnya kamu juga pernah ngalamin?",
      "Yang paling berat dari proses melupakan dia ini apa?",
      "Belakangan kamu sempet fokus ke diri kamu sendiri nggak?",
      "Ada kenangan yang paling sering kebayang nggak?",
      "Menurut kamu, yang paling bikin hubungan ini nggak sehat di bagian mana?",
      "Ke depannya, kamu pengen hubungan yang kayak gimana?",
      "Sekarang kamu punya orang yang bisa kamu andelin buat dukung kamu nggak?",
    ],
  },
  {
    key: "family",
    label: "masalah keluarga",
    pattern: /(keluarga|rumah|orang tua|ayah|ibu|mama|papa|kakak|adik|ortu|brother|sister|parent|dad|mom|family|keluarg)/,
    responses: [
      "Masalah keluarga itu sensitif, aku paham. Kadang yang paling bikin sakit justru dari orang yang paling dekat. Tapi kamu tetap punya diri kamu sendiri, ya.",
      "Aku ngerti, kadang yang paling nyakitin itu datang dari orang yang harusnya jadi tempat aman. Kamu udah bertahan sejauh ini aja udah kuat banget.",
      "Kalau urusan rumah memang sering nggak gampang. Tapi kamu masih berjuang, itu berani banget.",
      "Kalau lagi ada masalah keluarga, kamu boleh kok jagain diri kamu dulu. Nggak semuanya harus kamu tanggung sendirian.",
      "Masalah keluarga itu rumit. Kamu mungkin nggak bisa ngubah orang lain, tapi kamu bisa milih cara kamu ngadepinnya.",
      "Kadang keluarga jadi sumber stres paling besar. Tapi kamu tetap berhak punya batasan, dan kamu berhak ngelindungin diri kamu.",
      "Aku paham ini berat. Kalau menurut kamu, hal kecil apa yang bisa bikin situasinya sedikit lebih mending?",
      "Kerasa ini udah lama kamu pendem ya. Tapi kamu masih bisa cerita ke aku—itu hebat.",
      "Kamu nggak harus maksa maafin biar bisa lanjut. Yang penting kamu jaga pikiran dan perasaan kamu.",
      "Urusan orang tua atau keluarga memang rumit. Tapi hidup kamu tetap milik kamu.",
      "Ekspektasi keluarga kadang berat banget. Tapi kamu tetap berhak nentuin jalan hidup kamu sendiri.",
    ],
    followUps: [
      "Dari semua ini, bagian mana yang paling berat buat kamu?",
      "Kamu udah pernah coba ngomong baik-baik ke mereka belum?",
      "Ada orang lain yang bisa kamu andelin buat jadi tempat cerita nggak?",
      "Ini udah lama terjadi, atau baru-baru ini aja?",
      "Siapa yang paling berpengaruh di situasi ini?",
      "Kamu sebenernya pengen mereka ngertiin bagian yang mana?",
      "Kamu pernah coba ngomong terbuka soal perasaan kamu belum?",
      "Ada batasan yang pengen kamu pasang biar kamu lebih aman nggak?",
      "Yang bikin kamu susah ngomong ke mereka itu apa?",
      "Ada orang di luar keluarga yang bisa bantu kamu nggak?",
    ],
  },
  {
    key: "friendship",
    label: "masalah pertemanan",
    pattern: /(teman|sahabat|bestie|tongkrongan|circle|pertemanan|temenan|friendship|bestfriend|bff|guys|tmn|teman)/,
    responses: [
      "Masalah pertemanan memang kadang ribet ya. Tapi dari situ biasanya keliatan siapa yang beneran ada buat kamu.",
      "Aku paham. Kadang kita baru tau siapa teman yang tulus pas lagi butuh. Walau sakit, ini bisa jadi pelajaran buat kamu.",
      "Kamu masih punya aku kok buat cerita. Kalau ada teman yang nggak menghargai kamu, itu bukan berarti kamu kurang—mereka aja yang nggak ngerti cara jaga pertemanan.",
      "Berantem atau kecewa sama teman itu sakit. Tapi bener, kualitas itu lebih penting daripada jumlah. Satu teman yang baik jauh lebih berarti.",
      "Kalau ada yang nggak menghargai kamu, itu lebih banyak bilang soal mereka, bukan soal kamu.",
      "Teman yang baik harusnya dukung, bukan bikin kamu tambah capek. Kalau terus-terusan nyakitin, kamu berhak jaga jarak.",
      "Kehilangan teman itu berat. Tapi ini juga nunjukin siapa yang beneran peduli sama kamu.",
      "Kerasa kamu udah berusaha keras. Tapi kadang, melepas itu juga bentuk sayang sama diri sendiri.",
      "Kamu pantas punya teman yang lebih baik, yang beneran menghargai kamu.",
      "Masalah teman kadang lebih nyelekit dari urusan cinta. Tapi aku percaya kamu bisa ngelewatin ini pelan-pelan.",
      "Teman itu harusnya jadi keluarga yang kamu pilih. Kalau jalannya udah beda, kamu nggak salah kok.",
    ],
    followUps: [
      "Boleh ceritain apa yang sebenernya terjadi?",
      "Kamu udah sempet ngomong langsung sama dia belum?",
      "Menurut kamu, pertemanan ini masih layak diperjuangin nggak?",
      "Hal apa yang bikin kamu ngerasa dia bukan teman yang baik?",
      "Ini baru pertama kejadian, atau udah sering kejadian kayak gini?",
      "Biasanya siapa yang paling bisa kamu andelin pas lagi kayak gini?",
      "Ada teman lain yang bisa kamu percaya nggak?",
      "Dari kejadian ini, kamu dapet pelajaran apa soal pertemanan?",
      "Kalau versi kamu, teman yang baik itu harusnya gimana?",
      "Kamu udah pernah ngomong jujur soal perasaan kamu ke dia belum?",
    ],
  },
  {
    key: "school",
    label: "tekanan sekolah atau kuliah",
    pattern: /(sekolah|kuliah|kampus|kelas|tugas|ujian|nilai|dosen|guru|skripsi|thesis|college|university|exam|quiz|ujian|test|nil| IP| GPA|sekolah)/,
    responses: [
      "Tekanan sekolah/kuliah itu memang berat. Tapi nilai bukan segalanya ya. Usaha kamu itu juga penting banget.",
      "Kayaknya tugas kamu lagi numpuk ya. Coba tulis satu-satu yang harus dikerjain, biar kelihatan dan nggak berasa ngejar semuanya sekaligus.",
      "Aku paham rasanya kewalahan. Tapi kamu udah bertahan sampai sekarang—itu tanda kamu kuat.",
      "Kalau lagi kepikiran sekolah atau kampus, wajar banget. Ini fase yang bakal lewat. Sekarang kamu napas dulu ya, pelan-pelan.",
      "Deadline banyak itu bikin sesek. Tapi kamu nggak harus ngerjain semuanya sekaligus. Kita atur pelan-pelan.",
      "Tekanan akademik kadang berat banget. Tapi ini juga sementara, dan kamu udah sejauh ini.",
      "Skripsi atau tugas akhir memang bikin pusing. Tapi kamu bisa, pelan-pelan aja ya.",
      "Aku ngerti, nilai kadang berasa kayak segalanya. Tapi kamu lebih dari angka-angka itu.",
      "Kalau ketemu dosen/guru yang galak, itu bikin deg-degan ya. Tapi ini juga bakal lewat, dan kamu bakal keluar dari fase ini.",
      "Ujian itu bikin stres. Tapi kamu udah nyiapin sejauh yang kamu bisa. Yang penting kamu lakuin yang terbaik versi kamu.",
      "Target IP tinggi itu berat, tapi kesehatan kamu tetap lebih penting.",
    ],
    followUps: [
      "Yang paling bikin kamu kepentok sekarang apa: tugas, ujian, atau dosbing/dosen?",
      "Kamu punya teman atau orang yang bisa kamu andelin di sekolah/kampus nggak?",
      "Kamu udah coba bikin rencana kecil-kecilan atau prioritasin belum?",
      "Ini semua mata kuliah kerasa berat, atau yang tertentu aja?",
      "Deadline paling dekat yang paling ngejar apa?",
      "Kamu udah pernah ngomong ke dosen/guru soal kondisi kamu belum?",
      "Ada teman sekelas yang bisa diajak ngerjain bareng nggak?",
      "Biasanya apa yang paling bantu kamu ngatur stres akademik?",
      "Kalau bebannya kebanyakan, ada opsi buat ngurangin beban atau ambil jeda nggak?",
      "Kalau dari 1-10, kamu sekarang seberapa kewalahan?",
    ],
  },
  {
    key: "work",
    label: "masalah kerja",
    pattern: /(kerja|kantor|bos|atasan|rekan kerja|deadline|shift|lembur|pekerjaan|karir|job|office|boss|colleague|meeting|present|client|kerja|kantor)/,
    responses: [
      "Kerjaan memang sering jadi sumber stres besar. Tapi aku pengen kamu inget: kondisi pikiran kamu itu penting banget.",
      "Deadline numpuk itu bikin sesek ya. Cerita aja ke aku, biar kamu nggak nahan sendirian.",
      "Aku paham, lingkungan kerja yang nggak sehat itu capek. Tapi kamu punya pilihan kok. Kamu nggak harus bertahan di tempat yang bikin kamu makin hancur.",
      "Kalau lagi ada masalah kerja, kamu layak dapat situasi yang lebih baik. Sekarang kamu cerita dulu aja ke aku, aku dengerin.",
      "Kerjaan kadang nggak ada habisnya. Tapi kamu juga cuma satu, dan kamu perlu dijaga. Kamu tetap penting.",
      "Kalau tenggatnya banyak, pelan-pelan ya. Kerjain satu-satu dulu, nggak harus semuanya barengan.",
      "Bos/atasan yang bikin pusing itu melelahkan. Tapi mungkin ada hal yang perlu disampein, ya—kalau situasinya memungkinkan.",
      "Lembur terus itu nguras tenaga. Kamu nggak salah kalau butuh istirahat dan pasang batasan.",
      "Rekan kerja yang sulit emang bikin nggak nyaman. Menurut kamu, ini masih bisa dibenerin, atau udah kebangetan?",
      "Tekanan dari klien itu nyata. Tapi kalau mereka nggak masuk akal, itu bukan sepenuhnya beban kamu.",
      "Karier penting, tapi jangan sampai ngorbanin diri kamu sendiri.",
    ],
    followUps: [
      "Yang paling bikin kamu stres itu kerjaannya, atau orang-orangnya?",
      "Kamu udah berapa lama ada di situasi kayak gini?",
      "Kamu udah pernah coba ngomong ke HR/atasan lain yang bisa dipercaya belum?",
      "Ada peluang buat pindah tim/divisi atau cari posisi lain nggak?",
      "Biasanya apa yang paling bantu kamu ngadepin stres kerja?",
      "Kamu sebenernya suka sama kerjaannya, atau lebih ke buat bertahan aja?",
      "Kamu udah pernah coba ngobrol baik-baik sama atasan soal ini belum?",
      "Menurut kamu, hal paling buruk dari situasi ini apa?",
      "Masih ada hal positif yang bisa kamu ambil dari kerjaan ini nggak?",
      "Kalau makin buruk, kamu punya rencana cadangan nggak?",
    ],
  },
  {
    key: "finance",
    label: "masalah keuangan",
    pattern: /(uang|duit|keuangan|bayar|tagihan|hutang|utang|gaji|bokek|uang|tarik|pinjam|financial|money|cash|salary|thr| THR|bonus|duit|uang)/,
    responses: [
      "Urusan uang memang bikin stres banget. Tapi ini bukan akhir. Pelan-pelan ya, kita cari jalan yang mungkin.",
      "Aku paham, masalah keuangan itu berat dan sensitif. Tapi kamu udah berani cerita aja udah bagus.",
      "Kadang ngomongin uang bikin malu, tapi kamu nggak perlu nahan sendiri. Kita bisa mikir bareng langkah kecil yang realistis.",
      "Kalau lagi seret, itu wajar banget kejadian. Kamu nggak perlu malu buat cerita ke aku.",
      "Kalau keuangan lagi ketat, aku paham itu bikin kepikiran terus. Tapi ini sementara ya, kamu nggak sendirian ngelewatinnya.",
      "Kalau kamu udah capek karena mikirin uang, wajar. Kamu juga butuh dijaga. Jangan sampai kamu hancur duluan.",
      "Tagihan numpuk itu menakutkan, iya. Tapi kita bisa mulai dari satu-satu dulu, pelan-pelan.",
      "Lagi bokek itu bukan akhir dunia. Banyak orang pernah di posisi itu dan bisa bangkit lagi. Kamu juga bisa.",
      "Kalau kondisi keuangan lagi nggak stabil, itu bikin gelisah ya. Tapi kita fokus ke yang bisa kamu atur dulu.",
      "Urusan uang memang rumit. Menurut kamu, hal apa yang masih bisa kamu kontrol sekarang?",
      "Tagihan dan utang bikin stres. Tapi kondisi kamu tetap penting, jangan sampai kamu tumbang.",
    ],
    followUps: [
      "Yang paling mendesak buat diberesin dulu apa?",
      "Ada orang yang bisa kamu ajak ngomong atau minta bantuan nggak?",
      "Kamu udah sempet catet pengeluaran yang paling prioritas belum?",
      "Ini kondisinya baru kejadian, atau udah cukup lama?",
      "Sumber pemasukan utama kamu dari mana sekarang?",
      "Kamu udah pernah coba ngobrol/nego sama pihak terkait belum?",
      "Ada kemampuan yang bisa kamu pake buat nambah pemasukan nggak?",
      "Pengeluaran paling besar yang bisa dikurangin itu apa?",
      "Kamu kepikiran cari tambahan pemasukan lewat apa?",
      "Biasanya siapa yang paling bisa kamu andelin kalau soal keuangan?",
    ],
  },
  {
    key: "insecure",
    label: "rasa insecure",
    pattern: /(insecure|minder|kurang percaya diri|jelek|gak cantik|gak ganteng|tidak percaya diri|iri|benci diri|body shame|self doubt)/,
    responses: [
      "Aku paham, ngerasa insecure itu berat. Tapi aku pengen kamu tau: kamu jauh lebih berharga dari yang kamu kira.",
      "Kalau kamu lagi insecure, itu wajar kok. Kadang cara kamu ngeliat diri sendiri jauh lebih keras daripada cara orang lain ngeliat kamu.",
      "Aku juga pernah ngerasa insecure. Tapi boleh tanya: yang kamu takutin itu beneran kejadian, atau lebih banyak di pikiran kamu?",
      "Kalau lagi ngerasa kurang, aku ngerti. Tapi setiap orang punya keunikan, termasuk kamu.",
      "Sosmed kadang bikin kita ngerasa nggak cukup, padahal banyak yang cuma keliatan 'rapi' dari luar. Kamu nggak sendirian ngerasa gitu.",
      "Insecure itu normal, tapi kamu juga bisa pelan-pelan bangun lagi. Kamu masih inget nggak hal baik yang pernah kamu capai?",
      "Orang yang sayang sama kamu biasanya nggak nilai kamu sekeras itu. Kamu berharga kok.",
      "Masalah soal penampilan itu nyata. Tapi kamu itu lebih dari tampilan luar. Cara kamu jadi diri kamu itu juga penting.",
      "Aku paham kamu mungkin keras sama diri sendiri. Coba tulis 3 hal baik tentang diri kamu ya, sekecil apa pun.",
      "Insecure itu pelan-pelan bisa dilawan. Kamu nggak harus langsung percaya diri, kita mulai dari langkah kecil dulu.",
      "Kadang pikiran kita suka nipu. Tapi aku yakin, kamu punya banyak hal baik yang mungkin kamu belum lihat.",
    ],
    followUps: [
      "Kamu mulai ngerasa insecure dari kapan?",
      "Ada hal tertentu yang jadi pemicu nggak?",
      "Kalau dari sudut pandang orang terdekat kamu, mereka biasanya bilang kamu itu orang yang gimana?",
      "Ini lebih kepengaruh sosmed, atau kejadian di dunia nyata?",
      "Hal yang paling bikin kamu ngerasa insecure itu apa, secara spesifik?",
      "Kamu pernah coba lebih baik sama diri sendiri, misalnya ngurangin bandingin diri, belum?",
      "Siapa yang paling bikin kamu ngerasa dihargai?",
      "Biasanya apa yang paling bantu kamu naikin rasa percaya diri?",
      "Kamu lagi kebawa bandingin diri sama siapa akhir-akhir ini?",
      "Kalau orang lain ngeliat kamu, kira-kira kelebihan kamu yang paling keliatan apa?",
    ],
  },
  {
    key: "toxic",
    label: "lingkungan yang toxic",
    pattern: /(toxic|manipulatif|dikekang|diremehin|direndahkan|dibully|dibuli|gaslight|gaslighting|abuse|toxic|toxicity|bully|bulli|toxic)/,
    responses: [
      "Kalau kamu ada di lingkungan yang nggak sehat, itu memang berat banget. Tapi ini bukan salah kamu. Kamu berhak ngerasa aman dan dihargai.",
      "Aku paham situasi kayak gini bikin capek. Tapi kamu punya hak buat keluar dari kondisi yang nggak sehat. Kamu nggak harus nerima perlakuan kayak gitu.",
      "Kamu nggak pantas diperlakuin kayak gini. Nggak ada yang berhak bikin kamu ngerasa kecil. Aku percaya kamu lebih kuat dari yang kamu kira.",
      "Gaslighting itu serius dan efeknya bisa panjang. Tapi kamu udah sadar dan mau cerita—itu langkah berani.",
      "Lingkungan yang nggak sehat itu bisa ngerusak pelan-pelan. Tapi kamu masih bisa nyari jalan keluar, setahap demi setahap.",
      "Orang yang manipulatif itu berbahaya. Kamu udah sadar aja itu udah langkah awal yang penting.",
      "Ini serius ya. Lingkungan yang nggak sehat bisa nguras pikiran. Tapi kamu masih bisa bangkit, dan kamu nggak sendirian.",
      "Keluar dari lingkungan yang nggak sehat itu susah, aku ngerti. Tapi kondisi kamu tetap lebih penting.",
      "Kamu udah bisa ngenalin pola manipulasi itu, bagus. Dari sini kamu bisa mulai pelan-pelan pulih.",
      "Dari ceritamu, ini udah ngarah bahaya. Kamu berani cerita aja udah luar biasa.",
      "Nggak ada yang berhak memperlakukan kamu dengan buruk. Kamu berhak aman.",
    ],
    followUps: [
      "Ini udah berlangsung berapa lama?",
      "Kamu punya orang di luar situasi ini yang bisa kamu andelin nggak?",
      "Ada cara buat ngurangin interaksi atau pasang batasan nggak?",
      "Siapa aja yang terlibat di situasi ini?",
      "Ada bukti atau kejadian spesifik yang paling keinget nggak?",
      "Kamu pernah coba ngomong soal perilaku mereka ke mereka belum?",
      "Ada opsi buat menjauh atau keluar dari lingkungan ini nggak?",
      "Siapa yang kira-kira bisa bantu kamu kalau kamu butuh dukungan?",
      "Ini ngaruh ke kerjaan, sekolah, atau kehidupan pribadi kamu nggak?",
      "Kamu udah kepikiran rencana buat keluar pelan-pelan belum?",
    ],
  },
  {
    key: "social-pressure",
    label: "tekanan sosial",
    pattern: /(omongan orang|ekspektasi|dibandingkan|dituntut|tekanan|harus sukses|malu sama orang|pressured|expectations|judgment|omongan|testing|ramai|事件|acc|kalah|menang|omongan)/,
    responses: [
      "Jadi bahan omongan orang itu nggak enak, aku paham. Tapi omongan mereka nggak nentuin nilai kamu.",
      "Tekanan sosial kadang berat banget. Tapi hidup kamu bukan buat nyenengin semua orang. Kamu berhak jalanin hidup versi kamu.",
      "Kalau kamu sering dibanding-bandingin, itu nyakitin ya. Tapi tiap orang punya waktunya masing-masing. Kamu nggak ketinggalan kok.",
      "Kadang rasanya kayak semua orang ngeliatin. Tapi seringnya, orang juga sibuk sama urusan mereka sendiri. Jadi kamu nggak harus terus-terusan kepikiran.",
      "Orang suka ikut campur hidup orang lain, iya. Tapi itu bukan tanggung jawab kamu buat ngikutin mereka.",
      "Tekanan buat jadi kayak orang lain itu nyata. Tapi kamu itu unik, dan kamu berharga dengan cara kamu sendiri.",
      "Omongan orang itu bisa jadi bising banget. Tapi yang paling penting, kamu ngeliat diri kamu sendiri gimana.",
      "Jadi korban ekspektasi orang lain itu berat. Tapi kamu hidup buat kamu, bukan buat mereka.",
      "Dibanding-bandingin itu nggak adil. Kita semua punya perjalanan masing-masing.",
      "Aku ngerti, kadang rasanya semua orang merhatiin. Tapi coba pikir, mereka beneran peduli sejauh itu nggak?",
      "Pendapat orang lain nggak harus kamu gendong. Kamu berhak milih yang bikin kamu tenang dan bahagia.",
    ],
    followUps: [
      "Ekspektasi dari siapa yang paling ngena ke kamu?",
      "Kalau kamu bebas dari semua tekanan itu, kamu pengen ngapain?",
      "Kamu udah pernah coba lebih fokus ke diri kamu sendiri belum?",
      "Ini tekanannya lebih banyak dari keluarga, teman, atau lingkungan sekitar?",
      "Mereka sebenernya nuntut kamu jadi apa?",
      "Menurut kamu, ekspektasinya masuk akal nggak, atau terlalu berat?",
      "Siapa yang paling bikin kamu kepikiran soal ini?",
      "Kamu udah pernah bilang kalau kamu nggak nyaman belum?",
      "Kalau dari hati kamu, kamu sebenernya maunya gimana?",
      "Ada orang yang bisa bantu ngingetin kamu kalau kamu udah cukup nggak?",
    ],
  },
  {
    key: "failure",
    label: "rasa gagal",
    pattern: /(gagal|gak bisa|tidak bisa|gak mampu|tidak mampu|drop|jatuh|berantakan|failed|disappointment|salah|kalah|wrong|error|mistake|gagal|kalah)/,
    responses: [
      "Aku paham kamu lagi ngerasa gagal. Tapi kegagalan itu bukan akhir. Kadang itu cuma cara hidup ngasih pelajaran, pelan-pelan.",
      "Semua orang pernah gagal kok. Yang penting, kamu masih coba dan kamu masih jalan. Itu yang berarti.",
      "Kalau hasilnya nggak sesuai harapan, wajar banget kamu sedih atau terpuruk. Tapi ini juga bagian dari proses, nggak ada yang langsung mulus.",
      "Aku ngerti ini berat. Tapi coba tanya ke diri kamu: ini beneran gagal, atau kamu lagi di fase yang memang belum berhasil dulu? Kamu masih berusaha aja udah hebat.",
      "Ngerasa gagal itu nyakitin, iya. Tapi itu bukan tamat. Ini bisa jadi momen buat belajar dan bangun lagi.",
      "Gagal itu bukan akhir dari segalanya. Orang yang sekarang keliatan sukses pun pasti pernah jatuh dulu.",
      "Dari ceritamu, ini bener-bener ngena ya. Tapi mungkin ini bukan kamu 'gagal', mungkin kamu lagi ada di situasi yang lagi susah.",
      "Aku paham rasanya. Tapi kamu masih di sini dan masih mau coba—itu hal yang penting banget.",
      "Kalau hasilnya nggak sesuai ekspektasi, itu nyesek. Tapi coba liat juga, kamu udah jalan sejauh apa sampai sekarang.",
      "Gagal itu wajar. Nggak ada yang bisa menang terus. Yang penting kamu tetap bergerak, walau pelan.",
      "Kadang yang kita anggap gagal, sebenernya cuma arah yang lagi dibenerin. Kita coba lihat pelan-pelan ya.",
    ],
    followUps: [
      "Kalau kamu lihat lagi, pelajaran apa yang mungkin bisa kamu ambil dari kejadian ini?",
      "Menurut kamu ini sebesar itu, atau kondisi saat ini emang lagi nggak mendukung?",
      "Langkah kecil apa yang paling mungkin kamu ambil sekarang?",
      "Ini pertama kalinya kamu ngalamin hal kayak gini, atau sebelumnya juga pernah?",
      "Yang paling berat dari situasi ini buat kamu apa?",
      "Kamu pernah coba lihat dari sudut pandang lain belum?",
      "Biasanya siapa yang paling bisa kamu andelin pas lagi ngerasa kayak gini?",
      "Ada hal kecil yang tetap bisa kamu syukurin dari pengalaman ini nggak?",
      "Kalau kamu lihat perjalanan kamu, kamu udah berhasil di bagian apa aja?",
      "Kalau nanti ketemu situasi mirip, kamu pengen ngapain beda dari sekarang?",
    ],
  },
];

const CONVERSATION_STARTERS = [
  "Terima kasih sudah mau cerita. Mau cerita lebih lanjut?",
  "Aku di sini terus kok. Ceritakan lagi dong yang kamu rasain.",
  "Hmm, terus ceritain dong. Aku mau denger yang lebih detail.",
  "Dari yang kamu ceritain, bagian mana yang paling berat?",
  "Boleh lanjut cerita ya. Aku siap dengerin.",
  "Sekarang ceritain lagi, apa yang paling sering kepikiran?",
  "Aku dengerin. Cerita lebih detail boleh, nggak papa.",
  "Wah, lanjut dong ceritanya. Aku tertarik denger yang lebih banyak!",
  "Terus cerita ya, aku lagi fokus nih sama kamu.",
  "Hmm, ada yang mau di ceritain lagi? Aku siap dengerin kapan aja.",
  "Mau cerita lagi apa nih? Aku di sini selalu siap dengerin!",
  "Lanjutkan ceritamu, aku lagi ngikutin dengan baik nih.",
  "Ada yang masih kepikiran? Ceritain aja, nggak perlu sungkan!",
  "Cerita yang lebih detail boleh banget! Aku pengen tau lebih banyak.",
  "Aku di sini terus kok. Mau cerita apa lagi?",
  "Hmm, terusin dong ceritanya. Aku penasaran nih.",
  "Ada kelanjutan dari cerita sebelumnya? Aku mau denger lagi!",
  "Ceritakan semuanya ya, aku siap jadi pendengar yang baik!",
  "Lagi ada yang mau diceritakan? Jangan ditahan, cerita aja!",
  "Apa yang lagi di pikiranmu sekarang? Aku siap dengerin!",
];

const AFFIRMATIONS = [
  "Makasih ya kamu udah mau cerita. Itu butuh keberanian.",
  "Aku bangga kamu mau berbagi cerita ini.",
  "Kamu kuat banget, kamu masih mau berjuang sampai sekarang.",
  "Nggak gampang cerita kayak gini, tapi kamu udah berani ngomongin.",
  "Perasaan kamu valid. Kamu nggak perlu ngerasa harus 'baik-baik aja'.",
  "Aku menghargai banget kamu mau terbuka kayak gini.",
  "Makasih ya udah percaya dan cerita ke aku. Itu nggak mudah.",
  "Kamu udah berani cerita—itu langkah awal yang besar.",
  "Aku salut sama keberanian kamu buat cerita.",
  "Setiap orang butuh tempat buat curhat, dan aku seneng kamu milih cerita ke aku.",
  "Kamu nggak perlu malu buat cerita. Aku di sini dengerin kamu.",
  "Kamu keren banget udah bisa terbuka kayak gini. Aku bangga sama kamu.",
  "Makasih ya udah nganggep aku layak jadi tempat cerita kamu.",
  "Ceritamu penting dan layak didenger. Makasih udah mau berbagi.",
  "Aku bangga kamu mau buka diri kayak gini.",
  "Ini mungkin berat, tapi kamu udah jalan sampai sini. Kamu kuat.",
  "Ngomongin ini pasti nggak gampang. Tapi kamu udah mulai, itu yang penting.",
  "Makasih udah mau cerita. Kamu udah ngelakuin hal yang bener.",
  "Aku hargai keterbukaan kamu. Itu berarti banget.",
  "Makasih ya, cerita kamu penting buat aku dengerin.",
];

const ENCOURAGEMENTS = [
  "Aku percaya kamu bisa ngelewatin ini, pelan-pelan ya.",
  "Inget ya, kamu nggak sendirian. Aku di sini.",
  "Pelan-pelan aja, satu langkah dulu ya.",
  "Waktu biasanya bantu, jadi kamu jangan nyerah dulu ya.",
  "Kamu lebih kuat dari yang kamu kira.",
  "Ini bakal lewat juga. Kamu tahan dulu ya.",
  "Aku percaya sama kamu. Kamu pasti bisa.",
  "Santai dulu ya, jalanin hari ini dulu aja.",
  "Kamu udah sejauh ini, berarti kamu bisa lanjut pelan-pelan.",
  "Setiap badai pasti lewat. Kamu nggak sendiri.",
  "Mulai dari yang kecil dulu ya. Sedikit-sedikit juga maju.",
  "Aku temenin terus sampai kamu ngerasa lebih mending.",
  "Ini berat, tapi kamu nggak sendirian. Aku tetap di sini.",
  "Terus jalan ya, kamu udah makin deket dari yang kamu kira.",
  "Kamu nggak harus sempurna. Yang penting kamu tetap jalan.",
  "Langkah kecil itu tetap berarti. Kamu hebat.",
  "Percaya deh, kamu lebih kuat dari yang selama ini kamu kira.",
  "Nanti pelan-pelan kamu bakal lebih kebiasa. Kamu kuat ya.",
  "Ini fase yang sulit, tapi bakal lewat. Aku percaya kamu bisa.",
  "Kamu udah berani cerita, itu langkah besar. Kamu lanjut pelan-pelan ya.",
];
const sessionContext = new Map();

function getOrCreateContext(userId) {
  if (!sessionContext.has(userId)) {
    sessionContext.set(userId, {
      topics: [],
      lastEmotion: null,
      details: {},
      questionTurn: false,
      turnCount: 0,
    });
  }
  return sessionContext.get(userId);
}

function detectEmotion(text) {
  const lowerText = text.toLowerCase();
  
  for (const rule of EMOTION_RULES) {
    if (!rule.pattern.test(lowerText)) continue;

    if (rule.key === "insecure" && !SELF_REFERENCES.test(text)) continue;
    if (rule.key === "failure" && /\bsalah\b/i.test(text) && !SELF_REFERENCES.test(text)) continue;
    if (rule.key === "social-pressure" && text.trim().split(/\s+/).length < 4) continue;
    if (rule.key === "friendship" && /\bteman\b/i.test(text) && text.trim().split(/\s+/).length < 3) continue;
    if (rule.key === "relationship" && /\bdoi\b/i.test(text) && text.trim().split(/\s+/).length < 3) continue;
    if (rule.key === "school" && /\bnilai\b/i.test(text) && !SELF_REFERENCES.test(text) && text.trim().split(/\s+/).length < 4) continue;
    if (rule.key === "work" && /\bkerja\b/i.test(text) && text.trim().split(/\s+/).length < 3) continue;
    if (rule.key === "finance" && /\buang\b/i.test(text) && text.trim().split(/\s+/).length < 3) continue;
    if (rule.key === "sad" && /\bdown\b/i.test(text) && !SELF_REFERENCES.test(text)) continue;
    if (rule.key === "angry" && BOT_NAME_PATTERN.test(text) && /\b(jelek|bodoh|nyebelin|lebay)\b/i.test(text)) continue;

    return rule;
  }
  return null;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isShortMessage(text) {
  return text.trim().split(/\s+/).length <= 4;
}

function isQuestion(text) {
  return text.includes("?") || QUESTION_HINTS.test(text);
}

function isKnowledgePrompt(text) {
  return /\b(hitung|apa itu|jelaskan|jelasin|beda|perbedaan|vs|versus|gimana cara|bagaimana cara|how to|jam berapa|tanggal berapa|hari apa)\b/i.test(
    text
  );
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
  const topic = String(topicRaw || "").toLowerCase().trim();
  if (!topic) return null;

  const keys = Object.keys(QUICK_EXPLAIN);
  const matched = keys.find((key) => topic.includes(key));
  if (!matched) return null;
  return QUICK_EXPLAIN[matched];
}

function buildHowToReply(text) {
  const match =
    text.match(/(?:gimana|bagaimana)\s+cara\s+(.+?)\??$/i) ||
    text.match(/(?:cara|how to)\s+(.+?)\??$/i);
  const target = match?.[1]?.trim();
  if (!target) return null;

  return [
    `Kalau tujuanmu *${target}*, pakai pola ini:`,
    "1) Tentukan target spesifik (hasil akhirnya harus jelas).",
    "2) Pecah jadi langkah kecil harian/mingguan.",
    "3) Eksekusi konsisten dengan waktu tetap.",
    "4) Ukur progres (apa yang berhasil/gagal).",
    "5) Iterasi: perbaiki cara, bukan berhenti.",
    "",
    "Kalau kamu mau, kirim konteksmu (waktu, level, kendala), nanti aku bikinin langkah yang lebih detail dan personal.",
  ].join("\n");
}

function buildComparisonReply(text) {
  const match = text.match(/(?:beda|perbedaan|vs|versus)\s+(.+?)\s+(?:dan|vs|versus)\s+(.+)/i);
  if (!match) return null;

  const left = match[1].replace(/\?+$/, "").replace(/\bapa\b$/i, "").trim();
  const right = match[2].replace(/\?+$/, "").replace(/\bapa\b$/i, "").trim();
  if (!left || !right) return null;

  return [
    `Perbandingan singkat *${left}* vs *${right}*:`,
    `- Fokus: ${left} biasanya unggul di konteks tertentu, ${right} unggul di konteks lain.`,
    "- Biaya/effort: cek mana yang lebih ringan buat kondisimu sekarang.",
    "- Risiko: lihat konsekuensi terburuk kalau salah pilih.",
    "- Jangka panjang: pilih yang paling mendekatkan ke tujuanmu, bukan yang paling cepat kelihatan enak.",
    "",
    `Kalau kamu kasih tujuan spesifikmu, aku bisa kasih rekomendasi final pilih ${left} atau ${right}.`,
  ].join("\n");
}

function buildSmartQuestionReply(text, context) {
  const lower = text.toLowerCase().trim();
  const now = formatNowInJakarta();

  if (/\b(jam berapa|sekarang jam|waktu sekarang)\b/i.test(lower)) {
    return `Sekarang di WIB: *${now.time}*`;
  }

  if (/\b(hari apa|tanggal berapa|tanggal hari ini|hari ini tanggal)\b/i.test(lower)) {
    return `Hari ini: *${now.date}*`;
  }

  const mathAnswer = trySolveMath(text);
  if (mathAnswer) {
    return mathAnswer;
  }

  const comparison = buildComparisonReply(text);
  if (comparison) {
    return comparison;
  }

  const howTo = buildHowToReply(text);
  if (howTo) {
    return howTo;
  }

  const defineMatch = text.match(/^(?:apa itu|jelaskan|jelasin)\s+(.+?)\??$/i);
  if (defineMatch) {
    const topic = defineMatch[1].trim();
    const quick = lookupTopicDefinition(topic);
    if (quick) {
      return quick;
    }

    return [
      `Tentang *${topic}*, aku jelasin secara umum:`,
      "- Definisi: apa inti konsepnya.",
      "- Fungsi: dipakai untuk menyelesaikan masalah apa.",
      "- Contoh: kasus nyata supaya gampang kebayang.",
      "",
      `Kalau kamu mau, aku bisa jelasin ${topic} dari level pemula sampai praktik.`,
    ].join("\n");
  }

  if (FACTUAL_QUESTION_HINTS.test(lower) && isQuestion(text) && !context.lastEmotion) {
    return [
      "Aku bisa bantu jelaskan konsep dan ngerapiin jawaban, tapi untuk fakta yang sangat spesifik/realtime aku perlu konteks lebih detail.",
      "Kirim pertanyaanmu dengan format: topik + tujuan + level detail, nanti aku jawab lebih tajam.",
    ].join("\n\n");
  }

  return null;
}

function getEmotionOpening(emotion, text, context) {
  switch (emotion?.key) {
    case "insecure":
      return SELF_REFERENCES.test(text)
        ? "Kalau kamu lagi ngerasa kurang atau jelek, perasaan itu bisa kerasa sangat nyata. Tapi itu belum tentu gambaran yang adil tentang diri kamu."
        : "Aku nangkep ada rasa nggak nyaman soal diri sendiri di situ.";
    case "exhausted":
      return "Kedengarannya energi kamu lagi habis dan semuanya terasa numpuk.";
    case "sad":
      return "Yang kamu rasain kedengarannya memang menyakitkan, jadi wajar kalau kamu lagi berat.";
    case "angry":
      return "Aku nangkep kamu lagi kesel, dan biasanya ada sesuatu yang terasa nggak adil di balik itu.";
    case "confused":
      return "Kamu kelihatan lagi bingung dan belum nemu arah yang paling pas.";
    case "anxious":
      return "Kedengarannya pikiran kamu lagi lari ke banyak kemungkinan dan itu bikin cemas.";
    case "lonely":
      return "Rasa sepi yang kamu bawa kedengarannya cukup berat.";
    case "relationship":
      return "Kalau ini soal hubungan, wajar kalau rasanya campur aduk dan bikin capek.";
    case "family":
      return "Kalau ini menyangkut keluarga, memang sering lebih sensitif dan lebih nguras emosi.";
    case "friendship":
      return "Masalah pertemanan memang bisa nyelekit, apalagi kalau datang dari orang yang dekat.";
    case "school":
      return "Tekanan sekolah atau kuliah memang gampang bikin kepala penuh.";
    case "work":
      return "Kalau ini soal kerjaan, tekanannya memang bisa bikin cepat habis tenaga.";
    case "finance":
      return "Masalah uang memang cepat bikin pikiran berat karena menyentuh banyak hal sekaligus.";
    case "toxic":
      return "Dari nada ceritamu, situasinya terdengar tidak sehat dan itu memang melelahkan.";
    case "social-pressure":
      return "Tekanan dari omongan atau ekspektasi orang lain memang bisa bikin sesak.";
    case "failure":
      return "Kalau kamu lagi ngerasa gagal, itu pasti kena banget ke diri kamu.";
    default:
      return context.lastEmotion
        ? "Aku masih ngikutin ceritamu."
        : "Aku nangkep ada sesuatu yang lagi ganggu pikiran kamu.";
  }
}

function buildQuestionReply(text, emotion, context) {
  if (emotion) {
    return [getEmotionOpening(emotion, text, context), pickRandom(emotion.followUps)].join("\n\n");
  }

  return [
    "Aku bisa bantu dengerin dan ngerapiin ceritamu, tapi aku perlu konteks yang lebih jelas dulu.",
    "Coba ceritain singkat: kejadian apa yang bikin kamu ngerasa begini?",
  ].join("\n\n");
}

function buildBotMentionReply(text) {
  if (!BOT_NAME_PATTERN.test(text)) {
    return null;
  }

  if (/\b(jelek|bodoh|goblok|nyebelin|lebay)\b/i.test(text)) {
    return "Kalau kamu lagi becanda, aku terima. Tapi kalau sebenarnya kamu lagi ngomongin diri sendiri atau ada hal yang bikin kesal, bilang aja langsung biar aku bisa nangkep maksudmu dengan tepat.";
  }

  if (isQuestion(text)) {
    return `Aku denger, tapi pertanyaanmu masih agak umum. Coba tulis lebih spesifik ke ${BOT_PERSONA_NAME}: kamu lagi pengen didengerin, minta pendapat, atau cari solusi?`;
  }

  return `Aku di sini. Kalau mau curhat, coba tulis lebih jelas apa yang lagi kamu rasain atau kejadian apa yang barusan terjadi.`;
}

function buildNaturalReply(text, emotion, turnCount, context) {
  const parts = [];
  context.turnCount++;

  const botMentionReply = buildBotMentionReply(text);
  if (botMentionReply) {
    context.questionTurn = false;
    return botMentionReply;
  }

  const smartAnswer = buildSmartQuestionReply(text, context);
  if (!emotion && smartAnswer && isKnowledgePrompt(text)) {
    context.questionTurn = false;
    return [
      "Pertanyaan umum lebih cocok di mode tanya.",
      "Ketik `.tanya <pertanyaan>` biar aku jawab lebih fokus.",
      "",
      "Kalau kamu tetap mau curhat, lanjut ceritain perasaan/kondisimu ya.",
    ].join("\n");
  }

  if (isQuestion(text) && isShortMessage(text) && !emotion) {
    context.questionTurn = true;
    return buildQuestionReply(text, emotion, context);
  }

  if (emotion) {
    const emotionSmartAnswer = isQuestion(text) || isKnowledgePrompt(text)
      ? buildSmartQuestionReply(text, context)
      : null;
    parts.push(getEmotionOpening(emotion, text, context));

    if (emotionSmartAnswer) {
      parts.push(emotionSmartAnswer);
      parts.push(pickRandom(emotion.followUps));
    } else if (isShortMessage(text) || turnCount <= 2 || context.lastEmotion?.key !== emotion.key) {
      parts.push(pickRandom(emotion.followUps));
    } else {
      parts.push(pickRandom(emotion.responses));
    }

    context.lastEmotion = emotion;
    context.questionTurn = true;
    return parts.join("\n\n");
  }

  if (turnCount <= 2) {
    parts.push("Aku dengerin, tapi aku belum cukup paham inti masalahnya.");
    parts.push("Coba ceritain lebih spesifik: apa yang terjadi, sama bagian mana yang paling bikin kamu kepikiran?");
    context.questionTurn = true;
    return parts.join("\n\n");
  }

  if (context.questionTurn) {
    parts.push("Aku masih ngikutin ceritamu.");
    parts.push("Biar aku bisa jawab lebih pas, lanjutkan di bagian yang paling bikin kamu berat ya.");
  } else {
    parts.push(pickRandom(AFFIRMATIONS));
    parts.push("Coba lanjutkan dengan lebih spesifik biar aku bisa nangkep maksudmu dengan lebih tepat.");
  }

  context.questionTurn = true;
  return parts.join("\n\n");
}

function buildGenericReply(turnCount) {
  const replies = [
    "Makasih ya kamu udah mau cerita. Kamu mau lanjut cerita apa yang lagi kepikiran?",
    "Aku di sini kok. Ceritain aja lagi yang kamu rasain.",
    "Hmm, lanjut cerita ya. Aku dengerin.",
    "Semua perasaan kamu aman di sini. Kamu mau cerita lebih banyak?",
    "Aku dengerin kok. Ceritain yang kamu nyamanin aja.",
    "Lanjut cerita ya, aku temenin kamu di sini.",
    "Ceritanya lanjut dong. Aku lagi fokus dengerin kamu.",
    "Kalau masih ada yang mau diceritain, aku ada kok di sini.",
    "Hmm, terusin ya. Aku pengen ngerti lebih banyak.",
    "Kamu mau cerita lagi? Aku siap dengerin kapan aja.",
    "Lanjut ya, aku ngikutin ceritamu.",
    "Kalau masih kepikiran sesuatu, keluarin aja ya. Nggak perlu sungkan.",
    "Kalau mau cerita lebih detail juga boleh banget. Aku dengerin.",
    "Aku di sini terus kok. Kamu mau cerita apa lagi?",
    "Hmm, lanjutin dong. Aku penasaran yang kamu rasain sebenarnya gimana.",
    "Ada kelanjutan dari cerita tadi? Aku dengerin lagi ya.",
    "Ceritain semuanya pelan-pelan ya. Aku siap jadi pendengar kamu.",
    "Kalau ada yang mau kamu keluarin, jangan ditahan ya. Cerita aja.",
    "Sekarang yang lagi rame di kepala kamu apa?",
    "Makasih ya udah cerita. Ceritamu penting, aku dengerin baik-baik.",
  ];
  return pickRandom(replies);
}

module.exports = {
  name: "curhat",
  description: "Masuk ke mode curhat dan bot akan membalas seperti teman.",
  usage: "curhat",
  async execute({ message, state, helpers }) {
    if (!helpers.isPrivateUserChat(message)) {
      await message.reply("Command curhat hanya bisa dipakai di chat private bot.");
      return;
    }

    if (state.activeMenfess.has(message.from)) {
      await message.reply("Kamu masih ada di sesi menfess. Akhiri dulu dengan `.endconfess`.");
      return;
    }

    const userId = message.from;
    
    state.activeCurhat.set(userId, {
      startedAt: Date.now(),
      turns: 0,
    });
    
    sessionContext.set(userId, {
      topics: [],
      lastEmotion: null,
      details: {},
      questionTurn: false,
      turnCount: 0,
    });

    const openings = [
      `Halo! Aku ${BOT_PERSONA_NAME}. Senang bisa ngobrol denganmu. Ceritakan aja apa yang lagi di pikiran, tanpa perlu sungkan. Aku di sini buat dengerin!`,
      `Hai! ${BOT_PERSONA_NAME} di sini. Mau Curhat apa nih? Aku siap jadi pendengar yang baik. Cerita apa aja boleh kok!`,
      `Hai! ${BOT_PERSONA_NAME} di sini. Nggak perlu formal, kita ngobrol biasa aja. Ada yang mau diceritain?`,
      `Halo, ini ${BOT_PERSONA_NAME}. Lagi mau curhat ya? Aku di sini buat dengerin. Cerita apa yang lagi kamu rasain?`,
      `Halo! ${BOT_PERSONA_NAME} di sini. Lagi ada yang mau diceritain? Nggak perlu bingung, cerita aja apa yang lagi ada di pikiranmu.`,
      `Hai hai! ${BOT_PERSONA_NAME} datang lagi nih. Mau curhat apa hari ini? Aku siap jadi tempat kamu bercerita.`,
      `Senang ketemu lagi. ${BOT_PERSONA_NAME} di sini. Ada yang mau diceritakan? Cerita aja, aku siap dengerin.`,
      `Halo. ${BOT_PERSONA_NAME} senang bisa ketemu kamu lagi. Mau cerita apa nih? Nggak perlu panjang-panjang, yang penting nyaman.`,
      `Halo! ${BOT_PERSONA_NAME} siap mendengar. Cerita apa yang lagi nyangkut di kepalamu? Aku di sini buat dengerin!`,
      `Hai! ${BOT_PERSONA_NAME} di sini. Lagi ada yang pengin di ceritain? Yuk, cerita apa aja yang lagi kamu rasain!`,
      `Halo, ${BOT_PERSONA_NAME} di sini. Nggak perlu basa-basi, langsung aja. Ada yang mau dicurhatin? Aku siap mendengarkan.`,
      `Halo! ${BOT_PERSONA_NAME} siap jadi pendengar kamu hari ini. Mau mulai dari mana ceritanya?`,
      `Halo halo! ${BOT_PERSONA_NAME} di sini. Ada yang mau diceritakan hari ini? Nggak perlu ragu, cerita aja.`,
      `Halo kamu, ${BOT_PERSONA_NAME} di sini. Lagi butuh tempat curhat? Aku siap sedia kapan aja.`,
      `Haii! ${BOT_PERSONA_NAME} nih. Mau curhat atau cuma mau ngobrol? Aku di sini buat kamu!`,
    ];

    await message.reply(pickRandom(openings));
  },
  async handleSessionMessage({ message, state, helpers }) {
    if (!helpers.isPrivateUserChat(message)) return false;
    if (!state.activeCurhat.has(message.from)) return false;

    if (message.hasMedia) {
      await message.reply(" Kalau mau Curhat, cerita lewat teks dulu ya. Aku masih belajar buat ngerti yang lain~");
      return true;
    }

    const session = state.activeCurhat.get(message.from);
    const userId = message.from;
    const text = (message.body || "").trim();
    const context = getOrCreateContext(userId);

    if (!text) {
      await message.reply("Ceritain dong apa yang ada di pikiranmu!");
      return true;
    }

    session.turns += 1;
    state.activeCurhat.set(message.from, session);

    const emotion = detectEmotion(text);
    
    const reply = buildNaturalReply(text, emotion, session.turns, context);

    await message.reply(reply);
    return true;
  },
};
