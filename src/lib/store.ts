import fs from "fs";
import path from "path";
import { DEFAULT_PRODUCTS, type Product, type ProductCategory } from "@/data/products";

const STORE_FILE = path.join(process.cwd(), "src/data/store-products.json");

export function getStoreProducts(): Product[] {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error leyendo productos de tienda:", err);
  }
  return DEFAULT_PRODUCTS;
}

export function saveStoreProducts(products: Product[]): void {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(products, null, 2), "utf-8");
  } catch (err) {
    console.error("Error guardando productos de tienda:", err);
  }
}

export function sanitizeCategory(cat: unknown): ProductCategory {
  if (cat === "Playeras" || cat === "Paletas" || cat === "Accesorios") {
    return cat;
  }
  return "Playeras";
}
