# ZhKas

Aplikasi kas pribadi mobile-first dengan nuansa dark mode dan aksen **Blue / Glacier**.
Dibangun dengan **React + Vite + Tailwind CSS**. Bisa diinstal sebagai aplikasi
Android (PWA) dan berjalan sepenuhnya offline.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` (atau port yang ditampilkan).

Build production:

```bash
npm run build
npm run preview
```

## Instalasi Android

Lihat [docs/ANDROID.md](docs/ANDROID.md). Ringkasnya: buka di Chrome Android →
menu ⋮ → **Tambahkan ke layar utama**. Tidak ada izin SMS, aksesibilitas, atau
kredensial bank.

Untuk uji coba cepat, tersedia juga APK debug di
[`docs/apk/zhkas-trial-debug.apk`](docs/apk/zhkas-trial-debug.apk). Catatan: APK
menggunakan WebView, jadi sinkronisasi Google Drive sebaiknya tetap lewat
PWA/Chrome.

Ikon dan splash memakai logo 3D baru (Z kaca dengan ekstrusi + orbit ring),
dihasilkan dari [`scripts/build_brand_assets.py`](scripts/build_brand_assets.py).
Generator yang sama memperbarui ikon PWA, adaptive icon Android, dan splash.
Jangan mengedit PNG hasil secara manual — ubah generator lalu jalankan ulang.

Video promosi terbaru ada di
[`docs/monetization/remotion/out/08-remotion-demo.mp4`](docs/monetization/remotion/out/08-remotion-demo.mp4)
(dibuat dengan Remotion, voice over laki-laki, caption kinetik, data pribadi
disamarkan). Source-nya ada di [`docs/monetization/remotion/`](docs/monetization/remotion/).

Tampilan juga adaptif untuk HP lipat: layar penutup memakai navigasi bawah,
layar dalam terbuka memakai rail samping dan konten dua kolom. Detail ada di
[docs/ANDROID.md](docs/ANDROID.md#layar-lipat--foldable-z-fold-flip-dan-sejenisnya).

## iPhone / iPad (web app)

ZhKas juga bisa dipasang di iPhone/iPad lewat Safari → **Tambahkan ke Layar
Utama**, tanpa App Store, akun, atau biaya. Lihat
[docs/IOS.md](docs/IOS.md) untuk cara pasang, checklist uji di perangkat, dan
batasannya. Untuk mempublikasikan ke GitHub Pages tanpa ikut mengunggah kunci
Android, ikuti [docs/GITHUB_PAGES.md](docs/GITHUB_PAGES.md).

## Sinkronisasi Google Drive (opsional)

Lihat [docs/GOOGLE_DRIVE.md](docs/GOOGLE_DRIVE.md). Backup disimpan di
`appDataFolder` (folder privat aplikasi).

## Mode aman & gratis

ZhKas sengaja dibuat tanpa integrasi bank berbayar. Alur pencatatan yang dipakai:

- **Input manual** — catat pengeluaran/pemasukan lewat tombol `+` atau aksi cepat.
- **Impor CSV lokal** — file mutasi dibaca di browser, dipetakan kolomnya, lalu
  dimasukkan ke rekening pilihan. File tidak diunggah.
- **Backup & restore** — unduh JSON/CSV, pulihkan dari file, atau unduh backup
  terenkripsi AES-256-GCM dengan passphrase (PBKDF2-SHA256).
- **Sinkronisasi opsional** — backup dienkripsi AES-256-GCM dengan passphrase
  di perangkat sebelum diunggah ke Google Drive `appDataFolder`. Token dan
  passphrase hanya hidup di memori tab.
- **Penyimpanan lokal** — semua data disimpan di `localStorage` perangkat lewat
  `src/lib/store.jsx`. Tidak ada server, akun, atau sinkronisasi wajib.
- **Tanpa kredensial** — aplikasi tidak pernah meminta nomor rekening, PIN, OTP,
  atau akses SMS/aksesibilitas.
- **Tanpa API pihak ketiga** — tidak ada request ke bank, e-wallet, atau layanan
  berbayar. Satu-satunya koneksi eksternal adalah Google OAuth (opsional) dan
  font/icon lokal.
- **Bisa dihapus** — transaksi dapat dihapus dari detail, dan tombol `Reset`
  di menu Data & privasi mengembalikan data contoh.

Konsekuensinya: pencatatan bersifat manual, bukan auto-sync. Sinkronisasi otomatis
resmi memang memerlukan kemitraan/license bank dan tidak termasuk opsi gratis.

## Fitur

- **Kartu bank swipeable** — 3 rekening contoh, saldo mengikuti transaksi yang
  dicatat, transisi geser halus, drag + snap, indikator halaman, dan tombol
  sembunyikan saldo.
- **Overview** — total saldo, aksi cepat (Catat, Pemasukan, Hutang, Budget),
  ringkasan pengeluaran 7 hari, progres budget, transaksi terbaru, ringkasan
  hutang, saran keuangan, dan kartu "Mode aman".
- **Catat transaksi** — bottom sheet dengan tipe pengeluaran/pemasukan, nominal
  Rupiah, kategori, sumber dana, tanggal, dan catatan. Saldo rekening serta budget
  langsung menyesuaikan.
- **Transaksi** — pencarian, filter kategori, ringkasan pemasukan/pengeluaran,
  daftar per hari, detail transaksi, dan hapus transaksi dengan konfirmasi.
- **Impor CSV** — cocokkan kolom otomatis (tanggal/keterangan/jumlah/debit/kredit),
  pratinjau, deteksi duplikat, dan tebak kategori dari keterangan.
- **Rekap** — arus kas kumulatif, pemasukan vs pengeluaran 6 bulan, donut kategori,
  merchant terbesar, dan ringkasan periode (7/30 hari, bulan, 6 bulan).
- **Hutang & piutang** — catatan memberi/menerima, pelunasan parsial/lunas,
  jatuh tempo, status, dan tautan ke kas (opsional).
- **Budget** — total budget bulanan, progress ring, kategori budget, dan saran
  50/30/20 atau rata-rata 3 bulan. Bisa diedit kapan saja.
- **Saran keuangan** — aturan arus kas, budget, dana darurat, dan hutang.
- **Ekspor** — mutasi, rekap bulanan, dan buku hutang dalam Word (.docx) atau
  Excel (.xlsx), 6 varian, bisa dibagikan lewat share sheet Android.
- **Data & privasi** — ringkasan data, unduh backup JSON, unduh CSV transaksi,
  backup terenkripsi passphrase, pulihkan backup, dan reset data demo.
- **Sinkronisasi Google Drive** — backup terenkripsi privat di `appDataFolder`.
- **Profil & pengaturan** — nama, target pendapatan/tabungan/dana darurat.
- **PWA** — manifest, service worker, ikon launcher, bisa diinstal ke Android.
- **Data demo 33 hari** — 83 transaksi realistis, dipakai sebagai titik awal.
- **Persisten** — transaksi manual tetap ada setelah reload; `Reset` mengembalikan
  data awal.

## Struktur

```text
src/
  components/          komponen UI (kartu, sheet, form, impor, data, dll.)
  lib/format.js        formatter Rupiah & tanggal Indonesia
  lib/store.jsx        state + persistensi localStorage + agregasi budget/hutang
  lib/csv.js           parser CSV, deteksi kolom, tebak kategori
  lib/backup.js        backup/restore JSON, enkripsi AES-GCM, ekspor CSV, share
  lib/analytics.js     rekap, seri harian/bulanan, kategori, merchant
  lib/debts.js         utilitas hutang/piutang
  lib/insights.js      saran keuangan berbasis aturan
  lib/office.js        pembuat .xlsx/.docx (fflate)
  lib/reports.js       varian ekspor Word/Excel
  lib/cloud.js         Google Identity + Drive appDataFolder
  lib/install.js       prompt instalasi PWA
  data.js              data demo 33 hari, kategori, dan helper pengelompokan
  App.jsx              state navigasi dan interaksi utama
  index.css            tema, animasi, dan utility styling
public/
  manifest.webmanifest  PWA manifest
  sw.js                 service worker
  icons/                ikon launcher
  branding/             logo ZhStoreLsw Corp.
docs/
  ANDROID.md
  GOOGLE_DRIVE.md
```

## Catatan

- Data demo dibangkitkan secara deterministik dari tanggal hari ini saat pertama
  kali dibuka, lalu disimpan ke perangkat.
- Transaksi manual memakai ID `ZHK-M...`; transaksi demo memakai `ZHK-....`.
- `localStorage` bersifat per-browser dan per-perangkat serta **tidak terenkripsi**.
  Membersihkan data situs akan menghapus catatan. Gunakan **Data & privasi →
  Unduh backup** secara berkala; aktifkan enkripsi passphrase bila file backup
  disimpan di tempat bersama.
- Passphrase backup tidak disimpan di mana pun. Jika lupa, file `.zhkas` tidak
  bisa dibuka.
- Google Drive sync opsional; token dan passphrase hanya hidup di memori tab.
  Backup lama berupa JSON polos masih bisa dipulihkan, tetapi backup baru
  selalu terenkripsi.
