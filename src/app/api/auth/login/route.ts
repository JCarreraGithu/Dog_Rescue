import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  isAuthConfigured,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  ensureSeedUser,
  findUserByEmail,
  getClientIp,
  getDummyHash,
  mutateUsers,
  normalizeEmail,
  verifyPassword,
  writeAudit,
} from "@/lib/staff-store";

// Límites contra adivinar contraseñas (en memoria): por IP y por cuenta.
// Tras 5 fallos seguidos se bloquea 15 minutos.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 10;
type Counter = { count: number; resetAt: number };
const g = globalThis as unknown as { __loginAttempts?: Map<string, Counter> };
const attempts = (g.__loginAttempts ??= new Map<string, Counter>());

function isLocked(key: string, max: number, now: number): boolean {
  const entry = attempts.get(key);
  return Boolean(entry && entry.resetAt > now && entry.count >= max);
}

function registerFailure(key: string, now: number) {
  const entry = attempts.get(key);
  const current = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + WINDOW_MS };
  current.count += 1;
  attempts.set(key, current);
}

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "El acceso no está configurado en el servidor (AUTH_SECRET)." },
      { status: 500 }
    );
  }

  const ip = getClientIp(request);
  const now = Date.now();

  let email = "";
  let password = "";
  try {
    const body = await request.json();
    email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    // cuerpo inválido -> credenciales vacías
  }

  const ipKey = `ip:${ip}`;
  const emailKey = `email:${email}`;
  if (isLocked(ipKey, MAX_PER_IP, now) || isLocked(emailKey, MAX_PER_EMAIL, now)) {
    await writeAudit({ actor: email || "anónimo", action: "Intento bloqueado por exceso de fallos", ip });
    return NextResponse.json(
      { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." },
      { status: 429 }
    );
  }

  await ensureSeedUser();

  const user = email ? await findUserByEmail(email) : undefined;
  // Siempre se calcula un hash (aunque el correo no exista) para no revelar qué cuentas existen
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));

  if (!user || !user.active || !passwordOk) {
    registerFailure(ipKey, now);
    registerFailure(emailKey, now);
    await writeAudit({
      actor: email || "anónimo",
      action: user && !user.active && passwordOk ? "Login rechazado (usuario desactivado)" : "Login fallido",
      ip,
    });
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  attempts.delete(ipKey);
  attempts.delete(emailKey);

  await mutateUsers((users) => {
    const target = users.find((u) => u.id === user.id);
    if (target) target.lastLoginAt = new Date().toISOString();
  });
  await writeAudit({ actor: user.email, actorName: user.name, action: "Inicio de sesión", ip });

  const token = await createSessionToken(user.id, user.sessionVersion);
  const response = NextResponse.json({ ok: true, mustChangePassword: user.mustChangePassword });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
