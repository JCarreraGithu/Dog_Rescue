import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Solo los campos que usa la página pública; /api/inventory conserva su protección.
export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      select: { id: true, name: true, category: true, quantity: true, minThreshold: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Necesidades no disponibles" }, { status: 503 });
  }
}
