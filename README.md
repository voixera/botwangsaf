# waresource-bot-md

WhatsApp MD bot dengan command menu, stiker, menfess, curhat, tanya, dan utilitas lain.

## Deploy ke Railway

Repo ini sudah berisi `Dockerfile` dan `railway.json`, jadi Railway akan build container dengan Chromium lalu menjalankan `npm start`.

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
## Login dan session

Local memakai `.baileys_auth-local`, sedangkan Railway memakai `/data/.baileys_auth-server` (pasang Railway Volume ke `/data`). Session jangan disalin silang.

- QR: `LOGIN_METHOD=qr`, jalankan `npm start`, lalu scan QR di terminal/log.
- Pairing: `LOGIN_METHOD=pairing` dan isi `PAIRING_PHONE=628xxxxxxxxxx`; masukkan kode yang muncul ke WhatsApp > Perangkat tertaut > Tautkan dengan nomor telepon.
- Setelah berhasil, session tersimpan otomatis dan bot akan reconnect tanpa scan ulang.
