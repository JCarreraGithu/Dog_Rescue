import { NextResponse } from "next/server";
import { SESSION_COOKIE, getLoginPath, sessionCookieOptions } from "@/lib/auth";
import { getClientIp, getUserFromRequest, writeAudit } from "@/lib/staff-store";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (user) {
    await writeAudit({ actor: user.email, actorName: user.name, action: "Cierre de sesión", ip: getClientIp(request) });
  }
  const response = NextResponse.json({ ok: true, loginPath: getLoginPath() });
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
