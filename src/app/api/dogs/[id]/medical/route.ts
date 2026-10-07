import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const record = await prisma.medicalRecord.create({
      data: {
        dogId: id,
        type: body.type || "Consulta",
        title: body.title,
        description: body.description || "",
        date: body.date ? new Date(body.date) : new Date(),
        nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
        vetName: body.vetName || "Dr. Veterinario Amatitlán",
        status: body.status || "Completado",
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al agregar registro médico", details: error.message },
      { status: 500 }
    );
  }
}
