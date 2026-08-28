/**
 * BACKEND APPS SCRIPT — Aplikasi SDM Dinsos
 *
 * Cara pakai:
 * 1. Buka Google Spreadsheet database Anda.
 * 2. Menu Extensions > Apps Script.
 * 3. Hapus isi default Code.gs, tempel seluruh isi file ini.
 * 4. Ganti nilai TOKEN di bawah dengan string acak rahasia (harus sama persis
 *    dengan APPS_SCRIPT_TOKEN yang diisi di environment variable Vercel).
 * 5. Klik Deploy > New deployment > pilih tipe "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Salin URL Web App yang diberikan (diakhiri /exec), itu jadi APPS_SCRIPT_URL.
 * 7. Setiap kali Anda edit kode ini, buat "New deployment" lagi (bukan cuma save)
 *    agar URL Web App menerapkan perubahan.
 */

const TOKEN = "GANTI_DENGAN_STRING_RAHASIA_ANDA";

const SHEET_SDM = "SDM";
const SHEET_DESA = "DesaDampingan";
const SHEET_MENUS = "AdminMenus";
const DYNAMIC_PREFIX = "Data_";

const SDM_COLUMNS = [
  "NO","NIP","NIK","NAMA","KECAMATAN","ID PEGAWAI","ALAMAT (SESUAI KTP)",
  "KABUPATEN/KOTA (SESUAI KTP)","KECAMATAN (SESUAI KTP)","KELURAHAN/DESA (SESUAI KTP)",
  "JENIS KELAMIN","TEMPAT LAHIR","TANGGAL LAHIR","USIA","AGAMA","STATUS PERNIKAHAN",
  "JUMLAH ANAK","NO HP / WA","EMAIL","PERGURUAN TINGGI/ SEKOLAH TERAKHIR","JURUSAN",
  "JENJANG","NO REKENING","NAMA REKENING","BANK","NOMER REKENING BANK JATIM",
  "IBU KANDUNG","NO NPWP","NO BPJS KESEHATAN","NO BPJS KETENAGA KERJAAN PUSAT",
  "NO BPJS KETENAGA KERJAAN MANDIRI","TMG KOHOR","TMT JABATAN","JABATAN","STATUS DATA","ROLE",
];

const DESA_COLUMNS = ["NIP", "DESA DAMPINGAN", "KECAMATAN DAMPINGAN", "KETERANGAN", "TERAKHIR DIUBAH"];
const MENUS_COLUMNS = ["MENU_ID", "NAMA_MENU", "SLUG", "FIELDS_JSON", "DIBUAT"];

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ error: "Body tidak valid." }, 400);
  }

  if (body.token !== TOKEN) {
    return jsonOut({ error: "Token tidak valid." }, 401);
  }

  const action = body.action;
  const payload = body.payload || {};

  try {
    switch (action) {
      case "login":
        return jsonOut(actionLogin(payload));
      case "getMe":
        return jsonOut(actionGetMe(payload));
      case "updateProfil":
        return jsonOut(actionUpdateProfil(payload));
      case "updateDesa":
        return jsonOut(actionUpdateDesa(payload));
      case "updateMenuData":
        return jsonOut(actionUpdateMenuData(payload));
      case "adminListEmployees":
        return jsonOut(actionAdminListEmployees());
      case "adminUpdateEmployee":
        return jsonOut(actionAdminUpdateEmployee(payload));
      case "adminListDesa":
        return jsonOut(actionAdminListDesa());
      case "adminListMenus":
        return jsonOut(actionAdminListMenus());
      case "adminCreateMenu":
        return jsonOut(actionAdminCreateMenu(payload));
      case "adminDisableMenu":
        return jsonOut(actionAdminDisableMenu(payload));
      case "adminGetMenuData":
        return jsonOut(actionAdminGetMenuData(payload));
      default:
        return jsonOut({ error: "Aksi tidak dikenal: " + action }, 400);
    }
  } catch (err) {
    return jsonOut({ error: String(err) }, 500);
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ss() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(name, header) {
  const spreadsheet = ss();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(header);
  }
  return sheet;
}

function sheetToObjects(name, defaultHeader) {
  const spreadsheet = ss();
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) return { header: defaultHeader || [], rows: [] };

  const values = sheet.getDataRange().getValues();
  if (values.length === 0) return { header: defaultHeader || [], rows: [] };

  const header = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const obj = { _rowNumber: i + 1 };
    header.forEach((col, idx) => {
      obj[col] = values[i][idx] !== undefined ? values[i][idx] : "";
    });
    rows.push(obj);
  }
  return { header, rows };
}

