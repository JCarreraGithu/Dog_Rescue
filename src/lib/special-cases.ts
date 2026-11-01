import fs from "fs/promises";
import path from "path";
import {
  DEFAULT_IMPACT_CASES,
  ImpactCase,
  SpecialCaseStatus,
} from "@/data/impact-cases";

const CASES_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "special-cases.json"
);

const VALID_STATUSES: SpecialCaseStatus[] = [
  "Rehabilitado y Adoptado",
  "Caso Éxito",
  "En Rehabilitación",
  "En Adopción",
];

export function sanitizeCaseStatus(val: unknown): SpecialCaseStatus {
  if (
    typeof val === "string" &&
    VALID_STATUSES.includes(val as SpecialCaseStatus)
  ) {
    return val as SpecialCaseStatus;
  }
  return "Caso Éxito";
}

export async function getSpecialCases(): Promise<ImpactCase[]> {
  try {
    const raw = await fs.readFile(CASES_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fallback al listado por defecto
  }
  return DEFAULT_IMPACT_CASES;
}

export async function saveSpecialCases(cases: ImpactCase[]): Promise<void> {
  await fs.mkdir(path.dirname(CASES_FILE), { recursive: true });
  await fs.writeFile(CASES_FILE, JSON.stringify(cases, null, 2), "utf-8");
}
