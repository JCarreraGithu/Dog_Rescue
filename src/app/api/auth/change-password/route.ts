import { staffUnavailable } from "@/lib/staff-response";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { validatePassword } from "@/lib/permissions";
import {
  getClientIp,
  getUserFromRequest,
  hashPassword,
  mutateUsers,
  verifyPassword,
} from "@/lib/staff-store";

// Cada persona cambia su propia contraseña. Cierra las demás sesiones abiertas de esa cuenta.
async function handlePOST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let current = "";
  let next = "";
  try {
    const body = await request.json();
    current = typeof body.current === "string" ? body.current : "";
    next = typeof body.next === "string" ? body.next : "";
  } catch {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  if (!(await verifyPassword(current, user.passwordHash))) {
    return NextResponse.json({ error: "La contraseña actual no es correcta." }, { status: 400 });
  }
  const problem = validatePassword(next);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  if (next === current) {
    return NextResponse.json({ error: "La nueva contraseña debe ser distinta a la actual." }, { status: 400 });
  }

  const passwordHash = await hashPassword(next);
  const newVersion = await mutateUsers((users) => {
    const target = users.find((u) => u.id === user.id);
    if (!target || !target.active || target.sessionVersion !== user.sessionVersion || target.passwordHash !== user.passwordHash) {
      throw new Error("La cuenta cambió durante la operación.");
    }
    target.passwordHash = passwordHash;
    target.mustChangePassword = false;
    target.sessionVersion += 1;
    return target.sessionVersion;
  }, { actor: user, audit: () => ({ actor: user.email, actorName: user.name, action: "Cambio de contraseña propia", ip: getClientIp(request) }) });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(user.id, newVersion), sessionCookieOptions());
  return response;
}

export async function POST(request: Request) {
  try { return await handlePOST(request); }
  catch { return staffUnavailable(); }
}
