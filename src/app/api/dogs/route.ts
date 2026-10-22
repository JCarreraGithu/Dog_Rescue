
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Verificar sesión administrativa
async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return verifySessionToken(token);
}

// CONSULTAR PERRITOS ACTIVOS
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const ageCategory = searchParams.get("ageCategory");
    const size = searchParams.get("size");
    const temperament = searchParams.get("temperament");
    const status = searchParams.get("status");

    // Siempre excluir los expedientes eliminados
    const whereClause: any = {
      isDeleted: false,
    };

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
  } catch (error) {
    console.error("Error al obtener perros:", error);

    return NextResponse.json(
      { error: "Error al obtener perros" },
      { status: 500 }
    );
  }
}

// REGISTRAR NUEVO PERRITO
export async function POST(request: Request) {
  try {
    // Solo administradores autenticados
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (
      typeof body?.name !== "string" ||
      !body.name.trim() ||
      typeof body?.photoUrl !== "string" ||
      !body.photoUrl.trim()
    ) {
      return NextResponse.json(
        {
          error: "El nombre y la URL de la fotografía son obligatorios",
        },
        { status: 400 }
      );
    }

    const newDog = await prisma.dog.create({
      data: {
        name: body.name.trim(),
        breed: body.breed || "Mestizo",
        ageCategory: body.ageCategory || "Adulto",
        ageYears: Number(body.ageYears) || 1.0,
        gender: body.gender || "Macho",
        size: body.size || "Mediano",
        temperament: body.temperament || "Sociable",
        status: body.status || "En Adopción",
        rescueHistory: body.rescueHistory || "",
        healthNotes: body.healthNotes || "",
        photoUrl: body.photoUrl.trim(),
        isSterilized: Boolean(body.isSterilized),

        // Todo nuevo perrito comienza como activo
        isDeleted: false,
      },
    });

    return NextResponse.json(newDog, { status: 201 });
  } catch (error) {
    console.error("Error al crear perro:", error);

    return NextResponse.json(
      { error: "Error al crear perro" },
      { status: 500 }
    );
  }
}
