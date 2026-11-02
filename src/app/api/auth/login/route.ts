import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  isAuthConfigured,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  findUserByEmail,
  getClientIp,
  getDummyHash,
  mutateUsers,
  normalizeEmail,
  verifyPassword,
  writeAudit,
} from "@/lib/staff-store";

import { reserveLoginAttempt, clearLoginAttempts } from "@/lib/login-attempts";

async function login(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "El acceso no está configurado en el servidor (AUTH_SECRET)." },
      { status: 500 }
    );
  }

  const ip = getClientIp(request);

  let email = "";
  let password = "";
  try {
    const body = await request.json();
    email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    // cuerpo inválido -> credenciales vacías
  }

  if (!(await reserveLoginAttempt(ip, email))) {
    await writeAudit({ actor: email || "anónimo", action: "Intento bloqueado por exceso de fallos", ip });
    return NextResponse.json(
      { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." },
      { status: 429 }
    );
  }

  const user = email ? await findUserByEmail(email) : undefined;
  // Siempre se calcula un hash (aunque el correo no exista) para no revelar qué cuentas existen
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));

  if (!user || !user.active || !passwordOk) {
    await writeAudit({
      actor: email || "anónimo",
      action: user && !user.active && passwordOk ? "Login rechazado (usuario desactivado)" : "Login fallido",
      ip,
    });
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  await clearLoginAttempts(ip, email);

  await mutateUsers((users) => {
    const target = users.find((u) => u.id === user.id);
    if (!target || !target.active || target.sessionVersion !== user.sessionVersion || target.passwordHash !== user.passwordHash) {
      throw new Error("La cuenta cambió durante el acceso.");
    }
    target.lastLoginAt = new Date().toISOString();
  }, { actor: user, audit: () => ({ actor: user.email, actorName: user.name, action: "Inicio de sesión", ip }) });

  const token = await createSessionToken(user.id, user.sessionVersion);
  const response = NextResponse.json({ ok: true, mustChangePassword: user.mustChangePassword });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

export async function POST(request: Request) {
  try { return await login(request); }
  catch { return NextResponse.json({ error: "El acceso no está disponible temporalmente." }, { status: 503 }); }
}