function updateRow(sheetName, rowNumber, header, valuesObj) {
  const sheet = ss().getSheetByName(sheetName);
  const row = header.map((col) => (valuesObj[col] !== undefined ? valuesObj[col] : ""));
  sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
}

function appendRow(sheetName, header, valuesObj) {
  const sheet = getOrCreateSheet(sheetName, header);
  const row = header.map((col) => (valuesObj[col] !== undefined ? valuesObj[col] : ""));
  sheet.appendRow(row);
}

function findRowByNip(rows, nip) {
  return rows.find((r) => String(r["NIP"]).trim() === String(nip).trim());
}

// ---------- Actions ----------

function actionLogin(payload) {
  const nip = payload.nip;
  if (!nip) return { error: "NIP wajib diisi." };
  const { rows } = sheetToObjects(SHEET_SDM);
  const pegawai = findRowByNip(rows, nip);
  if (!pegawai) return { error: "NIP tidak ditemukan. Pastikan NIP sudah benar." };
  const role = String(pegawai["ROLE"] || "").trim().toUpperCase() === "ADMIN" ? "ADMIN" : "PEGAWAI";
  return { ok: true, nip: pegawai["NIP"], nama: pegawai["NAMA"], role: role };
}

function actionGetMe(payload) {
  const nip = payload.nip;
  const sdm = sheetToObjects(SHEET_SDM);
  const desa = sheetToObjects(SHEET_DESA, DESA_COLUMNS);
  const menus = sheetToObjects(SHEET_MENUS, MENUS_COLUMNS);

  const profil = findRowByNip(sdm.rows, nip) || null;
  const desaRow = findRowByNip(desa.rows, nip) || null;

  const menuData = menus.rows.map((menu) => {
    let fields = [];
    try {
      fields = JSON.parse(menu["FIELDS_JSON"] || "[]");
    } catch (e) {
      fields = [];
    }
    const dyn = sheetToObjects(DYNAMIC_PREFIX + menu["SLUG"]);
    const dataRow = findRowByNip(dyn.rows, nip) || null;
    return { menuId: menu["MENU_ID"], nama: menu["NAMA_MENU"], slug: menu["SLUG"], fields: fields, dataRow: dataRow };
  });

  return { profil: profil, profilHeader: sdm.header, desa: desaRow, menus: menuData };
}

function actionUpdateProfil(payload) {
  const nip = payload.nip;
  const data = payload.data || {};
  const sdm = sheetToObjects(SHEET_SDM);
  const row = findRowByNip(sdm.rows, nip);
  if (!row) return { error: "Data pegawai tidak ditemukan." };
  const merged = Object.assign({}, row, data, { NIP: nip, ROLE: row["ROLE"] });
  updateRow(SHEET_SDM, row._rowNumber, sdm.header, merged);
  return { ok: true };
}

function actionUpdateDesa(payload) {
  const nip = payload.nip;
  const data = payload.data || {};
  getOrCreateSheet(SHEET_DESA, DESA_COLUMNS);
  const desa = sheetToObjects(SHEET_DESA, DESA_COLUMNS);
  const row = findRowByNip(desa.rows, nip);
  const out = {
    NIP: nip,
    "DESA DAMPINGAN": data["DESA DAMPINGAN"] || "",
    "KECAMATAN DAMPINGAN": data["KECAMATAN DAMPINGAN"] || "",
    KETERANGAN: data["KETERANGAN"] || "",
    "TERAKHIR DIUBAH": new Date().toISOString(),
  };
  if (row) {
    updateRow(SHEET_DESA, row._rowNumber, DESA_COLUMNS, out);
  } else {
    appendRow(SHEET_DESA, DESA_COLUMNS, out);
  }
  return { ok: true };
}

function actionUpdateMenuData(payload) {
  const nip = payload.nip;
  const slug = payload.slug;
  const data = payload.data || {};

  const menus = sheetToObjects(SHEET_MENUS, MENUS_COLUMNS);
  const menuDef = menus.rows.find((m) => m["SLUG"] === slug);
  if (!menuDef) return { error: "Menu tidak ditemukan." };

  let fields = [];
  try {
    fields = JSON.parse(menuDef["FIELDS_JSON"] || "[]");
  } catch (e) {
    fields = [];
  }
  const header = ["NIP"].concat(fields.map((f) => f.label), ["TERAKHIR DIUBAH"]);
  const sheetName = DYNAMIC_PREFIX + slug;
  getOrCreateSheet(sheetName, header);

  const dyn = sheetToObjects(sheetName, header);
  const row = findRowByNip(dyn.rows, nip);
  const out = { NIP: nip, "TERAKHIR DIUBAH": new Date().toISOString() };
  fields.forEach((f) => {
    out[f.label] = data[f.label] || "";
  });

  if (row) {
    updateRow(sheetName, row._rowNumber, header, out);
  } else {
    appendRow(sheetName, header, out);
  }
  return { ok: true };
}

