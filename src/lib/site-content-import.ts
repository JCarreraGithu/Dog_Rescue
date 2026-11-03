import type { PrismaClient, Prisma } from "@prisma/client";
import { validateHomeSettings } from "./content-validation";
import { DEFAULT_HOME_HERO_SETTINGS } from "./home-settings-client";
import { NOTIFICATION_TYPES, NOTIFICATION_TARGETS } from "./notification-types";
import type { AdminNotification } from "./notification-types";

export class SiteContentImportError extends Error {}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => JSON.stringify(key) + ':' + canonicalJson(entry)).join(',') + '}';
  return JSON.stringify(value) ?? 'null';
}

export function validateSiteContent(home: unknown, notifications: unknown) {
  const settings = { ...DEFAULT_HOME_HERO_SETTINGS, ...validateHomeSettings(home) };
  if (!Array.isArray(notifications)) throw new SiteContentImportError("La lista de notificaciones no es válida.");
  const ids = new Set();
  const list = notifications.map((row, index) => {
    const fail = () => { throw new SiteContentImportError(`Notificación ${index + 1}: estructura no válida.`); };
    if (!row || typeof row !== "object" || Array.isArray(row)) return fail();
    if (Object.keys(row).some(key => !['id', 'type', 'title', 'message', 'targetTab', 'read', 'createdAt', 'metadata'].includes(key))) return fail();
    if (typeof row.id !== "string" || !row.id || ids.has(row.id) || !NOTIFICATION_TYPES.includes(row.type) || !NOTIFICATION_TARGETS.includes(row.targetTab)) return fail();
    if (typeof row.title !== "string" || typeof row.message !== "string" || typeof row.read !== "boolean" || typeof row.createdAt !== "string" || !Number.isFinite(Date.parse(row.createdAt)) || new Date(row.createdAt).toISOString() !== row.createdAt) return fail();
    if (row.metadata !== undefined && (!row.metadata || typeof row.metadata !== "object" || Array.isArray(row.metadata))) return fail();
    ids.add(row.id);
    return row as AdminNotification;
  });
  return { settings, notifications: list };
}

// Herramienta explícita de traslado; jamás se ejecuta durante lecturas o recargas.
export async function importSiteContent(client: PrismaClient, home: unknown, notifications: unknown, apply = false) {
  const input = validateSiteContent(home, notifications);
  try {
    return await client.$transaction(async tx => {
      await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(74190218)`;
      const existing = await tx.homeSettings.findUnique({ where: { id: "home" } });
      if (existing && Object.entries(input.settings).some(([key, value]) => existing[key as keyof typeof input.settings] !== value)) throw new Error("Conflicto de configuración.");
      const rows = await tx.notification.findMany({ where: { id: { in: input.notifications.map(n => n.id) } } });
      const pending = [];
      for (const notification of input.notifications) {
        const row = rows.find(n => n.id === notification.id);
        if (!row) { pending.push(notification); continue; }
        const same = row.type === notification.type && row.title === notification.title && row.message === notification.message && row.targetTab === notification.targetTab && row.read === notification.read && row.createdAt.toISOString() === notification.createdAt && canonicalJson(row.metadata ?? null) === canonicalJson(notification.metadata ?? null);
        if (!same) throw new Error("Conflicto de notificaciones.");
      }
      if (apply) {
        if (!existing) await tx.homeSettings.create({ data: { id: "home", ...input.settings } });
        for (const n of pending) await tx.notification.create({ data: { ...n, createdAt: new Date(n.createdAt), metadata: n.metadata as Prisma.InputJsonObject | undefined } });
      }
      return { settingsPending: !existing, notificationsPending: pending.length, unchangedNotifications: rows.length, inserted: apply ? pending.length : 0, applied: apply };
    });
  } catch { throw new SiteContentImportError("Traslado cancelado por conflicto o fallo de base de datos. No se sobrescribieron datos."); }
}
