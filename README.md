# waresource-bot-md

WhatsApp MD bot dengan command menu, stiker, menfess, downloader, emoji sticker, dan utilitas lain.

## Deploy ke Railway

Repo ini sudah berisi `Dockerfile` dan `railway.json`, jadi Railway akan build container dengan Chromium, FFmpeg, dan `yt-dlp`, lalu menjalankan `npm start`.

1. Buat project Railway dari repository GitHub ini.
2. Tambahkan environment variable:
   - `LOGIN_METHOD=pairing`
   - `PAIRING_PHONE=628xxxxxxxxxx`
3. Tambahkan Railway Volume agar sesi WhatsApp tetap tersimpan setelah redeploy. App otomatis memakai `RAILWAY_VOLUME_MOUNT_PATH` jika volume dipasang.
4. Deploy, buka logs, lalu masukkan kode pairing yang muncul ke WhatsApp > Perangkat tertaut > Tautkan dengan nomor telepon.

Healthcheck tersedia di `/health` dan akan aktif otomatis saat Railway memberi variable `PORT`.

## Lokal

```bash
npm install
npm start
```

## Downloader dan emoji sticker

Command: `.download <URL>`, `.video <URL>`, `.audio <URL>`, `.tiktok <URL>`, `.ig <URL>`, `.yt <URL>`. Link publik Instagram, TikTok, YouTube, Facebook, X, Pinterest, dan Reddit juga diproses otomatis.

Downloader memakai `yt-dlp` sebagai provider lokal. Konten privat, DRM, login, paywall, playlist, dan link yang tidak dapat diakses tidak dipaksa. Batas default: 64 MB, 15 menit, 2 download bersamaan, timeout 120 detik. Override lewat `YTDLP_PATH`, `DOWNLOADER_TIMEOUT_MS`, `DOWNLOADER_MAX_BYTES`, `DOWNLOADER_MAX_DURATION`, dan `DOWNLOADER_MAX_CONCURRENT`.

Emoji sticker: `.emoji 😁 + 🙏` atau `.emoji 😂 + ❤️ + 🔥`. Renderer memakai `@resvg/resvg-js`; font emoji berwarna bergantung font yang tersedia di host. Docker memakai font system, tetapi emoji tertentu bisa gagal dirender.
## Login dan session

Local memakai `.baileys_auth-local`, sedangkan Railway memakai `/data/.baileys_auth-server` (pasang Railway Volume ke `/data`). Session jangan disalin silang.

- QR: `LOGIN_METHOD=qr`, jalankan `npm start`, lalu buka link `Buka link ini untuk scan QR WhatsApp` di log. Link bersifat sementara dan memiliki token acak setiap bot mulai.
- Pairing: `LOGIN_METHOD=pairing` dan isi `PAIRING_PHONE=628xxxxxxxxxx`; masukkan kode yang muncul ke WhatsApp > Perangkat tertaut > Tautkan dengan nomor telepon.
- Setelah berhasil, session tersimpan otomatis dan bot akan reconnect tanpa scan ulang.
