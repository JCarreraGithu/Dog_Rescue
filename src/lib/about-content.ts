export type AboutSlide = { id: string; url: string; title: string; subtitle: string; badge: string };
export type Founder = { name: string; image: string };
export type AboutContent = { carousel: AboutSlide[]; family: Founder[] };
export const DEFAULT_FAMILY: Founder[] = [
  { name: "Doña Odra", image: "" },
  { name: "Primer hijo", image: "" },
  { name: "Segundo hijo", image: "" },
];
// Estos recursos están versionados en public y se publican como archivos estáticos.
export const ABOUT_STATIC_UPLOADS = [
  "/uploads/casos/804959185_1072879375603903_6252243748483-1793169771622.jpg",
  "/uploads/casos/whatsapp-image-2026-10-26-at-10-04-46-pm-1793163302607.jpeg",
  "/uploads/casos/whatsapp-image-2026-10-26-at-10-04-47-pm-1793171844608.jpeg",
];
