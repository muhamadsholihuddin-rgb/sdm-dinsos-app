// Nama-nama sheet (tab) di dalam 1 Google Spreadsheet
export const SHEET_SDM = "SDM";
export const SHEET_DESA = "DesaDampingan";
export const SHEET_MENUS = "AdminMenus";
export const DYNAMIC_SHEET_PREFIX = "Data_";

// Kolom sheet SDM (harus urut sama dengan header di baris 1 sheet Google Sheets)
// ROLE ditambahkan di kolom terakhir untuk menandai ADMIN / PEGAWAI
export const SDM_COLUMNS = [
  "NO",
  "NIP",
  "NIK",
  "NAMA",
  "KECAMATAN",
  "ID PEGAWAI",
  "ALAMAT (SESUAI KTP)",
  "KABUPATEN/KOTA (SESUAI KTP)",
  "KECAMATAN (SESUAI KTP)",
  "KELURAHAN/DESA (SESUAI KTP)",
  "JENIS KELAMIN",
  "TEMPAT LAHIR",
  "TANGGAL LAHIR",
  "USIA",
  "AGAMA",
  "STATUS PERNIKAHAN",
  "JUMLAH ANAK",
  "NO HP / WA",
  "EMAIL",
  "PERGURUAN TINGGI/ SEKOLAH TERAKHIR",
  "JURUSAN",
  "JENJANG",
  "NO REKENING",
  "NAMA REKENING",
  "BANK",
  "NOMER REKENING BANK JATIM",
  "IBU KANDUNG",
  "NO NPWP",
  "NO BPJS KESEHATAN",
  "NO BPJS KETENAGA KERJAAN PUSAT",
  "NO BPJS KETENAGA KERJAAN MANDIRI",
  "TMG KOHOR",
  "TMT JABATAN",
  "JABATAN",
  "STATUS DATA",
  "ROLE",
];

// Kolom yang tampil & bisa diedit pegawai sendiri di dashboard (selain NIP/NIK yang identitas pokok)
export const SDM_EDITABLE_BY_SELF = SDM_COLUMNS.filter(
  (c) => !["NO", "NIP", "ROLE"].includes(c)
);

export const DESA_COLUMNS = [
  "NIP",
  "DESA DAMPINGAN",
  "KECAMATAN DAMPINGAN",
  "KETERANGAN",
  "TERAKHIR DIUBAH",
];

// Kolom sheet AdminMenus: satu baris = satu definisi menu dinamis
export const MENUS_COLUMNS = ["MENU_ID", "NAMA_MENU", "SLUG", "FIELDS_JSON", "DIBUAT"];

export const FIELD_TYPES = [
  { value: "text", label: "Teks singkat" },
  { value: "textarea", label: "Teks panjang" },
  { value: "number", label: "Angka" },
  { value: "date", label: "Tanggal" },
  { value: "select", label: "Pilihan (dropdown)" },
];
