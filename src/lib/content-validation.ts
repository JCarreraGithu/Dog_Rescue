import type { HomeHeroSettings } from "@/lib/home-settings-client";
import { normalizeRefugeName } from "./refuge-name";

export class ContentValidationError extends Error {}
export class NotificationNotFoundError extends Error {}

const options = {
  fontFamily: ["sans", "montserrat", "serif", "fredoka", "caveat", "oswald"],
  fontWeight: ["normal", "semibold", "bold", "black"],
  fontStyle: ["normal", "italic"],
  textTransform: ["none", "uppercase", "capitalize"],
  fontSize: ["large", "extra", "giant"],
  highlightColor: ["sky", "emerald", "amber", "rose", "white", "gradient-cyan", "gradient-gold"],
  textAlignment: ["left", "center"],
};
const textLimits = { badgeText: 500, mottoPart1: 1000, mottoHighlight: 1000, description: 10000, button1Text: 200, button2Text: 200 };

export function validateHomeSettings(input: unknown): Partial<HomeHeroSettings> {
  if (!input || typeof input !== "object" || Array.isArray(input) || !Object.keys(input).length) {
    throw new ContentValidationError("La configuración debe ser un objeto con campos del lema.");
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== "string") throw new ContentValidationError(`Valor no válido para ${key}.`);
    if (Object.hasOwn(options, key)) {
      if (!(options[key as keyof typeof options] as string[]).includes(value)) throw new ContentValidationError(`Opción no válida para ${key}.`);
    } else if (Object.hasOwn(textLimits, key)) {
      if (value.length > textLimits[key as keyof typeof textLimits]) throw new ContentValidationError(`Texto demasiado largo para ${key}.`);
      if (["badgeText", "button1Text", "button2Text"].includes(key) && !value.trim()) throw new ContentValidationError(`El campo ${key} no puede estar vacío.`);
    } else {
      throw new ContentValidationError("La configuración contiene un campo desconocido.");
    }
    result[key] = Object.hasOwn(textLimits, key) ? normalizeRefugeName(value) : value;
  }
  return result as Partial<HomeHeroSettings>;
}
