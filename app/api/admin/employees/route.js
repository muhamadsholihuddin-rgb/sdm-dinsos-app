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
    const data = await callAppsScript("adminListEmployees", {});
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Gagal memuat data." }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = requireAdmin();
  if (!session) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  const { nip, data } = await req.json();
  try {
    const result = await callAppsScript("adminUpdateEmployee", { nip, data });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Gagal menyimpan." }, { status: 500 });
  }
}
