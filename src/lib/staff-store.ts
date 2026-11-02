// Almacén administrativo persistente en PostgreSQL. No hay fallback a JSON.
import crypto from "crypto";
import { promisify } from "util";
import type { StaffUser as DbStaffUser } from "@prisma/client";
import { prisma } from "@/lib/db";
import { withStaffTransaction } from "@/lib/staff-transaction";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import type { StaffUser, AuditEntry } from "@/lib/staff-types";
export type { StaffUser, AuditEntry } from "@/lib/staff-types";

const scrypt = promisify(crypto.scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

export type PublicStaffUser = Omit<StaffUser, "passwordHash">;

export function toPublicUser(user: StaffUser): PublicStaffUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = user;
  return rest;
}

// ---------------------------------------------------------------------------
// Contraseñas (scrypt con sal aleatoria)
// ---------------------------------------------------------------------------
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/i.test(stored)) return false;
  const [, saltHex, hashHex] = stored.split("$");
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// Hash de relleno: se usa cuando el correo no existe, para que el tiempo de respuesta sea igual.
let dummyHashPromise: Promise<string> | null = null;
export function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword(crypto.randomBytes(12).toString("hex"));
  return dummyHashPromise;
}

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 120;
}

function fromDb(user: DbStaffUser): StaffUser {
  return { ...user, createdAt: user.createdAt.toISOString(), lastLoginAt: user.lastLoginAt?.toISOString() };
}

export async function listUsers(): Promise<StaffUser[]> {
  return (await prisma.staffUser.findMany({ orderBy: { createdAt: "asc" } })).map(fromDb);
}

/** Serializa mutaciones del personal entre procesos; no toca modelos del refugio. */
export async function mutateUsers<T>(fn: (users: StaffUser[]) => T | Promise<T>, options?: {
  actor?: StaffUser;
  superadmin?: boolean;
  audit?: (result: T) => Omit<AuditEntry, "id" | "at"> | null;
}): Promise<T> {
  return withStaffTransaction(async (tx) => {
    const original = (await tx.staffUser.findMany()).map(fromDb);
    if (options?.actor) {
      const current = original.find((u) => u.id === options.actor?.id);
      if (!current || !current.active || current.sessionVersion !== options.actor.sessionVersion || current.role !== options.actor.role ||
        (options.superadmin && (current.role !== "superadmin" || current.mustChangePassword))) {
        throw new Error("La autorización cambió durante la operación.");
      }
    }
    const users = structuredClone(original);
    const result = await fn(users);
    const ids = new Set(users.map((u) => u.id));
    for (const before of original) {
      if (!ids.has(before.id)) await tx.staffUser.delete({ where: { id: before.id } });
    }
    for (const user of users) {
      const before = original.find((u) => u.id === user.id);
      if (before && JSON.stringify(before) === JSON.stringify(user)) continue;
      const data = { ...user, createdAt: new Date(user.createdAt), lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null };
      if (before) await tx.staffUser.update({ where: { id: user.id }, data });
      else await tx.staffUser.create({ data });
    }
    const audit = options?.audit?.(result);
    if (audit) await tx.auditLog.create({ data: { ...audit, detail: audit.detail?.slice(0, 300) } });
    return result;
  });
}

export async function findUserById(id: string): Promise<StaffUser | undefined> {
  const user = await prisma.staffUser.findUnique({ where: { id } });
  return user ? fromDb(user) : undefined;
}

export async function findUserByEmail(email: string): Promise<StaffUser | undefined> {
  const user = await prisma.staffUser.findUnique({ where: { email: normalizeEmail(email) } });
  return user ? fromDb(user) : undefined;
}

export function newUserId(): string {
  return "u_" + crypto.randomBytes(8).toString("hex");
}

/** Usuario dueño de la sesión de la petición (o null si no hay sesión válida / está desactivado). */
export async function getUserFromToken(token: string | undefined | null): Promise<StaffUser | null> {
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const user = await findUserById(payload.userId);
  if (!user || !user.active || user.sessionVersion !== payload.version) return null;
  return user;
}

export function getUserFromRequest(request: Request): Promise<StaffUser | null> {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  let token: string | undefined;
  try { token = match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : undefined; }
  catch { return Promise.resolve(null); }
  return getUserFromToken(token);
}

/** Cuenta cuántos superadmins activos hay (siempre debe quedar al menos uno). */
export function countActiveSuperadmins(users: StaffUser[]): number {
  return users.filter((u) => u.role === "superadmin" && u.active).length;
}

export async function writeAudit(entry: Omit<AuditEntry, "id" | "at">): Promise<void> {
  try {
    await prisma.auditLog.create({ data: { ...entry, detail: entry.detail?.slice(0, 300) } });
  } catch {
    // Mensaje fijo, nunca errores Prisma que pudieran contener parámetros privados.
    throw new Error("No se pudo registrar la auditoría administrativa.");
  }
}

export async function readAudit(limit = 300): Promise<AuditEntry[]> {
  const rows = await prisma.auditLog.findMany({ orderBy: { at: "desc" }, take: Math.min(Math.max(limit, 1), 3000) });
  return rows.map((row) => ({ ...row, at: row.at.toISOString(), actorName: row.actorName ?? undefined, detail: row.detail ?? undefined, ip: row.ip ?? undefined }));
}

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
