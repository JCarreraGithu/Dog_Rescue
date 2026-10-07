// Casos de impacto (carrusel del inicio y sección en /conocenos).
// - image: foto (ruta en /public o URL). video: opcional, ruta en /public (ej. "/casos/caso1.mp4").
// - draft: true => solo se muestra en desarrollo (npm run dev), NO en producción.
//   Úsalo para casos a medio llenar. Quita "draft" cuando el caso esté listo.

export type ImpactCase = {
  id: string;
  title: string;
  name?: string; // nombre del perrito
  story: string;
  image: string;
  video?: string;
  draft?: boolean;
};

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800";

const ALL_CASES: ImpactCase[] = [
  {
    id: "caso-atropellado",
    title: "De atropellado a correr en sus 4 patas",
    story:
      "Lo encontraron atropellado, con las dos patas traseras rotas. Lo rescatamos, lo operamos y lo rehabilitamos. Hoy corre feliz.",
    image: PLACEHOLDER_IMG, // TODO: foto/video real (agrega "video: '/casos/atropellado.mp4'")
  },
  {
    id: "caso-2",
    title: "[Título del segundo caso]",
    story: "[Contar en 2 o 3 líneas cómo llegó y cómo está hoy.]",
    image: PLACEHOLDER_IMG,
    draft: true,
  },
  {
    id: "caso-3",
    title: "[Título del tercer caso]",
    story: "[Contar en 2 o 3 líneas cómo llegó y cómo está hoy.]",
    image: PLACEHOLDER_IMG,
    draft: true,
  },
];

export const IMPACT_CASES: ImpactCase[] = ALL_CASES.filter(
  (c) => !c.draft || process.env.NODE_ENV !== "production"
);
