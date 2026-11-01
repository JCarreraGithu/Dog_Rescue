import { NextResponse } from "next/server";
import { getUserFromRequest, readAudit } from "@/lib/staff-store";

// Bitácora: SOLO administrador total.
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "superadmin" || user.mustChangePassword) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit")) || 300, 1000);
  return NextResponse.json(await readAudit(limit));
}
