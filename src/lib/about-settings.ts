import { prisma } from "@/lib/db";
import { normalizeRefugeName } from "@/lib/refuge-name";
import { object, IntakeError } from "@/lib/intake-validation";
import { stringField, imageUrl, nonemptyPatch } from "@/lib/admin-validation";
import { DEFAULT_FAMILY, ABOUT_STATIC_UPLOADS, type AboutContent, type AboutSlide, type Founder } from "@/lib/about-content";
export type AboutSettings = { heroImage: string; heroBadgeText: string; heroCaptionTitle: string; heroCaptionSubtitle: string };
export const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  heroImage: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1000",
  heroBadgeText: "Amor animalista desde 2020", heroCaptionTitle: "DOG rescue Guatemala", heroCaptionSubtitle: "Salvando vidas con amor y dignidad",
};
export function aboutInput(input: unknown) {
  const source = object(input), patch: Partial<AboutSettings> & Partial<AboutContent> = {};
  for (const [key, value] of Object.entries(source)) {
    if (key === "carousel") { patch.carousel = validateCarousel(value); continue; }
    if (key === "family") { patch.family = validateFamily(value); continue; }
    if (!Object.hasOwn(DEFAULT_ABOUT_SETTINGS, key)) throw new IntakeError("Campo de Conócenos desconocido.");
    patch[key as keyof AboutSettings] = key === "heroImage" ? imageUrl(value) : normalizeRefugeName(stringField(value, true));
  }
  nonemptyPatch(patch); return patch;
}
function view(row: AboutSettings & { carousel?: unknown; family?: unknown }): AboutSettings & AboutContent {
  const legacy = { id: "original", url: row.heroImage, title: row.heroCaptionTitle, subtitle: row.heroCaptionSubtitle, badge: row.heroBadgeText };
  return { heroImage: row.heroImage, heroBadgeText: normalizeRefugeName(row.heroBadgeText), heroCaptionTitle: normalizeRefugeName(row.heroCaptionTitle), heroCaptionSubtitle: normalizeRefugeName(row.heroCaptionSubtitle), carousel: row.carousel == null ? [legacy] : validateCarousel(row.carousel), family: row.family == null ? structuredClone(DEFAULT_FAMILY) : validateFamily(row.family) };
}
export async function getAboutSettings(): Promise<AboutSettings & AboutContent> {
  const row = await prisma.aboutSettings.findUnique({ where: { id: "about" } });
  return view(row ?? DEFAULT_ABOUT_SETTINGS);
}
export async function saveAboutSettings(input: unknown): Promise<AboutSettings & AboutContent> {
  const patch = aboutInput(input);
  return view(await prisma.aboutSettings.upsert({ where: { id: "about" }, create: { id: "about", ...DEFAULT_ABOUT_SETTINGS, ...patch }, update: patch }));
}

function photo(value: unknown): string {
  const url = imageUrl(value);
  if (url.startsWith("/uploads/") && !ABOUT_STATIC_UPLOADS.includes(url)) throw new IntakeError("La ruta /uploads no corresponde a un archivo publicado. Usa una URL persistente o una imagen ya cargada.");
  return url;
}
export function validateCarousel(value: unknown): AboutSlide[] {
  if (!Array.isArray(value) || value.length > 30) throw new IntakeError("El carrusel debe contener hasta 30 fotografías.");
  const ids = new Set<string>();
  return value.map(item => {
    const row = object(item), id = stringField(row.id, true), url = photo(row.url);
    if (!url || ids.has(id)) throw new IntakeError("Fotografía sin URL o identificador duplicado.");
    ids.add(id);
    return { id, url, title: normalizeRefugeName(stringField(row.title)), subtitle: normalizeRefugeName(stringField(row.subtitle)), badge: normalizeRefugeName(stringField(row.badge)) };
  });
}
export function validateFamily(value: unknown): Founder[] {
  if (!Array.isArray(value) || value.length !== 3) throw new IntakeError("La familia debe conservar exactamente tres integrantes.");
  return value.map(item => { const row = object(item); return { name: stringField(row.name, true), image: photo(row.image) }; });
}
