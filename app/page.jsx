"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FIELD_TYPES } from "@/lib/schema";

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pegawai");

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const res = await fetch("/api/auth/session");
    const data = await res.json();
    if (!data.authenticated) {
      router.push("/login");
      return;
    }
    if (data.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    setSession(data);
    setLoading(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="shell">
        <p>Memuat...</p>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <div>
            <div className="topbar-title">Panel Admin</div>
            <div className="topbar-sub">{session.nama}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn ghost" onClick={() => router.push("/dashboard")}>
              Data Saya
            </button>
            <button className="btn ghost" onClick={handleLogout}>
              Keluar
            </button>
          </div>
        </div>
      </div>

      <div className="shell">
        <div className="tabs">
          <div className={`tab ${tab === "pegawai" ? "active" : ""}`} onClick={() => setTab("pegawai")}>
            Data Pegawai
          </div>
          <div className={`tab ${tab === "desa" ? "active" : ""}`} onClick={() => setTab("desa")}>
            Desa Dampingan
          </div>
          <div className={`tab ${tab === "menus" ? "active" : ""}`} onClick={() => setTab("menus")}>
            Menu Dinamis
          </div>
        </div>

        {tab === "pegawai" && <PegawaiTab />}
        {tab === "desa" && <DesaTab />}
        {tab === "menus" && <MenusTab />}
      </div>
    </>
  );
}

