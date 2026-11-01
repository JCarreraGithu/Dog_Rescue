// Núcleo de sesiones del panel (solo Web Crypto: funciona en middleware y en rutas Node).
//
// Cada sesión es un token firmado con AUTH_SECRET:  "<userId>.<sessionVersion>.<expiraEnMs>.<firma>"
// - sessionVersion permite cerrar todas las sesiones de un usuario (cambio de clave, desactivación).
// - El rol y el estado activo NUNCA van en el token: se leen del almacén de usuarios en cada petición.
//
// Variables de entorno:
//   AUTH_SECRET          -> texto largo y aleatorio (32+ caracteres) para firmar las sesiones
//   ADMIN_SUBDOMAIN      -> subdominio exclusivo para administración (por defecto "interno")
//   ADMIN_ALLOWED_HOSTS  -> lista opcional separada por comas de dominios internos adicionales
//   ADMIN_LOGIN_PATH     -> ruta secreta del login (por defecto /portal-interno)
//   ADMIN_EMAIL / ADMIN_PASSWORD -> solo se usan UNA vez para crear el primer superadmin

export const SESSION_COOKIE = "refugio_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

// Comparación en tiempo constante
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isAuthConfigured(): boolean {
  const secret = process.env.AUTH_SECRET;
  return Boolean(secret && secret.length >= 32 && !secret.includes("pega-aqui"));
}

/** Subdominio exclusivo del panel (ej. "interno" -> interno.localhost:3000 o interno.tudominio.org). */
export function getAdminSubdomain(): string {
  const raw = (process.env.ADMIN_SUBDOMAIN || "interno").trim().toLowerCase();
  return raw.replace(/[^a-z0-9-]/g, "") || "interno";
}

/**
 * Verifica si la petición entra por el subdominio exclusivo de administración.
 * En el dominio público (ej. localhost:3000 o www.tudominio.org) devuelve false,
 * apagando por completo el login, el panel y las APIs administrativas.
 */
export function isAdminHost(hostHeader: string | null | undefined): boolean {
  if (!hostHeader) return false;
  const cleanHost = hostHeader.trim().toLowerCase();
  const hostnameOnly = cleanHost.split(":")[0];
  const sub = getAdminSubdomain();

  // 1. Subdominio directo: interno.localhost, interno.tudominio.org, etc.
  if (hostnameOnly.startsWith(`${sub}.`)) {
    return true;
  }

  // 2. Dominios internos explícitamente autorizados en ADMIN_ALLOWED_HOSTS
  const extra = (process.env.ADMIN_ALLOWED_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  return extra.some((allowed) => cleanHost === allowed || hostnameOnly === allowed);
}

/** Ruta secreta del login (siempre empieza con "/"). */
export function getLoginPath(): string {
  const raw = (process.env.ADMIN_LOGIN_PATH || "/portal-interno").trim();
  const normalized = "/" + raw.replace(/^\/+|\/+$/g, "");
  // Nunca permitir rutas reservadas del sitio
  if (/^\/(admin|api|_next|acceso)(\/|$)/.test(normalized) || normalized === "/") {
    return "/portal-interno";
  }
  return normalized;
}

export type SessionPayload = { userId: string; version: number };

export async function createSessionToken(userId: string, version: number): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no está configurado");
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const data = `${userId}.${version}.${exp}`;
  return `${data}.${await hmacHex(secret, data)}`;
}

/** Valida firma y vigencia. Devuelve el contenido o null. */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, versionStr, expStr, sig] = parts;
  const exp = Number(expStr);
  const version = Number(versionStr);
  if (!userId || !Number.isFinite(exp) || !Number.isInteger(version) || exp < Date.now()) return null;
  const expected = await hmacHex(secret, `${userId}.${versionStr}.${expStr}`);
  if (!safeEqual(sig, expected)) return null;
  return { userId, version };
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}
