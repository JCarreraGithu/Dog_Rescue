import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al obtener inventario", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newItem = await prisma.inventoryItem.create({
      data: {
        category: body.category || "Concentrado",
        name: body.name,
        quantity: parseFloat(body.quantity) || 0,
        unit: body.unit || "costales",
        minThreshold: parseFloat(body.minThreshold) || 5,
      },
    });
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al registrar insumo", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json(); // { id, quantityChange, setQuantity }
    const { id, quantityChange, setQuantity } = body;

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Insumo no encontrado" }, { status: 404 });
    }

    let newQuantity = existing.quantity;
    if (setQuantity !== undefined) {
      newQuantity = parseFloat(setQuantity);
    } else if (quantityChange !== undefined) {
      newQuantity = Math.max(0, existing.quantity + parseFloat(quantityChange));
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: { quantity: newQuantity },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al actualizar stock", details: error.message },
      { status: 500 }
    );
  }
}
