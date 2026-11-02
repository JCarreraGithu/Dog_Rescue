import type { Role } from "@/lib/permissions";

// Contrato JSON que consume el panel; los timestamps se serializan en ISO UTC.
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

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  actorName?: string;
  action: string;
  detail?: string;
  ip?: string;
};
