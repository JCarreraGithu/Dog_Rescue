import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { getUserFromToken } from "@/lib/staff-store";
import { getStoreProducts, saveStoreProducts, sanitizeCategory } from "@/lib/store";

async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getUserFromToken(token);
}

// ACTUALIZAR PRODUCTO EXISTENTE (ADMIN)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const products = getStoreProducts();
    const index = products.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const current = products[index];

    const variants =
      body.variants !== undefined
        ? Array.isArray(body.variants)
          ? body.variants.map((v: unknown) => String(v).trim()).filter(Boolean)
          : typeof body.variants === "string"
            ? body.variants
                .split(",")
                .map((v: string) => v.trim())
                .filter(Boolean)
            : []
        : current.variants;

    const category =
      body.category !== undefined ? sanitizeCategory(body.category) : current.category;

    const updatedProduct = {
      ...current,
      name:
        typeof body.name === "string" && body.name.trim()
          ? body.name.trim()
          : current.name,
      description:
        typeof body.description === "string"
          ? body.description.trim()
          : current.description,
      price:
        body.price !== undefined && !isNaN(Number(body.price)) && Number(body.price) > 0
          ? Number(body.price)
          : current.price,
      category,
      variantLabel:
        body.variantLabel !== undefined
          ? typeof body.variantLabel === "string" && body.variantLabel.trim()
            ? body.variantLabel.trim()
            : undefined
          : current.variantLabel,
      variants: variants && variants.length > 0 ? variants : undefined,
      image:
        body.image !== undefined
          ? typeof body.image === "string" && body.image.trim()
            ? body.image.trim()
            : undefined
          : current.image,
      stock:
        body.stock !== undefined && !isNaN(Number(body.stock))
          ? Math.max(0, Number(body.stock))
          : current.stock,
      available:
        body.available !== undefined ? Boolean(body.available) : current.available,
      featured:
        body.featured !== undefined ? Boolean(body.featured) : current.featured,
      badge:
        body.badge !== undefined
          ? typeof body.badge === "string" && body.badge.trim()
            ? body.badge.trim()
            : undefined
          : current.badge,
    };

    products[index] = updatedProduct;
    saveStoreProducts(products);

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}

// ELIMINAR PRODUCTO DE LA TIENDA (ADMIN)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const products = getStoreProducts();
    const filtered = products.filter((p) => p.id !== id);

    if (filtered.length === products.length) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    saveStoreProducts(filtered);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
  }
}
