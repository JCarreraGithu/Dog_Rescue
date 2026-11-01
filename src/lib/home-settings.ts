import fs from "fs/promises";
import path from "path";
import {
  HomeHeroSettings,
  DEFAULT_HOME_HERO_SETTINGS,
} from "./home-settings-client";

export * from "./home-settings-client";

const SETTINGS_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "home-settings.json"
);

export async function getHomeHeroSettings(): Promise<HomeHeroSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        badgeText:
          typeof parsed.badgeText === "string" && parsed.badgeText.trim()
            ? parsed.badgeText.trim()
            : DEFAULT_HOME_HERO_SETTINGS.badgeText,
        mottoPart1:
          typeof parsed.mottoPart1 === "string"
            ? parsed.mottoPart1
            : DEFAULT_HOME_HERO_SETTINGS.mottoPart1,
        mottoHighlight:
          typeof parsed.mottoHighlight === "string"
            ? parsed.mottoHighlight
            : DEFAULT_HOME_HERO_SETTINGS.mottoHighlight,
        description:
          typeof parsed.description === "string"
            ? parsed.description
            : DEFAULT_HOME_HERO_SETTINGS.description,
        button1Text:
          typeof parsed.button1Text === "string" && parsed.button1Text.trim()
            ? parsed.button1Text.trim()
            : DEFAULT_HOME_HERO_SETTINGS.button1Text,
        button2Text:
          typeof parsed.button2Text === "string" && parsed.button2Text.trim()
            ? parsed.button2Text.trim()
            : DEFAULT_HOME_HERO_SETTINGS.button2Text,

        fontFamily: parsed.fontFamily || DEFAULT_HOME_HERO_SETTINGS.fontFamily,
        fontWeight: parsed.fontWeight || DEFAULT_HOME_HERO_SETTINGS.fontWeight,
        fontStyle: parsed.fontStyle || DEFAULT_HOME_HERO_SETTINGS.fontStyle,
        textTransform:
          parsed.textTransform || DEFAULT_HOME_HERO_SETTINGS.textTransform,
        fontSize: parsed.fontSize || DEFAULT_HOME_HERO_SETTINGS.fontSize,
        highlightColor:
          parsed.highlightColor || DEFAULT_HOME_HERO_SETTINGS.highlightColor,
        textAlignment:
          parsed.textAlignment || DEFAULT_HOME_HERO_SETTINGS.textAlignment,
      };
    }
  } catch {
    // Si no existe o falla, retornar default
  }
  return DEFAULT_HOME_HERO_SETTINGS;
}

export async function saveHomeHeroSettings(
  settings: Partial<HomeHeroSettings>
): Promise<HomeHeroSettings> {
  const current = await getHomeHeroSettings();
  const merged: HomeHeroSettings = {
    ...current,
    ...settings,
  };

  await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}
