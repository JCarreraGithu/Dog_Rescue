import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Le dice al navegador si hay sesión del personal (para mostrar "Panel" solo a ellos).
export async function GET() {
  const store = await cookies();
  const admin = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ admin });
}
