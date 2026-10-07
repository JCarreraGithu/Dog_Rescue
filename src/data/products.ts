// Productos de "Ayúdanos comprando".
// Para agregar/editar un producto solo se cambia esta lista.
// - image: ruta en /public (ej. "/tienda/camisa-rescate.jpg") o URL. Si se deja vacío se muestra un ícono.
// - sizes: si el producto tiene tallas, agrégalas; si no, déjalo vacío.
// - available: false lo muestra como "Agotado".
// IMPORTANTE: los productos y precios de abajo son EJEMPLOS, reemplázalos con los reales del refugio.

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number; // en quetzales
  category: "Camisas" | "Tazas" | "Otros";
  sizes?: string[];
  image?: string;
  available: boolean;
};

export const PRODUCTS: Product[] = [
  {
    id: "camisa-rescate",
    name: "Camisa estampada DOG Rescue",
    description: "Camisa con estampado del refugio. Cada compra es un aporte directo para los rescatados.",
    price: 100,
    category: "Camisas",
    sizes: ["S", "M", "L", "XL"],
    available: true,
  },
  {
    id: "taza-rescate",
    name: "Taza DOG Rescue",
    description: "Taza de cerámica con diseño del refugio.",
    price: 55,
    category: "Tazas",
    available: true,
  },
];
