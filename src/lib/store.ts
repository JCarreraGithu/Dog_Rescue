import type { Prisma, StoreProduct } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Product, ProductCategory } from "@/data/products";
import { IntakeError, object } from "@/lib/intake-validation";
import { stringField, numberField, booleanField, stringList, imageUrl, nonemptyPatch } from "@/lib/admin-validation";
export function productView(row: StoreProduct): Product {
  return { id: row.id, name: row.name, description: row.description, price: row.price, category: row.category as ProductCategory, stock: row.stock, available: row.available, featured: row.featured, ...(row.variantLabel ? { variantLabel: row.variantLabel } : {}), ...(row.variants.length ? { variants: row.variants } : {}), ...(row.image ? { image: row.image } : {}), ...(row.badge ? { badge: row.badge } : {}) };
}
export async function getStoreProducts() {
  return (await prisma.storeProduct.findMany({ where: { isDeleted: false }, orderBy: [{ createdAt: "desc" }, { id: "asc" }] })).map(productView);
}
export function sanitizeCategory(value: unknown): ProductCategory {
  if (value === "Playeras" || value === "Paletas" || value === "Accesorios") return value;
  throw new IntakeError("Categoría inválida.");
}
export function productInput(input: unknown, create = false) {
  const source = object(input);
  const data: Prisma.StoreProductUncheckedUpdateManyInput = {};
  for (const key of ["name", "description"] as const) if (source[key] !== undefined) data[key] = stringField(source[key], key === "name");
  for (const key of ["variantLabel", "badge"] as const) if (source[key] !== undefined) data[key] = stringField(source[key]) || null;
  if (source.image !== undefined) data.image = imageUrl(source.image) || null;
  if (source.price !== undefined) { const price = numberField(source.price); if (!price) throw new IntakeError("El precio debe ser mayor a cero."); data.price = price; }
  if (source.stock !== undefined) data.stock = numberField(source.stock, true);
  if (source.category !== undefined) data.category = sanitizeCategory(source.category);
  for (const key of ["available", "featured"] as const) if (source[key] !== undefined) data[key] = booleanField(source[key]);
  if (source.variants !== undefined || source.sizes !== undefined) data.variants = stringList(typeof source.variants === "string" ? source.variants.split(",").map(s => s.trim()).filter(Boolean) : source.variants ?? source.sizes);
  if (create && (!data.name || !data.price)) throw new IntakeError("El nombre y el precio son obligatorios.");
  nonemptyPatch(data);
  return data;
}
