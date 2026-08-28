import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callAppsScript } from "@/lib/appsScript";

function requireAdmin() {
  const session = getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = requireAdmin();
  if (!session) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  try {
    const data = await callAppsScript("adminListMenus", {});
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Gagal memuat menu." }, { status: 500 });
  }
}

export async function POST(req) {
  const session = requireAdmin();
  if (!session) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  const { nama, fields } = await req.json();
  if (!nama || !nama.trim()) {
    return NextResponse.json({ error: "Nama menu wajib diisi." }, { status: 400 });
  }
  if (!Array.isArray(fields) || fields.length === 0) {
    return NextResponse.json({ error: "Minimal 1 field diperlukan." }, { status: 400 });
  }

  try {
    const result = await callAppsScript("adminCreateMenu", { nama, fields });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Gagal membuat menu." }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = requireAdmin();
  if (!session) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  const { menuId } = await req.json();
  try {
    const result = await callAppsScript("adminDisableMenu", { menuId });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Gagal menonaktifkan menu." }, { status: 500 });
  }
}
