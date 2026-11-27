# Lynk.id — satu tautan untuk semua link ZhKas

File ini berisi **konten siap paste** supaya halaman ZhKas bisa diklik langsung
dari bio Instagram/TikTok, caption video, atau WhatsApp.

Kenapa perlu ini: `DONATION_PAGE.html` hanya ada di komputer Anda. File lokal
tidak punya URL publik, jadi tidak bisa dibagikan sebagai tautan. Lynk.id
memberi satu URL HTTPS yang bisa diklik; isinya berupa tombol-tombol yang
mengarah ke layanan yang sudah Anda punya. **Lynk.id tidak meng-host file
HTML** — jadi seluruh isi halaman donasi dipindah jadi blok di bawah.

> URL final, sudah aktif dan **sudah terisi lengkap**: **`https://lynk.id/zhkas`**.
> Tidak ada username pengganti. Semua blok di bawah sudah dipasang dan terverifikasi
> di halaman publik (27 Nov 2026). Bagian 1–3 berikut adalah catatan apa yang sudah
> dilakukan; bagian 4–5 untuk copy dan pemakaian sehari-hari.

---

## 1. Status setting (sudah dilakukan di dashboard)

1. ✅ Akun `zhtech703@gmail.com`, halaman `@zhkas` (`https://lynk.id/zhkas`).
2. ✅ Teks pembuka dipasang sebagai blok **Teks** (isi persis di bagian 2).
3. ✅ Tombol APK, Saweria, Trakteer, dan email dipasang sebagai blok **Link**.
4. ✅ QRIS di-upload sebagai blok **Gambar** dari `promo-kit/qris.png`
   (gambar publik: `cdn.lynkid.my.id/...1795769265816_1047907.webp`, 749×872).
