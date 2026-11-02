import fs from "fs/promises";
import path from "path";

export type NotificationType =
  | "adoption"
  | "order"
  | "volunteer"
  | "case_report"
  | "system";

export type AdminNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetTab:
    | "applications"
    | "store"
    | "volunteers"
    | "dogs"
    | "case-reports"
    | "notifications";
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

const NOTIFICATIONS_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "admin-notifications.json"
);

export async function getNotifications(): Promise<AdminNotification[]> {
  try {
    const raw = await fs.readFile(NOTIFICATIONS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Si aún no existe el archivo, retornamos lista inicial vacía
  }
  return [];
}

export async function saveNotifications(
  list: AdminNotification[]
): Promise<void> {
  await fs.mkdir(path.dirname(NOTIFICATIONS_FILE), { recursive: true });
  await fs.writeFile(
    NOTIFICATIONS_FILE,
    JSON.stringify(list.slice(0, 200), null, 2),
    "utf-8"
  );
}

export async function addNotification(input: {
  type: NotificationType;
  title: string;
  message: string;
  targetTab: AdminNotification["targetTab"];
  metadata?: Record<string, unknown>;
}): Promise<AdminNotification> {
  const list = await getNotifications();
  const newNotif: AdminNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: input.type,
    title: input.title,
    message: input.message,
    targetTab: input.targetTab,
    read: false,
    createdAt: new Date().toISOString(),
    metadata: input.metadata,
  };
  await saveNotifications([newNotif, ...list]);
  return newNotif;
}
