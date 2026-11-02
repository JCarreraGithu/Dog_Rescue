import { NextResponse } from "next/server";
import { SESSION_COOKIE, getLoginPath, sessionCookieOptions } from "@/lib/auth";
import { getClientIp, getUserFromRequest, writeAudit } from "@/lib/staff-store";
import { staffUnavailable } from "@/lib/staff-response";

export async function POST(request: Request) {
  let response: NextResponse = NextResponse.json({ ok: true, loginPath: getLoginPath() });
  try {
    const user = await getUserFromRequest(request);
    if (user) {
      await writeAudit({ actor: user.email, actorName: user.name, action: "Cierre de sesión", ip: getClientIp(request) });
    }
  } catch {
    response = staffUnavailable();
  }
  // El navegador puede cerrar su sesión incluso si la base está temporalmente caída.
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
