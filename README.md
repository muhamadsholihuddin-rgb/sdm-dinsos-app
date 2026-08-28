# Aplikasi SDM Dinsos

Web app untuk melengkapi data SDM (data diri, desa dampingan, dan menu tambahan yang bisa dibuat sendiri oleh admin). Login pakai NIP, semua data disimpan di Google Spreadsheet, aplikasi di-deploy lewat GitHub + Vercel.

**Arsitektur**: Next.js (Vercel) untuk tampilan → memanggil **Google Apps Script Web App** (dijalankan dari akun Google Anda sendiri) untuk baca/tulis ke spreadsheet. Cara ini **tidak perlu Google Cloud Console** — hanya perlu Google Spreadsheet biasa.

## 1. Siapkan Google Spreadsheet

1. Buat 1 Google Spreadsheet baru (spreadsheet ini yang akan jadi "database").
2. Beri nama sheet (tab) pertama **`SDM`**.
3. Import `SDM_import.csv` (ada di folder ini) ke sheet `SDM` tersebut — pakai menu **File > Import > Upload**, pilih "Replace current sheet". File ini sudah berisi 202 data pegawai plus kolom **ROLE** tambahan (isi default `PEGAWAI`).
4. Ubah nilai kolom `ROLE` menjadi `ADMIN` untuk NIP yang ingin diberi akses admin (misalnya NIP Anda sendiri).
5. Sheet lain (`DesaDampingan`, `AdminMenus`, dan sheet-sheet data menu dinamis) **akan dibuat otomatis** saat pertama kali dipakai — tidak perlu dibuat manual.

## 2. Pasang backend Apps Script (tidak perlu Google Cloud Console)

1. Di spreadsheet yang sama, buka menu **Extensions > Apps Script**.
2. Hapus semua isi default di `Code.gs`, lalu tempel seluruh isi file **`apps-script/Code.gs`** (ada di folder ini).
3. Di baris paling atas kode, ganti:
   ```js
   const TOKEN = "GANTI_DENGAN_STRING_RAHASIA_ANDA";
   ```
   dengan string acak rahasia buatan Anda sendiri (bebas, contoh: `sdm2026-rahasia-x7y2`). **Catat nilai ini**, nanti dipakai lagi di langkah 4.
4. Klik **Deploy > New deployment**.
   - Klik ikon gerigi di "Select type", pilih **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**. Google mungkin minta izin akses ke spreadsheet Anda — setujui.
5. Salin **URL Web App** yang muncul (diakhiri `/exec`). Ini jadi `APPS_SCRIPT_URL`.

> Catatan: setiap kali Anda mengubah kode `Code.gs` di kemudian hari, buat **New deployment** lagi (bukan cuma Save) supaya URL Web App memakai kode terbaru.

## 3. Setup project secara lokal (opsional, untuk uji coba)

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local`:
```
APPS_SCRIPT_URL=url_web_app_dari_langkah_2.5
APPS_SCRIPT_TOKEN=string_rahasia_yang_sama_dengan_TOKEN_di_Code.gs
SESSION_SECRET=isi_string_acak_panjang_bebas
```

Lalu jalankan:
```bash
npm run dev
```
Buka `http://localhost:3000`.

## 4. Push ke GitHub

```bash
git init
git add .
git commit -m "Aplikasi SDM Dinsos"
git branch -M main
git remote add origin URL_REPO_GITHUB_ANDA
git push -u origin main
```

## 5. Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com), klik **Add New > Project**, pilih repo GitHub yang baru dibuat.
2. Di bagian **Environment Variables**, tambahkan 3 variabel yang sama seperti di `.env.local`:
   - `APPS_SCRIPT_URL`
   - `APPS_SCRIPT_TOKEN`
   - `SESSION_SECRET`
3. Klik **Deploy**. Setelah selesai, aplikasi bisa diakses dari domain `*.vercel.app` yang diberikan Vercel.

## Cara pakai

- **Pegawai**: buka aplikasi, masukkan NIP, lalu lengkapi Data Diri dan Desa Dampingan. Menu tambahan yang dibuat admin juga akan muncul di sini.
- **Admin**: setelah login dengan NIP yang ROLE-nya `ADMIN`, akan diarahkan ke Panel Admin. Di sana admin bisa:
  - Melihat & mengedit data semua pegawai (termasuk mengubah ROLE pegawai lain jadi admin).
  - Melihat data desa dampingan seluruh pegawai.
  - Membuat **menu baru** (nama + daftar field, bisa teks/angka/tanggal/pilihan) yang otomatis muncul di halaman semua pegawai untuk diisi masing-masing, dan melihat rekap datanya per menu.

## Catatan

- Login hanya berdasarkan NIP tanpa password (sesuai permintaan), cocok untuk lingkungan kerja tertutup.
- Apps Script Web App gratis punya kuota harian (jumlah request & waktu eksekusi). Untuk ±200 pegawai yang mengisi data di waktu berbeda-beda biasanya aman; kalau nanti sering muncul error "quota exceeded" saat jam sibuk, langkah berikutnya adalah pindah ke akses Google Sheets API langsung (service account) yang lebih tahan beban.
- Jaga kerahasiaan `APPS_SCRIPT_TOKEN` — siapa pun yang tahu URL + token bisa membaca/menulis data lewat Web App ini.
