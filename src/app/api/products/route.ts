import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { getUserFromToken } from "@/lib/staff-store";
import { getStoreProducts, saveStoreProducts, sanitizeCategory } from "@/lib/store";
import type { Product } from "@/data/products";

async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getUserFromToken(token);
}

// OBTENER CATÁLOGO DE PRODUCTOS (PÚBLICO Y ADMIN)
export async function GET() {
  const products = getStoreProducts();
  return NextResponse.json(products, {
    headers: { "Cache-Control": "no-store" },
  });
}

// CREAR NUEVO PRODUCTO EN LA TIENDA (ADMIN)
export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const price = Number(body.price);
    const stock = Number(body.stock ?? 10);

    if (!name || isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: "El nombre y un precio válido mayor a 0 son obligatorios." },
        { status: 400 }
      );
    }

    const category = sanitizeCategory(body.category);
    const variants: string[] = Array.isArray(body.variants)
      ? body.variants.map((v: unknown) => String(v).trim()).filter(Boolean)
      : typeof body.variants === "string"
        ? body.variants
            .split(",")
            .map((v: string) => v.trim())
            .filter(Boolean)
        : [];

    const defaultVariantLabel =
      category === "Playeras" ? "Talla" : category === "Paletas" ? "Sabor" : "Opción";

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      description: description || "Producto solidario a beneficio de los perritos rescatados.",
      price,
      category,
      variantLabel:
        typeof body.variantLabel === "string" && body.variantLabel.trim()
          ? body.variantLabel.trim()
          : variants.length > 0
            ? defaultVariantLabel
            : undefined,
      variants: variants.length > 0 ? variants : undefined,
      image: typeof body.image === "string" && body.image.trim() ? body.image.trim() : undefined,
      stock: isNaN(stock) || stock < 0 ? 0 : stock,
      available: body.available !== undefined ? Boolean(body.available) : true,
      featured: Boolean(body.featured),
      badge: typeof body.badge === "string" && body.badge.trim() ? body.badge.trim() : undefined,
    };

    const products = getStoreProducts();
    const updated = [newProduct, ...products];
    saveStoreProducts(updated);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return NextResponse.json({ error: "Error al crear el producto" }, { status: 500 });
  }
}
