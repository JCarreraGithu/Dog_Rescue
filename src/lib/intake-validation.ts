export class IntakeError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function object(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new IntakeError("Datos de formulario inválidos.");
  return input as Record<string, unknown>;
}
export async function body(request: Request) { return object(await request.json().catch(() => null)); }
export function text(value: unknown, fallback = ""): string { return typeof value === "string" ? value.trim() : fallback; }
export function id(value: unknown): string {
  const result = text(value);
  if (!result || result.length > 200) throw new IntakeError("Falta un ID válido.");
  return result;
}
export function age(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 18 || value > 120) throw new IntakeError("La edad debe estar entre 18 y 120 años.");
  return value;
}
export function choice(value: unknown, options: readonly string[]): string {
  if (typeof value !== "string" || !options.includes(value)) throw new IntakeError("Estado u opción no válida.");
  return value;
}
export const APPLICATION_STATUSES = ["Pendiente", "En Evaluación", "Aprobado", "Rechazado"];
export const ORDER_STATUSES = ["Pendiente", "En Preparación", "Enviado (Cargo Expreso)", "Listo para Recoger", "Entregado", "Cancelado"];
export const REPORT_STATUSES = ["Recibido", "En Revisión", "En Camino / Verificando", "Rescatado", "Caso Cerrado", "Cerrado", "Descartado"];
export const URGENCIES = ["Baja", "Media", "Alta", "Crítica"];
export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const AREAS = ["Rescate y Logística en Campo", "Cuidados en Refugio", "Venta de Paletas y Productos Solidarios", "Venta de Playeras y Merch Oficial", "Redes Sociales y Difusión", "Casas Cuna / Hogar Temporal"];
export const COMMITMENTS = ["Fines de semana", "Al menos 3 meses", "6 meses o más"];
