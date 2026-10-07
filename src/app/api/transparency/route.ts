import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const stats = await prisma.transparencyStat.findMany();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al cargar contadores de transparencia", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json(); // { key, value }
    const updated = await prisma.transparencyStat.update({
      where: { key: body.key },
      data: { value: parseInt(body.value, 10) },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al actualizar contador", details: error.message },
      { status: 500 }
    );
  }
}
