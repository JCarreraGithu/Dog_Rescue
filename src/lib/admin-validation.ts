import { IntakeError, object } from "@/lib/intake-validation";
export function stringField(value: unknown, required = false): string {
  if (typeof value !== "string" || value.length > 100000 || (required && !value.trim())) throw new IntakeError("Texto inválido o vacío.");
  return value.trim();
}
export function numberField(value: unknown, integer = false): number {
  if ((typeof value !== "number" && typeof value !== "string") || value === "") throw new IntakeError("Cantidad inválida.");
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 2147483647 || (integer && !Number.isInteger(n))) throw new IntakeError("Cantidad inválida.");
  return n;
}
export function booleanField(value: unknown): boolean {
  if (typeof value !== "boolean") throw new IntakeError("Opción inválida.");
  return value;
}
export function dateField(value: unknown): Date {
  const date = new Date(stringField(value, true));
  if (!Number.isFinite(date.getTime())) throw new IntakeError("Fecha inválida.");
  return date;
}
export function imageUrl(value: unknown): string {
  const url = stringField(value);
  if (url && !/^https?:\/\//i.test(url) && !/^\/(?!\/)/.test(url)) throw new IntakeError("URL de fotografía inválida.");
  return url;
}
export function stringList(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 200) throw new IntakeError("Lista inválida.");
  return value.map(item => stringField(item));
}
export function nonemptyPatch(data: object) { if (!Object.keys(data).length) throw new IntakeError("No hay cambios válidos."); }
export { object };
