# GitHub Pages — langkah handoff (gratis)

Panduan ini mempublikasikan web app ZhKas ke GitHub Pages. Akun GitHub,
verifikasi email, dan OTP dibuat/dimasukkan oleh **Anda sendiri**. Asisten tidak
membuat akun atau memasukkan OTP atas nama Anda.

## 1. Siapkan folder ekspor bersih

Dari folder `zhkas/`, jalankan:

```bash
node scripts/prepare-web-export.mjs web-export
```

Perintah ini menyalin hanya source web, aset `public/`, workflow, dan dokumen
pendukung ke folder `web-export/`. Folder `android/` — termasuk
`android/key.properties` dan `android/zhkas-upload.keystore` — **tidak pernah
disalin**. Jangan pernah push folder `zhkas/` langsung ke repo publik karena
kunci penandatanganan Android akan ikut terekspos.

## 2. Buat repo publik

Buat repository publik baru dengan nama **`<username>.github.io`** (ganti
`<username>` dengan akun GitHub Anda; contoh: `zhtech703.github.io`). Nama
`<username>.github.io` wajib karena Vite memakai URL aset absolut dari root
(`/assets/...`, `/manifest.webmanifest`, `/sw.js`). Repo bertema subpath seperti
`username.github.io/zhkas` tidak akan menemukan aset tersebut.

## 3. Push dari folder ekspor

Masuk ke folder `web-export/` lalu jalankan:

```bash
git init -b main
git add .
git commit -m "feat: zhkas web PWA"
git remote add origin https://github.com/<username>/<username>.github.io.git
git push -u origin main
```

## 4. Aktifkan Pages

Di repo GitHub, buka **Settings → Pages**. Pada bagian *Build and deployment*,
set **Source** menjadi **GitHub Actions**. Workflow
`.github/workflows/deploy.yml` akan menjalankan `npm ci`, `npm run build`, lalu
deploy folder `dist/` otomatis setiap push ke `main`.

Tunggu sampai deployment selesai (tab *Actions* berstatus hijau), lalu buka alamat
HTTPS yang terbentuk, misalnya `https://<username>.github.io`.

## 5. Isi alamat final di dokumen

Ganti semua placeholder `URL_PUBLIC` di `docs/IOS.md` dan
`docs/monetization/promo-kit/LYNK_ID.md` (di folder sumber `zhkas/`) dengan alamat
HTTPS tersebut. Setelah itu, ikuti checklist di `docs/IOS.md` pada iPhone/iPad
Anda, lalu pasang tombol web di Lynk.id.

## 6. Catatan keamanan

Folder ekspor dibuat khusus untuk menjaga `android/key.properties` dan file
`*.keystore` tetap di luar repo publik. Skrip ekspor membersihkan folder tujuan
setiap kali dijalankan, tetapi sebelum `git add .` tetap periksa bahwa tidak ada
`key.properties` atau file `*.keystore` di folder ekspor. Tidak ada akun,
verifikasi email, atau OTP yang dibuat oleh asisten. Rilis Android tidak
di-build ulang atau dirilis ulang; perilaku APK/AAB yang sudah beredar tetap sama.
