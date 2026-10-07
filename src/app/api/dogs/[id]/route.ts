import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dog = await prisma.dog.findUnique({
      where: { id },
      include: {
        medicalRecords: {
          orderBy: { date: "desc" },
        },
        applications: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!dog) {
      return NextResponse.json({ error: "Perro no encontrado" }, { status: 404 });
    }

    return NextResponse.json(dog);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al obtener el expediente canino", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedDog = await prisma.dog.update({
      where: { id },
      data: {
        name: body.name,
        breed: body.breed,
        ageCategory: body.ageCategory,
        ageYears: parseFloat(body.ageYears),
        gender: body.gender,
        size: body.size,
        temperament: body.temperament,
        status: body.status,
        rescueHistory: body.rescueHistory,
        healthNotes: body.healthNotes,
        photoUrl: body.photoUrl,
        isSterilized: Boolean(body.isSterilized),
      },
    });

    return NextResponse.json(updatedDog);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al actualizar perro", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.dog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al eliminar perro", details: error.message },
      { status: 500 }
    );
  }
}
