// Almacén de usuarios del personal y bitácora (solo Node: usa fs y crypto).
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { promisify } from "util";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { Role, isRole } from "@/lib/permissions";

const scrypt = promisify(crypto.scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const DATA_DIR = path.join(process.cwd(), "src", "data");
const USERS_FILE = path.join(DATA_DIR, "admin-users.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit-log.json");
const MAX_AUDIT_ENTRIES = 3000;

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  active: boolean;
  mustChangePassword: boolean;
  sessionVersion: number;
  createdAt: string;
  lastLoginAt?: string;
};

export type PublicStaffUser = Omit<StaffUser, "passwordHash">;

export function toPublicUser(user: StaffUser): PublicStaffUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = user;
  return rest;
}

// ---------------------------------------------------------------------------
// Escritura serializada y atómica (evita archivos corruptos con peticiones simultáneas)
// ---------------------------------------------------------------------------
const g = globalThis as unknown as { __staffWriteQueue?: Promise<unknown> };

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const prev = g.__staffWriteQueue ?? Promise.resolve();
  const next = prev.then(task, task);
  g.__staffWriteQueue = next.catch(() => undefined);
  return next;
}

async function atomicWrite(file: string, content: string) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, content, { encoding: "utf-8", mode: 0o600 });
  await fs.rename(tmp, file);
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
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
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
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

export async function listUsers(): Promise<StaffUser[]> {
  const data = await readJson<{ users?: StaffUser[] }>(USERS_FILE, {});
  return Array.isArray(data.users) ? data.users.filter((u) => isRole(u.role)) : [];
}

/** Modifica la lista de usuarios de forma segura (lectura + escritura serializadas). */
export function mutateUsers<T>(fn: (users: StaffUser[]) => T | Promise<T>): Promise<T> {
  return enqueue(async () => {
    const users = await listUsers();
    const result = await fn(users);
    await atomicWrite(USERS_FILE, JSON.stringify({ users }, null, 2));
    return result;
  });
}

export async function findUserById(id: string): Promise<StaffUser | undefined> {
  return (await listUsers()).find((u) => u.id === id);
}

export async function findUserByEmail(email: string): Promise<StaffUser | undefined> {
  const e = normalizeEmail(email);
  return (await listUsers()).find((u) => u.email === e);
}

export function newUserId(): string {
  return "u_" + crypto.randomBytes(8).toString("hex");
}

/**
 * Primer arranque: si no hay usuarios, crea el superadmin con ADMIN_EMAIL / ADMIN_PASSWORD.
 * Se le obliga a cambiar la contraseña en su primer ingreso. Después .env ya no se usa para entrar.
 */
export async function ensureSeedUser(): Promise<void> {
  const email = process.env.ADMIN_EMAIL && normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || !isValidEmail(email)) return;
  if ((await listUsers()).length > 0) return;
  const passwordHash = await hashPassword(password);
  await mutateUsers((users) => {
    if (users.length > 0) return;
    users.push({
      id: newUserId(),
      name: "Administrador",
      email,
      role: "superadmin",
      passwordHash,
      active: true,
      mustChangePassword: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
    });
  });
  await writeAudit({ actor: "sistema", action: "Primer superadmin creado desde configuración", detail: email });
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
  const token = match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : undefined;
  return getUserFromToken(token);
}

/** Cuenta cuántos superadmins activos hay (siempre debe quedar al menos uno). */
export function countActiveSuperadmins(users: StaffUser[]): number {
  return users.filter((u) => u.role === "superadmin" && u.active).length;
}

// ---------------------------------------------------------------------------
// Bitácora de auditoría
// ---------------------------------------------------------------------------
export type AuditEntry = {
  id: string;
  at: string;
  actor: string; // correo o "sistema" / "anónimo"
  actorName?: string;
  action: string;
  detail?: string;
  ip?: string;
};

export function writeAudit(entry: Omit<AuditEntry, "id" | "at">): Promise<void> {
  return enqueue(async () => {
    const list = await readJson<AuditEntry[]>(AUDIT_FILE, []);
    list.push({
      id: crypto.randomBytes(6).toString("hex"),
      at: new Date().toISOString(),
      ...entry,
      detail: entry.detail?.slice(0, 300),
    });
    const trimmed = list.length > MAX_AUDIT_ENTRIES ? list.slice(-MAX_AUDIT_ENTRIES) : list;
    await atomicWrite(AUDIT_FILE, JSON.stringify(trimmed, null, 2));
  }).catch(() => undefined);
}

export async function readAudit(limit = 300): Promise<AuditEntry[]> {
  const list = await readJson<AuditEntry[]>(AUDIT_FILE, []);
  return list.slice(-limit).reverse();
}

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
