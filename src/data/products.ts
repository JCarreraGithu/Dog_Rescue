export type ProductCategory = "Playeras" | "Paletas" | "Accesorios";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number; // Precio en Quetzales (Q)
  category: ProductCategory;
  variantLabel?: string; // Ej: "Talla" para playeras, "Sabor" para paletas de dulce
  variants?: string[]; // Ej: ["S", "M", "L", "XL"] o ["Fresa", "Cereza", "Mango"]
  sizes?: string[]; // Compatibilidad con versiones previas
  image?: string;
  stock: number;
  available: boolean;
  featured?: boolean;
  badge?: string;
};

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "playera-oficial-guardianes",
    name: 'Playera Oficial "Guardianes de Amatitlán"',
    description:
      "Playera 100% algodón peinado de alta calidad con el logo oficial de DOG Rescue Guatemala en pecho y espalda. Ideal para jornadas y uso diario.",
    price: 110,
    category: "Playeras",
    variantLabel: "Talla",
    variants: ["S", "M", "L", "XL"],
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800",
    stock: 25,
    available: true,
    featured: true,
    badge: "Más Vendida",
  },
  {
    id: "playera-adopta-no-compres",
    name: 'Playera Edición Especial "Adopta un Amigo"',
    description:
      "Diseño exclusivo ilustrado que promueve la adopción responsable. Cada playera financia vacunas y desparasitaciones para un rescatado.",
    price: 120,
    category: "Playeras",
    variantLabel: "Talla",
    variants: ["S", "M", "L", "XL"],
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800",
    stock: 18,
    available: true,
    featured: true,
    badge: "Edición Especial",
  },
  {
    id: "playera-voluntario-corazon",
    name: 'Playera "Huellitas del Corazón"',
    description:
      "Corte cómodo y fresco en tono claro con estampado artístico de huellitas. Perfecta para apoyar la causa y difundir el mensaje.",
    price: 100,
    category: "Playeras",
    variantLabel: "Talla",
    variants: ["XS", "S", "M", "L"],
    image:
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800",
    stock: 15,
    available: true,
    featured: false,
    badge: "100% Solidaria",
  },
  {
    id: "paleta-dulce-artesanal",
    name: "Paleta de Dulce Artesanal Solidaria",
    description:
      "Deliciosas paletas de caramelo artesanal con sabores frutales tradicionales. ¡Endulza tu día en Amatitlán o pídelas por envío mientras ayudas a llenar los platitos del refugio!",
    price: 10,
    category: "Paletas",
    variantLabel: "Sabor",
    variants: ["Fresa", "Cereza", "Mango", "Sandía", "Uva"],
    image:
      "https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&q=80&w=800",
    stock: 60,
    available: true,
    featured: true,
    badge: "Dulce Solidario",
  },
  {
    id: "pack-familiar-paletas",
    name: "Pack Surtido de 6 Paletas de Dulce",
    description:
      "Bolsita surtida con 6 paletas de caramelo artesanal de tus sabores favoritos para compartir o regalar. Equivale a 3 días de alimento para un perrito rescatado.",
    price: 50,
    category: "Paletas",
    variantLabel: "Combinación",
    variants: [
      "Surtido Frutal",
      "Surtido Dulce Tradicional",
      "Mix Favoritos (Fresa/Cereza/Mango)",
    ],
    image:
      "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&q=80&w=800",
    stock: 30,
    available: true,
    featured: true,
    badge: "Ahorro Solidario",
  },
  {
    id: "paleta-caramelo-corazon",
    name: 'Paleta de Caramelo "Corazón Perruno"',
    description:
      "Paletas de dulce macizo multicolor en presentación especial para regalo o jornadas de adopción. Fáciles de transportar y enviar a todo el país.",
    price: 12,
    category: "Paletas",
    variantLabel: "Sabor",
    variants: [
      "Tutti Frutti",
      "Frambuesa Azul",
      "Manzana Verde",
      "Mango con Chamoy",
    ],
    image:
      "https://images.unsplash.com/photo-1514517521153-1be72277b32f?auto=format&fit=crop&q=80&w=800",
    stock: 45,
    available: true,
    featured: false,
    badge: "Edición Dulce",
  },
];

export const PRODUCTS = DEFAULT_PRODUCTS;
