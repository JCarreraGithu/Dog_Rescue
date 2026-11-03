import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HomeHeroSettings, DEFAULT_HOME_HERO_SETTINGS } from "./home-settings-client";
import { validateHomeSettings } from "@/lib/content-validation";
export * from "./home-settings-client";

type SettingsClient = Pick<Prisma.TransactionClient, "homeSettings">;
export const HOME_SETTINGS_ID = "home";

function publicSettings(row: HomeHeroSettings): HomeHeroSettings {
  return { badgeText: row.badgeText, mottoPart1: row.mottoPart1, mottoHighlight: row.mottoHighlight, description: row.description, button1Text: row.button1Text, button2Text: row.button2Text, fontFamily: row.fontFamily, fontWeight: row.fontWeight, fontStyle: row.fontStyle, textTransform: row.textTransform, fontSize: row.fontSize, highlightColor: row.highlightColor, textAlignment: row.textAlignment };
}

export async function getHomeHeroSettings(client: SettingsClient = prisma): Promise<HomeHeroSettings> {
  const row = await client.homeSettings.findUnique({ where: { id: HOME_SETTINGS_ID } });
  // Predeterminados solo si nunca se ha guardado; los errores de BD se propagan.
  if (!row) return { ...DEFAULT_HOME_HERO_SETTINGS };
  return publicSettings(validateHomeSettings(publicSettings(row as HomeHeroSettings)) as HomeHeroSettings);
}

export async function saveHomeHeroSettings(input: unknown, client: SettingsClient = prisma): Promise<HomeHeroSettings> {
  const patch = validateHomeSettings(input);
  // update aplica solo los campos enviados; no pierde cambios parciales concurrentes.
  const row = await client.homeSettings.upsert({ where: { id: HOME_SETTINGS_ID }, create: { id: HOME_SETTINGS_ID, ...DEFAULT_HOME_HERO_SETTINGS, ...patch }, update: patch });
  return publicSettings(row as HomeHeroSettings);
}
