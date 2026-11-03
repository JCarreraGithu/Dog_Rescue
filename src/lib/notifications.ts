import type { Notification, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ContentValidationError, NotificationNotFoundError } from "@/lib/content-validation";
import { NOTIFICATION_TYPES, NOTIFICATION_TARGETS } from "@/lib/notification-types";
import type { AdminNotification } from "@/lib/notification-types";
export type { AdminNotification, NotificationType } from "@/lib/notification-types";

type NotificationClient = Pick<Prisma.TransactionClient, "notification">;

function toNotification(row: Notification): AdminNotification {
  if (!(NOTIFICATION_TYPES as readonly string[]).includes(row.type) || !(NOTIFICATION_TARGETS as readonly string[]).includes(row.targetTab)) {
    throw new Error("La notificación almacenada no es válida.");
  }
  if (row.metadata !== null && (typeof row.metadata !== "object" || Array.isArray(row.metadata))) throw new Error("Metadatos no válidos.");
  return { ...row, type: row.type as AdminNotification["type"], targetTab: row.targetTab as AdminNotification["targetTab"], createdAt: row.createdAt.toISOString(), metadata: row.metadata ?? undefined };
}

export async function getNotifications(client: NotificationClient = prisma): Promise<AdminNotification[]> {
  const rows = await client.notification.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 200 });
  return rows.map(toNotification);
}

// Inserción individual: nunca reescribe la lista ni restaura JSON después de borrar.
export async function addNotification(input: {
  type: AdminNotification["type"];
  title: string;
  message: string;
  targetTab: AdminNotification["targetTab"];
  metadata?: Record<string, unknown>;
}, client: NotificationClient = prisma): Promise<AdminNotification> {
  if (!(NOTIFICATION_TYPES as readonly string[]).includes(input.type) || !(NOTIFICATION_TARGETS as readonly string[]).includes(input.targetTab) || typeof input.title !== "string" || typeof input.message !== "string") {
    throw new ContentValidationError("Notificación no válida.");
  }
  const metadata = input.metadata === undefined ? undefined : JSON.parse(JSON.stringify(input.metadata)) as Prisma.InputJsonObject;
  const row = await client.notification.create({ data: { ...input, metadata } });
  return toNotification(row);
}

export async function markNotificationsRead(id?: string): Promise<AdminNotification[]> {
  return prisma.$transaction(async (tx) => {
    const result = await tx.notification.updateMany({ where: id ? { id } : {}, data: { read: true } });
    if (id && result.count === 0) throw new NotificationNotFoundError("Notificación no encontrada.");
    return getNotifications(tx);
  });
}

export async function deleteNotifications(id?: string): Promise<AdminNotification[]> {
  return prisma.$transaction(async (tx) => {
    const result = await tx.notification.deleteMany({ where: id ? { id } : {} });
    if (id && result.count === 0) throw new NotificationNotFoundError("Notificación no encontrada.");
    return getNotifications(tx);
  });
}
