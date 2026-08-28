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
    const data = await callAppsScript("adminListDesa", {});
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Gagal memuat data." }, { status: 500 });
  }
}