function PegawaiTab() {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/admin/employees");
    const d = await res.json();
    setData(d);
  }

  function openEdit(row) {
    setEditing(row["NIP"]);
    setForm(row);
  }

  async function saveEdit() {
    setSaving(true);
    await fetch("/api/admin/employees", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nip: editing, data: form }),
    });
    setSaving(false);
    setEditing(null);
    load();
  }

  if (!data) return <p>Memuat data pegawai...</p>;

  const rows = data.rows.filter(
    (r) =>
      !search ||
      (r["NAMA"] || "").toLowerCase().includes(search.toLowerCase()) ||
      (r["NIP"] || "").includes(search)
  );

  if (editing) {
    return (
      <div className="card">
        <p className="card-title">Edit Data: {form["NAMA"]}</p>
        <div className="grid-2">
          {data.header
            .filter((c) => c !== "NO")
            .map((col) => (
              <div className="field" key={col}>
                <label>{col}</label>
                {col === "ROLE" ? (
                  <select value={form[col] || "PEGAWAI"} onChange={(e) => setForm({ ...form, [col]: e.target.value })}>
                    <option value="PEGAWAI">PEGAWAI</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                ) : (
                  <input
                    value={form[col] || ""}
                    disabled={col === "NIP"}
                    onChange={(e) => setForm({ ...form, [col]: e.target.value })}
                  />
                )}
              </div>
            ))}
        </div>
        <div className="row-actions">
          <button className="btn" disabled={saving} onClick={saveEdit}>
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
          <button className="btn secondary" onClick={() => setEditing(null)}>
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="card-title">Data Pegawai ({rows.length})</p>
      <div className="field">
        <input placeholder="Cari nama atau NIP..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>NIP</th>
              <th>Nama</th>
              <th>Kecamatan</th>
              <th>Jabatan</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r["NIP"]}>
                <td>{r["NIP"]}</td>
                <td>{r["NAMA"]}</td>
                <td>{r["KECAMATAN"]}</td>
                <td>{r["JABATAN"]}</td>
                <td>
                  <span className={`badge ${r["ROLE"] === "ADMIN" ? "gold" : ""}`}>
                    {r["ROLE"] === "ADMIN" ? "ADMIN" : "PEGAWAI"}
                  </span>
                </td>
                <td>
                  <button className="link-plain" onClick={() => openEdit(r)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DesaTab() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    fetch("/api/admin/desa")
      .then((r) => r.json())
      .then((d) => setRows(d.rows));
  }, []);

  if (!rows) return <p>Memuat...</p>;

  return (
    <div className="card">
      <p className="card-title">Desa Dampingan Semua Pegawai ({rows.length})</p>
      {rows.length === 0 ? (
        <div className="empty-state">Belum ada data desa dampingan yang diisi pegawai.</div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>NIP</th>
                <th>Desa Dampingan</th>
                <th>Kecamatan Dampingan</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r["NAMA"]}</td>
                  <td>{r["NIP"]}</td>
                  <td>{r["DESA DAMPINGAN"]}</td>
                  <td>{r["KECAMATAN DAMPINGAN"]}</td>
                  <td>{r["KETERANGAN"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MenusTab() {
  const [menus, setMenus] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewSlug, setViewSlug] = useState(null);
  const [viewData, setViewData] = useState(null);

  const [menuName, setMenuName] = useState("");
  const [fields, setFields] = useState([{ id: "f1", label: "", type: "text", options: [] }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/admin/menus");
    const d = await res.json();
    setMenus(d.menus);
  }

  function addField() {
    setFields([...fields, { id: `f${fields.length + 1}`, label: "", type: "text", options: [] }]);
  }

  function updateField(idx, patch) {
    const next = [...fields];
    next[idx] = { ...next[idx], ...patch };
    setFields(next);
  }

  function removeField(idx) {
    setFields(fields.filter((_, i) => i !== idx));
  }

  async function createMenu() {
    setError("");
    const cleanFields = fields
      .filter((f) => f.label.trim())
      .map((f) => ({
        ...f,
        options:
          f.type === "select"
            ? (f.optionsText || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
      }));

    if (!menuName.trim() || cleanFields.length === 0) {
      setError("Nama menu dan minimal 1 field wajib diisi.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: menuName, fields: cleanFields }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Gagal membuat menu.");
      return;
    }
    setMenuName("");
    setFields([{ id: "f1", label: "", type: "text", options: [] }]);
    setShowForm(false);
    load();
  }

  async function disableMenu(menuId) {
    if (!confirm("Nonaktifkan menu ini? Data yang sudah ada tetap tersimpan.")) return;
    await fetch("/api/admin/menus", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menuId }),
    });
    load();
  }

  async function viewMenuData(slug) {
    setViewSlug(slug);
    const res = await fetch(`/api/admin/menu-data?slug=${encodeURIComponent(slug)}`);
    const d = await res.json();
    setViewData(d);
  }

  if (!menus) return <p>Memuat...</p>;

  if (viewSlug) {
    return (
      <div className="card">
        <button className="link-plain" onClick={() => setViewSlug(null)} style={{ marginBottom: 12 }}>
          ← Kembali ke daftar menu
        </button>
        <p className="card-title">Data: {viewSlug}</p>
        {!viewData ? (
          <p>Memuat...</p>
        ) : viewData.rows.length === 0 ? (
          <div className="empty-state">Belum ada pegawai yang mengisi menu ini.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  {viewData.header
                    .filter((h) => h !== "NIP")
                    .map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {viewData.rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r["NAMA"]}</td>
                    {viewData.header
                      .filter((h) => h !== "NIP")
                      .map((h) => (
                        <td key={h}>{r[h]}</td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <p className="card-title">Menu Dinamis</p>
        <p className="card-sub">
          Buat menu baru untuk data tambahan di luar data diri & desa dampingan bawaan. Setiap pegawai akan mengisi
          datanya masing-masing.
        </p>

        {menus.length === 0 ? (
          <div className="empty-state">Belum ada menu tambahan.</div>
        ) : (
          menus.map((m) => (
            <div
              key={m["MENU_ID"]}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{m["NAMA_MENU"]}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{m.fields.length} field</div>
              </div>
              <div className="row-actions" style={{ marginTop: 0 }}>
                <button className="link-plain" onClick={() => viewMenuData(m["SLUG"])}>
                  Lihat Data
                </button>
                {!m["NAMA_MENU"].startsWith("[NONAKTIF]") && (
                  <button className="link-plain" style={{ color: "var(--danger)" }} onClick={() => disableMenu(m["MENU_ID"])}>
                    Nonaktifkan
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        <div style={{ marginTop: 16 }}>
          <button className="btn secondary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Batal" : "+ Buat Menu Baru"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <p className="card-title">Menu Baru</p>
          <div className="field">
            <label>Nama Menu</label>
            <input value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="Contoh: Data Kendaraan Dinas" />
          </div>

          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 8 }}>
            Field / Kolom
          </label>
          {fields.map((f, idx) => (
            <div key={f.id} className="fields-builder-row">
              <div className="field" style={{ marginBottom: 0 }}>
                <input
                  placeholder="Nama field, contoh: Nomor Polisi"
                  value={f.label}
                  onChange={(e) => updateField(idx, { label: e.target.value })}
                />
                {f.type === "select" && (
                  <input
                    style={{ marginTop: 8 }}
                    placeholder="Pilihan, pisahkan dengan koma"
                    value={f.optionsText || ""}
                    onChange={(e) => updateField(idx, { optionsText: e.target.value })}
                  />
                )}
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <select value={f.type} onChange={(e) => updateField(idx, { type: e.target.value })}>
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <button className="link-plain" style={{ color: "var(--danger)" }} onClick={() => removeField(idx)}>
                Hapus
              </button>
            </div>
          ))}
          <button className="link-plain" onClick={addField}>
            + Tambah field
          </button>

          {error && <p className="error-text">{error}</p>}

          <div className="row-actions">
            <button className="btn" disabled={saving} onClick={createMenu}>
              {saving ? "Menyimpan..." : "Simpan Menu"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
