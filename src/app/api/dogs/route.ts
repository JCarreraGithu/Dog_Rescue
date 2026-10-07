import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ageCategory = searchParams.get("ageCategory");
    const size = searchParams.get("size");
    const temperament = searchParams.get("temperament");
    const status = searchParams.get("status");

    const whereClause: any = {};

    if (ageCategory && ageCategory !== "Todos") {
      whereClause.ageCategory = ageCategory;
    }
    if (size && size !== "Todos") {
      whereClause.size = size;
    }
    if (temperament && temperament !== "Todos") {
      whereClause.temperament = {
        contains: temperament,
      };
    }
    if (status) {
      whereClause.status = status;
    }

    const dogs = await prisma.dog.findMany({
      where: whereClause,
      include: {
        medicalRecords: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(dogs);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al obtener perros", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newDog = await prisma.dog.create({
      data: {
        name: body.name,
        breed: body.breed || "Mestizo",
        ageCategory: body.ageCategory || "Adulto",
        ageYears: parseFloat(body.ageYears) || 1.0,
        gender: body.gender || "Macho",
        size: body.size || "Mediano",
        temperament: body.temperament || "Sociable",
        status: body.status || "En Adopción",
        rescueHistory: body.rescueHistory || "",
        healthNotes: body.healthNotes || "",
        photoUrl: body.photoUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800",
        isSterilized: Boolean(body.isSterilized),
      },
    });

    return NextResponse.json(newDog, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al crear perro", details: error.message },
      { status: 500 }
    );
  }
}
