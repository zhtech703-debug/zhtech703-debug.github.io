# ZhKas untuk iPhone & iPad (web app / PWA)

ZhKas berjalan di iOS sebagai **web app** yang dipasang dari Safari. Alamat web
publik: **`https://zhtech703-debug.github.io`** (hosting gratis GitHub Pages —
lihat [`GITHUB_PAGES.md`](GITHUB_PAGES.md)). Tidak ada aplikasi App Store, tidak
ada akun, tidak ada iklan, dan tidak ada biaya. Data tetap disimpan di browser
pada perangkat Anda.

## Install

1. Buka **`https://zhtech703-debug.github.io`** di **Safari** (Chrome/Firefox di iOS tidak bisa memasang
   web app ke layar utama).
2. Ketuk tombol **Bagikan** (kotak dengan panah ke atas).
3. Pilih **Tambahkan ke Layar Utama**.
4. Ketuk **Tambah**. Ikon ZhKas muncul di layar utama.
5. Buka ikon tersebut — aplikasi tampil full-screen tanpa bilah alamat Safari.

## Data & privasi

- Seluruh budget, transaksi, hutang, dan pengaturan tersimpan lokal di browser
  perangkat (`localStorage`). Tidak ada server ZhKas.
- Tidak ada akun, email wajib, PIN bank, OTP, SMS, atau izin aksesibilitas.
- Menghapus web app dari layar utama atau menghapus data situs Safari akan
  menghapus data lokal. Unduh backup terlebih dahulu bila ingin menyimpannya.
- Donasi sukarela tidak membuka fitur apa pun; semua fitur inti tetap gratis.

## Export, backup & berbagi

- Menu **Data & privasi** menyediakan unduh backup JSON/CSV dan backup
  terenkripsi dengan passphrase.
- Di iOS, tombol unduh membuka **share sheet bila tersedia**. Pilih **Simpan ke
  Files**, Notes, atau kirim ke diri sendiri lewat Gmail. Bila share sheet tidak
  tersedia, file disimpan ke **Downloads** (bisa dibuka lewat aplikasi Files).
  Memilih pembatalan pada share sheet tidak menyimpan file — ulangi bila ingin
  menyimpan.
- Untuk memulihkan, buka file backup dari Files/Mail lalu pilih **Pulihkan data**
  di menu Data & privasi. Impor CSV memakai tombol **Impor CSV**.
- Passphrase backup tidak disimpan di mana pun. Simpan terpisah.

## Sinkronisasi Google Drive

Sinkronisasi Google Drive bersifat opsional. Proses masuk memakai popup browser;
iOS Safari dapat memblokir popup ini. Bila itu terjadi, aplikasi tetap bisa
dipakai penuh — gunakan **CSV** atau **backup lokal** sebagai gantinya. Tidak ada
data yang dikirim ke server ZhKas.

## Update & offline

- Setelah berhasil dibuka satu kali, aplikasi bisa dipakai offline.
- Update otomatis saat perangkat terhubung internet; tutup lalu buka lagi untuk
  memaksa pembaruan.

## Tampilan

- Tata letak menyesuaikan potret/lanskap, iPhone, iPad layar lebar, dan layar
  lipat. Area aman di sekitar notch dan sudut melengkung dihormati.

## Checklist uji di iPhone/iPad

- [ ] Buka https://zhtech703-debug.github.io di Safari
- [ ] Ketuk Bagikan → Tambahkan ke Layar Utama → Tambah; ikon muncul di layar utama
- [ ] Buka ikon: tampil full-screen, tanpa bilah alamat Safari
- [ ] Tambah transaksi, tutup aplikasi, buka lagi: data masih ada
- [ ] Matikan internet
- [ ] Buka aplikasi dalam keadaan offline: data dan rekap tetap tampil
- [ ] Nyalakan internet kembali
- [ ] Ekspor CSV lalu simpan lewat share sheet ke Files
- [ ] Buka file CSV dari Files lalu impor kembali lewat menu Impor CSV
- [ ] Unduh backup JSON lalu pulihkan kembali di perangkat yang sama
- [ ] Buka Pengaturan → Instal aplikasi: muncul petunjuk Tambahkan ke Layar Utama
- [ ] Putar ke lanskap (iPhone) dan buka di iPad lebar: tata letak tidak pecah
- [ ] Coba Sinkronisasi Google Drive; bila popup diblokir, aplikasi tetap usable

Centang hasil pengujian Anda sendiri. Checklist ini tidak bisa dijalankan dari
komputer Windows; verifikasi di perangkat dilakukan oleh pemilik perangkat.

## Batasan

- Ini bukan aplikasi native App Store. Fitur khusus iOS seperti Wallet, Face ID,
  dan notifikasi sistem tidak tersedia.
- Penyimpanan web bisa dihapus oleh iOS bila ruang penyimpanan menipis atau bila
  data situs Safari dibersihkan.
- Google Drive sync bersifat best-effort di Safari; CSV dan backup lokal adalah
  alternatif yang reliabel.

## Kontak

Pertanyaan atau laporan bug: **zhtech703@gmail.com**
