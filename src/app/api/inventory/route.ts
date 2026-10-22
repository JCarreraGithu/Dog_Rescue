import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return Boolean(token && (await verifySessionToken(token)));
}

export async function GET() {
  try {
    // Se conserva GET para no alterar consumidores existentes del inventario.
    const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    return NextResponse.json({ error: "Error al obtener inventario" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const quantity = Number(body.quantity ?? 0);
    const minThreshold = Number(body.minThreshold ?? 5);
    if (!name || !Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(minThreshold) || minThreshold < 0) {
      return NextResponse.json({ error: "Datos del producto inválidos" }, { status: 400 });
    }
    const newItem = await prisma.inventoryItem.create({
      data: {
        category: typeof body.category === "string" && body.category.trim() ? body.category.trim() : "Concentrado",
        name,
        quantity,
        unit: typeof body.unit === "string" && body.unit.trim() ? body.unit.trim() : "costales",
        minThreshold,
      },
    });
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error al registrar insumo:", error);
    return NextResponse.json({ error: "Error al registrar insumo" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body = await request.json();
    const { id, quantityChange, setQuantity } = body;
    if (typeof id !== "string" || !id.trim()) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Insumo no encontrado" }, { status: 404 });
    const delta = Number(quantityChange);
    const newQuantity = setQuantity !== undefined ? Number(setQuantity) : quantityChange !== undefined ? Math.max(0, existing.quantity + delta) : NaN;
    if (!Number.isFinite(newQuantity) || newQuantity < 0) return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    const updated = await prisma.inventoryItem.update({ where: { id }, data: { quantity: newQuantity } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar stock:", error);
    return NextResponse.json({ error: "Error al actualizar stock" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    const existing = await prisma.inventoryItem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Insumo no encontrado" }, { status: 404 });
    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return NextResponse.json({ error: "No se pudo eliminar el producto" }, { status: 500 });
  }
}
