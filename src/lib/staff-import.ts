import type { PrismaClient, Prisma } from "@prisma/client";
import type { StaffUser } from "@/lib/staff-types";

const fields = ["id", "name", "email", "role", "passwordHash", "active", "mustChangePassword", "sessionVersion", "createdAt", "lastLoginAt"];
export class StaffImportError extends Error {}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function validDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

/** No normaliza ni corrige datos: los registros incompatibles requieren revisión privada. */
export function validateStaffImport(value: unknown): StaffUser[] {
  if (!record(value) || Object.keys(value).some((key) => key !== "users") || !Array.isArray(value.users) || value.users.length === 0) {
    throw new StaffImportError("Estructura de importación inválida.");
  }
  const ids = new Set<string>();
  const emails = new Set<string>();
  return value.users.map((user, index) => {
    const fail = () => { throw new StaffImportError(`Registro ${index + 1}: estructura, duplicado o dato no compatible.`); };
    if (!record(user) || Object.keys(user).some((key) => !fields.includes(key))) return fail();
    if (typeof user.id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(user.id) || ids.has(user.id)) return fail();
    if (typeof user.name !== "string" || !user.name.trim() || user.name.length > 200) return fail();
    if (typeof user.email !== "string" || user.email !== user.email.trim().toLowerCase() || user.email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(user.email) || emails.has(user.email)) return fail();
    if (typeof user.role !== "string" || !["superadmin", "editor", "voluntario"].includes(user.role)) return fail();
    if (typeof user.passwordHash !== "string" || !/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/i.test(user.passwordHash)) return fail();
    if (typeof user.active !== "boolean" || typeof user.mustChangePassword !== "boolean") return fail();
    if (typeof user.sessionVersion !== "number" || !Number.isInteger(user.sessionVersion) || user.sessionVersion < 0 || user.sessionVersion > 2147483647) return fail();
    if (!validDate(user.createdAt) || (user.lastLoginAt !== undefined && !validDate(user.lastLoginAt))) return fail();
    ids.add(user.id); emails.add(user.email);
    // Todos los campos fueron validados individualmente; no se escribe nada durante validación.
    return { ...user } as StaffUser;
  });
}

async function plan(tx: Prisma.TransactionClient, users: StaffUser[]) {
  const existing = await tx.staffUser.findMany({ where: { OR: [
    { id: { in: users.map((u) => u.id) } }, { email: { in: users.map((u) => u.email) } },
  ] } });
  const pending: StaffUser[] = [];
  let unchanged = 0;
  for (const [index, user] of users.entries()) {
    const matches = existing.filter((u) => u.id === user.id || u.email === user.email);
    if (matches.length === 0) { pending.push(user); continue; }
    const row = matches[0];
    const same = matches.length === 1 && fields.every((field) => {
      const key = field as keyof StaffUser;
      const actual = key === "createdAt" ? row.createdAt.toISOString() : key === "lastLoginAt" ? row.lastLoginAt?.toISOString() : row[key];
      return actual === user[key];
    });
    if (!same) throw new Error(`Registro ${index + 1}: conflicto con una cuenta existente; no se sobrescribió.`);
    unchanged++;
  }
  return { pending, unchanged };
}

/** apply=false consulta solamente; toda la importación es atómica y sin upsert/update. */
export async function importStaffUsers(client: PrismaClient, input: unknown, apply = false) {
  const users = validateStaffImport(input);
  try {
    return await client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(74190216)`;
      const { pending, unchanged } = await plan(tx, users);
      if (apply) {
        for (const user of pending) {
          await tx.staffUser.create({ data: { ...user, createdAt: new Date(user.createdAt), lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null } });
        }
        if (pending.length) await tx.auditLog.create({ data: {
          actor: "importador-local", action: "Importación de personal", detail: `${pending.length} cuentas nuevas; ${unchanged} sin cambios`,
        } });
      }
      return { total: users.length, pending: pending.length, unchanged, inserted: apply ? pending.length : 0 };
    }, { maxWait: 10000, timeout: 30000 });
  } catch {
    // No propagar errores Prisma (pueden contener parámetros, hashes o conexión).
    throw new StaffImportError("Importación cancelada: conflicto o fallo de base de datos. Ninguna cuenta fue sobrescrita.");
  }
}
