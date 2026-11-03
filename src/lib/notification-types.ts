export const NOTIFICATION_TYPES = ["adoption", "order", "volunteer", "case_report", "system"] as const;
export const NOTIFICATION_TARGETS = ["applications", "store", "volunteers", "dogs", "case-reports", "notifications"] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];
export type AdminNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetTab: typeof NOTIFICATION_TARGETS[number];
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
};
