# Menjalankan bot di Pterodactyl

## 1) Egg / Startup
- Pakai egg **NodeJS** (Node **18+**).
- Startup command: `npm start`

## 2) Environment Variables (disarankan)
### Login tanpa prompt (paling aman untuk panel)
- `LOGIN_METHOD=qr`
  - QR akan tampil di console Pterodactyl saat bot jalan.

atau

- `LOGIN_METHOD=pairing`
- `PAIRING_PHONE=628xxxxxxxxxx`
  - Bot akan print kode pairing di console.

### Lokasi session/auth (agar persisten)
- `WWEBJS_DATA_PATH=/home/container/.wwebjs_auth`
  - Default sudah `.wwebjs_auth` di folder project, tapi env ini memudahkan kalau mau dipindah.

### Chromium (kalau container tidak punya Chromium bawaan)
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser` (contoh)
  - Path-nya tergantung image/egg yang dipakai.

## 3) Catatan
- Folder `.wwebjs_auth` harus ikut tersimpan supaya tidak login ulang setelah restart.
- Kalau bot restart dan masih minta input di console, set `LOGIN_METHOD` sesuai opsi di atas.

## 4) Kalau file terlalu besar untuk di-upload lewat panel
Yang biasanya bikin "terlalu besar" adalah `node_modules` atau file zip hasil build.

### Opsi A (paling disarankan): jangan upload `node_modules`
- Upload hanya source code + `package.json` + `package-lock.json`.
- Pastikan di Startup/Install Script egg menjalankan install dependency (umumnya otomatis). Kalau tidak, jalankan di console:
  - `npm ci --omit=dev` (atau `npm install --omit=dev`)

### Opsi B: pakai SFTP (bypass limit upload web)
- Di panel, ambil kredensial SFTP (tab "Settings" / "SFTP Details").
- Upload pakai WinSCP / FileZilla.

### Opsi C: upload kecil, lalu download dari URL di dalam container
- Upload file kecil (mis. `deploy.zip`) atau jalankan download via console:
  - `curl -L -o deploy.zip "https://example.com/deploy.zip"`
  - `unzip -o deploy.zip`

### Opsi D (kalau kamu admin panel): naikkan batas upload
- Cek batas di reverse proxy/web server (mis. Nginx `client_max_body_size`) dan PHP (`upload_max_filesize`, `post_max_size`).

### Catatan khusus: `.wwebjs_auth` bisa membengkak (ratusan MB)
`.wwebjs_auth` adalah profile Chromium/WhatsApp Web. Ukuran besar biasanya karena cache (`Cache`, `Code Cache`, `GPUCache`, `Service Worker`).

- Cara termudah: **jangan upload `.wwebjs_auth`** dari lokal. Jalankan bot di server, login sekali (QR/pairing), lalu biarkan folder ini tersimpan di server untuk restart berikutnya.
- Kalau kamu perlu pindahin session agar tidak login ulang, kamu bisa **hapus cache saja** (stop bot dulu). Ini biasanya aman dan akan dibuat ulang:
  - Linux (di Pterodactyl console):
    - `rm -rf .wwebjs_auth/session/Default/Cache .wwebjs_auth/session/Default/Code\ Cache .wwebjs_auth/session/Default/GPUCache .wwebjs_auth/session/Default/Service\ Worker/ScriptCache .wwebjs_auth/session/Crashpad/reports`
  - Windows (PowerShell):
    - `Remove-Item -Recurse -Force ".wwebjs_auth\\session\\Default\\Cache",".wwebjs_auth\\session\\Default\\Code Cache",".wwebjs_auth\\session\\Default\\GPUCache",".wwebjs_auth\\session\\Default\\Service Worker\\ScriptCache",".wwebjs_auth\\session\\Crashpad\\reports"`
