// Autenticación simple para el panel del refugio.
// Usa Web Crypto (funciona en middleware/Edge y en rutas Node), sin dependencias extra.
//
// Variables de entorno necesarias (en .env local y en Render):
//   ADMIN_PASSWORD  -> contraseña del personal del refugio
//   AUTH_SECRET     -> texto largo y aleatorio (32+ caracteres) para firmar la sesión

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
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toHex(sig);
}

// Comparación en tiempo constante (evita filtrar información por tiempos de respuesta)
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256Hex(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16);
}

/** Verifica la contraseña ingresada contra ADMIN_PASSWORD. */
export async function checkPassword(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !input) return false;
  // Se comparan hashes para que la longitud de la contraseña no se filtre.
  const [a, b] = await Promise.all([sha256Hex(input), sha256Hex(expected)]);
  return safeEqual(a, b);
}

/** Crea un token firmado con fecha de expiración: "<expiraEnMs>.<firma>" */
export async function createSessionToken(): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no está configurado");
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const sig = await hmacHex(secret, String(exp));
  return `${exp}.${sig}`;
}

/** Valida firma y vigencia del token. Si algo falla o falta configuración, devuelve false. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await hmacHex(secret, expStr);
  return safeEqual(sig, expected);
}
