import fs from "fs/promises";
import path from "path";
import { normalizeRefugeName } from "@/lib/refuge-name";

export type AboutSettings = {
  heroImage: string;
  heroBadgeText: string;
  heroCaptionTitle: string;
  heroCaptionSubtitle: string;
};

export const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  heroImage:
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1000",
  heroBadgeText: "Amor animalista desde 2020",
  heroCaptionTitle: "DOG rescue Guatemala",
  heroCaptionSubtitle: "Salvando vidas con amor y dignidad",
};

const SETTINGS_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "about-settings.json"
);

export async function getAboutSettings(): Promise<AboutSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        heroImage:
          typeof parsed.heroImage === "string" && parsed.heroImage.trim()
            ? parsed.heroImage.trim()
            : DEFAULT_ABOUT_SETTINGS.heroImage,
        heroBadgeText:
          typeof parsed.heroBadgeText === "string" && parsed.heroBadgeText.trim()
            ? normalizeRefugeName(parsed.heroBadgeText.trim())
            : DEFAULT_ABOUT_SETTINGS.heroBadgeText,
        heroCaptionTitle:
          typeof parsed.heroCaptionTitle === "string" &&
          parsed.heroCaptionTitle.trim()
            ? normalizeRefugeName(parsed.heroCaptionTitle.trim())
            : DEFAULT_ABOUT_SETTINGS.heroCaptionTitle,
        heroCaptionSubtitle:
          typeof parsed.heroCaptionSubtitle === "string" &&
          parsed.heroCaptionSubtitle.trim()
            ? normalizeRefugeName(parsed.heroCaptionSubtitle.trim())
            : DEFAULT_ABOUT_SETTINGS.heroCaptionSubtitle,
      };
    }
  } catch {
    // Fallback al valor por defecto
  }
  return DEFAULT_ABOUT_SETTINGS;
}

export async function saveAboutSettings(
  settings: AboutSettings
): Promise<AboutSettings> {
  settings = {
    ...settings,
    heroBadgeText: normalizeRefugeName(settings.heroBadgeText),
    heroCaptionTitle: normalizeRefugeName(settings.heroCaptionTitle),
    heroCaptionSubtitle: normalizeRefugeName(settings.heroCaptionSubtitle),
  };
  await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  return settings;
}
