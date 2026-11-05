export type HomeHeroSettings = {
  badgeText: string;
  mottoPart1: string;
  mottoHighlight: string;
  description: string;
  button1Text: string;
  button2Text: string;

  fontFamily: "sans" | "montserrat" | "serif" | "fredoka" | "caveat" | "oswald";
  fontWeight: "normal" | "semibold" | "bold" | "black";
  fontStyle: "normal" | "italic";
  textTransform: "none" | "uppercase" | "capitalize";
  fontSize: "large" | "extra" | "giant";
  highlightColor:
    | "sky"
    | "emerald"
    | "amber"
    | "rose"
    | "white"
    | "gradient-cyan"
    | "gradient-gold";
  textAlignment: "left" | "center";
};

export const DEFAULT_HOME_HERO_SETTINGS: HomeHeroSettings = {
  badgeText: "Amatitlán, Guatemala • Iniciativa Comunitaria 100% Local",
  mottoPart1: "Transformando vidas,",
  mottoHighlight: "un rescate a la vez.",
  description:
    "DOG rescue Guatemala es un refugio dirigido de manera independiente y sin fines de lucro, centrado en el cuidado, bienestar y protección de los animales. Trabajamos por el rescate, rehabilitación y adopción responsable de perritos en Amatitlán.",
  button1Text: "Ver Catálogo de Adopciones",
  button2Text: "Reportar Perrito en Riesgo",

  fontFamily: "sans",
  fontWeight: "black",
  fontStyle: "normal",
  textTransform: "none",
  fontSize: "extra",
  highlightColor: "sky",
  textAlignment: "left",
};

export function getHeroFontFamilyStyle(
  font?: HomeHeroSettings["fontFamily"]
): { fontFamily: string } {
  switch (font) {
    case "montserrat":
      return { fontFamily: "'Montserrat', sans-serif" };
    case "serif":
      return { fontFamily: "'Merriweather', serif" };
    case "fredoka":
      return { fontFamily: "'Fredoka', sans-serif" };
    case "caveat":
      return { fontFamily: "'Caveat', cursive" };
    case "oswald":
      return { fontFamily: "'Oswald', sans-serif" };
    case "sans":
    default:
      return { fontFamily: "'Inter', sans-serif" };
  }
}

export function getHeroHighlightClass(
  color?: HomeHeroSettings["highlightColor"]
): string {
  switch (color) {
    case "emerald":
      return "text-emerald-400";
    case "amber":
      return "text-amber-400";
    case "rose":
      return "text-rose-400";
    case "white":
      return "text-white underline decoration-sky-400 underline-offset-8";
    case "gradient-cyan":
      return "bg-gradient-to-r from-sky-300 via-cyan-400 to-teal-300 bg-clip-text text-transparent";
    case "gradient-gold":
      return "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent";
    case "sky":
    default:
      return "text-sky-400";
  }
}

export function getHeroFontSizeClass(
  size?: HomeHeroSettings["fontSize"]
): string {
  switch (size) {
    case "large":
      return "text-3xl sm:text-4xl lg:text-5xl";
    case "giant":
      return "text-5xl sm:text-6xl lg:text-7xl";
    case "extra":
    default:
      return "text-4xl sm:text-5xl lg:text-6xl";
  }
}

export function getHeroWeightClass(
  weight?: HomeHeroSettings["fontWeight"]
): string {
  switch (weight) {
    case "normal":
      return "font-normal";
    case "semibold":
      return "font-semibold";
    case "bold":
      return "font-bold";
    case "black":
    default:
      return "font-black";
  }
}
