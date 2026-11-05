export type SpecialCaseStatus =
  | "Rehabilitado y Adoptado"
  | "Caso Éxito"
  | "En Rehabilitación"
  | "En Adopción";

export type ImpactCase = {
  id: string;
  name?: string; // Nombre del perrito
  title: string;
  subtitle?: string; // Diagnóstico o resumen corto
  story: string;
  beforeText?: string; // Cómo llegó al rescate
  afterText?: string; // Cómo está hoy
  location?: string;
  date?: string;
  status?: SpecialCaseStatus;
  image: string;
  gallery?: string[];
  video?: string;
  featured?: boolean; // Si aparece en el carrusel de Inicio
  published?: boolean; // Si es visible al público
  draft?: boolean;
};

export const DEFAULT_IMPACT_CASES: ImpactCase[] = [
  {
    id: "caso-valentin",
    name: "Valentín",
    title: "De ser atropellado en carretera a correr feliz en sus 4 patas",
    subtitle: "Fractura doble en patas traseras y deshidratación severa",
    story:
      "A Valentín lo encontraron inmóvil a un costado de la carretera en Amatitlán tras haber sido atropellado. Tenía ambas patas traseras fracturadas y mucho miedo, pero en su mirada seguía viva la esperanza. Nuestro equipo acudió de inmediato, financiamos su cirugía traumatológica con placas ortopédicas y durante 4 meses recibió fisioterapia diaria y amor en el refugio. Hoy Valentín camina, corre sin dolor y vive rodeado del cariño de una familia responsable.",
    beforeText:
      "Rescatado en carretera con fractura doble en extremidades posteriores, dolor agudo y desnutrición.",
    afterText:
      "Operado con éxito, rehabilitado al 100% con fisioterapia y adoptado por una familia amorosa.",
    location: "Amatitlán, Guatemala",
    date: "Octubre 2024",
    status: "Rehabilitado y Adoptado",
    image:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000",
    gallery: [
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=1000",
    ],
    featured: true,
    published: true,
  },
  {
    id: "caso-esperanza",
    name: "Esperanza",
    title: "Sanando las heridas del abandono extremo con amor y paciencia",
    subtitle: "Sarna sarcóptica avanzada, anemia y temor profundo a los humanos",
    story:
      "Esperanza deambulaba sola buscando comida entre la basura; había perdido casi todo su pelaje por una infección severa en la piel y temblaba cada vez que alguien se acercaba. En DOG rescue iniciamos un protocolo de baños medicados semanales, alimentación hiperproteica y rehabilitación emocional. Poco a poco su piel sanó, su pelaje dorado volvió a brillar y aprendió a confiar nuevamente en las caricias.",
    beforeText:
      "Pérdida del 80% de su pelaje por infección cutánea, anemia severa y desconfianza extrema.",
    afterText:
      "Pelaje completamente recuperado, esterilizada, vacunada y convertida en la perrita más dulce del refugio.",
    location: "Barrio San Antonio, Amatitlán",
    date: "Enero 2025",
    status: "Caso Éxito",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1000",
    gallery: [
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=1000",
    ],
    featured: true,
    published: true,
  },
  {
    id: "caso-campeon",
    name: "Campeón",
    title: "Un abuelito rescatado de la lluvia que conoció la dignidad",
    subtitle: "Perro geriátrico abandonado con infección respiratoria y desgaste articular",
    story:
      "A sus más de 9 años, Campeón fue dejado a su suerte bajo un aguacero. Estaba agotado, con problemas respiratorios y dolor en sus articulaciones. Lo abrigamos, tratamos su neumonía con antibióticos y le dimos una cama ortopédica calientita junto con suplementos condroprotectores. Hoy disfruta sus días soleados rodeado de paz, demostrando que ningún perrito anciano merece terminar su vida en la calle.",
    beforeText:
      "Abandonado en edad avanzada bajo la lluvia, con hipotermia, tos severa y debilidad articular.",
    afterText:
      "Estable, sin dolor articular, con chequeos veterinarios al día y rodeado de cuidados especiales.",
    location: "Villa Nueva / Amatitlán",
    date: "Febrero 2025",
    status: "En Rehabilitación",
    image:
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=1000",
    gallery: [
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1000",
    ],
    featured: true,
    published: true,
  },
];

export const IMPACT_CASES: ImpactCase[] = DEFAULT_IMPACT_CASES;