function actionAdminListEmployees() {
  const sdm = sheetToObjects(SHEET_SDM);
  return { header: sdm.header, rows: sdm.rows };
}

function actionAdminUpdateEmployee(payload) {
  const nip = payload.nip;
  const data = payload.data || {};
  const sdm = sheetToObjects(SHEET_SDM);
  const row = findRowByNip(sdm.rows, nip);
  if (!row) return { error: "Pegawai tidak ditemukan." };
  const merged = Object.assign({}, row, data, { NIP: nip });
  updateRow(SHEET_SDM, row._rowNumber, sdm.header, merged);
  return { ok: true };
}

function actionAdminListDesa() {
  const sdm = sheetToObjects(SHEET_SDM);
  const desa = sheetToObjects(SHEET_DESA, DESA_COLUMNS);
  const namaMap = {};
  sdm.rows.forEach((r) => {
    namaMap[r["NIP"]] = r["NAMA"];
  });
  const rows = desa.rows.map((r) => Object.assign({}, r, { NAMA: namaMap[r["NIP"]] || "(tidak dikenal)" }));
  return { rows: rows };
}

function actionAdminListMenus() {
  getOrCreateSheet(SHEET_MENUS, MENUS_COLUMNS);
  const menus = sheetToObjects(SHEET_MENUS, MENUS_COLUMNS);
  const parsed = menus.rows.map((r) => {
    let fields = [];
    try {
      fields = JSON.parse(r["FIELDS_JSON"] || "[]");
    } catch (e) {
      fields = [];
    }
    return Object.assign({}, r, { fields: fields });
  });
  return { menus: parsed };
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function actionAdminCreateMenu(payload) {
  const nama = payload.nama;
  const fields = payload.fields;
  if (!nama || !String(nama).trim()) return { error: "Nama menu wajib diisi." };
  if (!fields || fields.length === 0) return { error: "Minimal 1 field diperlukan." };

  getOrCreateSheet(SHEET_MENUS, MENUS_COLUMNS);
  const menus = sheetToObjects(SHEET_MENUS, MENUS_COLUMNS);

  let slug = slugify(nama);
  let suffix = 1;
  while (menus.rows.some((r) => r["SLUG"] === slug)) {
    slug = slugify(nama) + "_" + suffix;
    suffix++;
  }

  const menuId = "menu_" + new Date().getTime();
  appendRow(SHEET_MENUS, MENUS_COLUMNS, {
    MENU_ID: menuId,
    NAMA_MENU: String(nama).trim(),
    SLUG: slug,
    FIELDS_JSON: JSON.stringify(fields),
    DIBUAT: new Date().toISOString(),
  });

  const header = ["NIP"].concat(fields.map((f) => f.label), ["TERAKHIR DIUBAH"]);
  getOrCreateSheet(DYNAMIC_PREFIX + slug, header);

  return { ok: true, menuId: menuId, slug: slug };
}

function actionAdminDisableMenu(payload) {
  const menuId = payload.menuId;
  const menus = sheetToObjects(SHEET_MENUS, MENUS_COLUMNS);
  const row = menus.rows.find((m) => m["MENU_ID"] === menuId);
  if (!row) return { error: "Menu tidak ditemukan." };
  const merged = Object.assign({}, row, { NAMA_MENU: "[NONAKTIF] " + row["NAMA_MENU"] });
  updateRow(SHEET_MENUS, row._rowNumber, MENUS_COLUMNS, merged);
  return { ok: true };
}

function actionAdminGetMenuData(payload) {
  const slug = payload.slug;
  const sdm = sheetToObjects(SHEET_SDM);
  const dyn = sheetToObjects(DYNAMIC_PREFIX + slug);
  const namaMap = {};
  sdm.rows.forEach((r) => {
    namaMap[r["NIP"]] = r["NAMA"];
  });
  const rows = dyn.rows.map((r) => Object.assign({}, r, { NAMA: namaMap[r["NIP"]] || "(tidak dikenal)" }));
  return { header: dyn.header, rows: rows };
}