5. ✅ Artikel **Kebijakan Privasi ZhKas** dibuat sebagai blok **Blog**, di-set
   *free content*, lalu di-publish. Blok blog otomatis muncul di halaman:
   <https://lynk.id/zhkas/c/ll4dgp41og3n>
   (isi lengkap: <https://lynk.id/zhkas/c/ll4dgp41og3n/re0q5r0oeg25>).
6. ✅ Teks penutup dipasang sebagai blok **Teks** terakhir.
7. ✅ `docs/release/zhkas-v1.0.0-official.apk` (logo baru) sudah diunggah ulang
   ke Google Drive oleh pemilik akun, mengganti build lama.

> **Yang belum:** foto profil masih memakai avatar default Lynk.id. Kalau mau,
> upload `public/branding/zhkas-icon-3d.png` lewat **Appearance → Profile Picture**.

---

## 2. Isi halaman — urutan tombol

| # | Label tombol | Alamat / isi blok (terverifikasi di halaman publik) | Catatan singkat |
|---|---|---|---|
| 1 | `⬇ Coba ZhKas (APK early access)` | <https://drive.google.com/uc?export=download&id=1ktgMfr3Uz3gG84fi1zKAr18f6ad2WcBe> | Gratis, sebelum Play Store. Google akan bilang *can't scan this file for viruses* → pilih **Download anyway**. |
| 2 | `☕ Dukung sukarela via Saweria` | <https://saweria.co/Zhtech703> | Jalur utama. |
| 3 | `🎁 Alternatif: Trakteer` | <https://trakteer.id/zh_techcorp_703/tip> | Cadangan. |
| 4 | `QRIS — dukung sukarela` | **Blok gambar:** `qris.png` (sudah live) | Scan langsung; judul blok tidak tampil di halaman publik. |
| 5 | `📧 Order paket / minta demo` | <https://mail.google.com/mail/?view=cm&fs=1&to=zhtech703@gmail.com&su=Order%20ZhKas> | Membuka draft email ke `zhtech703@gmail.com`. Paket "Mulai Teratur" Rp39.000 (template CSV + panduan 90 hari), dikirim maks. 1×24 jam. Bukan fitur ZhKas yang dikunci. |
| 6 | `Kebijakan Privasi ZhKas` (blok Blog, berlabel *Free*) | <https://lynk.id/zhkas/c/ll4dgp41og3n> | Artikel gratis, tidak ada paywall. Jangan arahkan ke `PRIVACY_POLICY.html` lokal. |

> **Kenapa tombol email bukan `mailto:`:** Lynk.id menambahkan `//` di depan URL
> yang tidak diawali `http`, sehingga `mailto:` berubah jadi `//mailto:...` dan
> rusak di browser. Alamat email tetap tertera sebagai teks di blok penutup.

Teks pembuka yang terpasang (blok teks pertama):

```
ZhKas — kas pribadi gratis, tanpa iklan & tanpa PIN bank.
Data tetap di HP Anda. Donasi di bawah ini sukarela dan tidak membuka fitur apa pun 🙏
```

Teks kecil di bawah tombol terakhir:

```
Belum di Play Store — pakai APK di atas untuk sementara. Butuh bantuan?
Email zhtech703@gmail.com.
```

---

## 3. Teks artikel Kebijakan Privasi (paste di Lynk.id)

Judul: `Kebijakan Privasi ZhKas`

```
Versi 1.0.0 · Berlaku 26 November 2026
Pengembang: ZhStoreLsw Corp. · Kontak: zhtech703@gmail.com

ZhKas adalah aplikasi pencatatan keuangan pribadi yang memproses data
sepenuhnya di perangkat pengguna. Aplikasi ini tidak memiliki server sendiri
dan tidak mengumpulkan data pribadi untuk kebutuhan pengembang.

Data yang disimpan
- Transaksi, budget, hutang/piutang, kartu sumber dana, dan preferensi
  tampilan disimpan di penyimpanan lokal perangkat.
- Backup opsional berupa file .zhkas terenkripsi dibuat di perangkat.
- Bila Sinkronisasi Google Drive diaktifkan, backup dienkripsi lebih dulu di
  perangkat lalu diunggah ke appDataFolder akun Google milik pengguna sendiri.
  Token akses hanya hidup di memori tab dan tidak dikirim ke pengembang.
- Bila memilih "Bagikan ke Gmail / Drive", aplikasi membuka share sheet Android.
  File hanya terkirim bila pengguna sendiri memilih tujuan dan menekan kirim.

Data yang TIDAK diakses
ZhKas tidak meminta atau menyimpan kredensial/PIN/OTP bank atau e-wallet, akses
SMS, kontak, riwayat panggilan, accessibility, notifikasi bank, data lokasi,
maupun riwayat penelusuran/identitas iklan. Izin Android yang dipakai hanya
INTERNET, untuk memuat aset aplikasi dan — bila diaktifkan sendiri — OAuth/Drive.

Donasi
Donasi sukarela dilakukan di luar aplikasi (Saweria, Trakteer, atau QRIS).
Donasi tidak membuka fitur khusus; semua fitur inti ZhKas tetap gratis.

Pertanyaan: zhtech703@gmail.com
```

---

## 4. Copy siap pakai

### Bio Instagram

```
ZhKas | kas pribadi gratis
Tanpa iklan · tanpa PIN bank ☕
Semua link (APK + donasi) 👇
https://lynk.id/zhkas
```

### Bio TikTok

```
Bikin aplikasi kas gratis (ZhKas) 🧮
Nggak minta PIN/OTP/SMS
Coba + dukung 👇 https://lynk.id/zhkas
```

### WhatsApp / Facebook / X

```
ZhKas — kas pribadi gratis, tanpa iklan & tanpa PIN bank.
Coba APK + dukung sukarela: https://lynk.id/zhkas
```

### Caption video promo (9:16)

```
Catatan kas pribadi: gratis, tanpa iklan, dan nggak pernah minta PIN bank.
Data tetap di HP sendiri. Coba APK-nya & dukung sukarela lewat satu link 👇
https://lynk.id/zhkas

#ZhKas #kaspribadi #aplikasikas #gratis #tanpaiklan
```

---

## 5. Checklist

- [x] Akun Lynk.id aktif di `https://lynk.id/zhkas`
- [x] Teks pembuka, 4 tombol link, gambar QRIS, artikel privasi, teks penutup terpasang (8 blok)
- [x] QRIS di-upload sebagai gambar, bukan path relatif — terverifikasi live 749×872
- [x] Artikel Kebijakan Privasi publish sebagai *free content* di `lynk.id/zhkas/c/ll4dgp41og3n`
- [x] APK logo baru sudah diunggah ulang ke Google Drive oleh pemilik akun
- [x] Tidak ada tombol Play Store aktif (belum tersedia)
- [x] Teks donasi menyatakan "sukarela, tidak membuka fitur apa pun"
- [x] Tombol email memakai Gmail compose (Lynk.id merusak `mailto:`)
- [x] URL hub dipakai di semua copy bio/caption di dokumen `BIO_LINK.md` dan `COPY-PASTE.md`
- [ ] Foto profil diganti ke logo 3D (masih avatar default)
- [ ] URL hub dipasang ke bio IG, TikTok, WA, Facebook, X, dan caption video (di akun sosial milik user)

---

## 6. Web app untuk iPhone/iPad (setelah URL live)

Tambahkan blok **tombol link** baru di dashboard Lynk.id **hanya setelah** alamat
HTTPS ZhKas terverifikasi bisa dibuka di Safari. Belum ada tombol Play Store
karena versi iOS memakai web app, bukan App Store.

| Label tombol | Tujuan |
| --- | --- |
| 🌐 Coba ZhKas di iPhone/iPad | `https://zhtech703-debug.github.io` |

Alamat GitHub Pages sudah aktif dan terverifikasi (lihat
[`docs/GITHUB_PAGES.md`](../../GITHUB_PAGES.md)). Setelah tombol dipasang, buka
`https://lynk.id/zhkas` di Safari untuk memastikan tautannya hidup. Donasi tetap
sukarela dan tidak membuka fitur apa pun.
