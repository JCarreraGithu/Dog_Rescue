import { prisma } from "@/lib/db";
import { normalizeRefugeName } from "@/lib/refuge-name";
import { object, IntakeError } from "@/lib/intake-validation";
import { stringField, imageUrl, nonemptyPatch } from "@/lib/admin-validation";
export type AboutSettings = { heroImage: string; heroBadgeText: string; heroCaptionTitle: string; heroCaptionSubtitle: string };
export const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  heroImage: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1000",
  heroBadgeText: "Amor animalista desde 2020", heroCaptionTitle: "DOG rescue Guatemala", heroCaptionSubtitle: "Salvando vidas con amor y dignidad",
};
export function aboutInput(input: unknown) {
  const source = object(input), patch: Partial<AboutSettings> = {};
  for (const [key, value] of Object.entries(source)) {
    if (!Object.hasOwn(DEFAULT_ABOUT_SETTINGS, key)) throw new IntakeError("Campo de Conócenos desconocido.");
    patch[key as keyof AboutSettings] = key === "heroImage" ? imageUrl(value) : normalizeRefugeName(stringField(value, true));
  }
  nonemptyPatch(patch); return patch;
}
function view(row: AboutSettings): AboutSettings { return { heroImage: row.heroImage, heroBadgeText: normalizeRefugeName(row.heroBadgeText), heroCaptionTitle: normalizeRefugeName(row.heroCaptionTitle), heroCaptionSubtitle: normalizeRefugeName(row.heroCaptionSubtitle) }; }
export async function getAboutSettings(): Promise<AboutSettings> {
  const row = await prisma.aboutSettings.findUnique({ where: { id: "about" } });
  return view(row ?? DEFAULT_ABOUT_SETTINGS);
}
export async function saveAboutSettings(input: unknown): Promise<AboutSettings> {
  const patch = aboutInput(input);
  return view(await prisma.aboutSettings.upsert({ where: { id: "about" }, create: { id: "about", ...DEFAULT_ABOUT_SETTINGS, ...patch }, update: patch }));
}
