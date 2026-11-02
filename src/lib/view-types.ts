import type { AdoptionApplication, CaseReport, MedicalRecord, Volunteer, InventoryItem } from "@prisma/client";

type JsonDates<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K] };
export type MedicalRecordView = Omit<JsonDates<MedicalRecord>, "dogId" | "createdAt"> & { dogId?: string; createdAt?: string };
export type AdoptionView = Omit<JsonDates<AdoptionApplication>, "updatedAt" | "evaluatorNotes" | "applicantEmail" | "applicantAddress" | "homeType" | "hasYard" | "hasOtherPets"> & {
  updatedAt?: string; evaluatorNotes?: string | null;
  applicantEmail?: string; applicantAddress?: string; homeType?: string; hasYard?: boolean; hasOtherPets?: boolean;
  dog?: { id?: string; name: string; photoUrl?: string } | null;
};
export type VolunteerView = Omit<JsonDates<Volunteer>, "email" | "saturdayDate" | "assignedTask" | "evaluatorNotes" | "municipality"> & {
  email?: string; saturdayDate?: string; assignedTask?: string; evaluatorNotes?: string | null; municipality?: string | null;
};
export type CaseReportView = JsonDates<CaseReport> & { photos?: string[]; adminNotes?: string; location?: string; urgency?: string };
export type InventoryView = JsonDates<InventoryItem>;
export type TransparencyView = { id: string; key: string; value: number; label: string };
export type AdminTab = "notifications" | "dogs" | "case-reports" | "agenda" | "applications" | "inventory" | "volunteers" | "store" | "special-cases" | "hero-settings" | "transparency" | "reports" | "team" | "audit";
