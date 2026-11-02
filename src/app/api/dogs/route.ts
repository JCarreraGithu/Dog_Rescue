import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";
import { getUserFromToken } from "@/lib/staff-store";
import { getLocalDogs, saveLocalDogs, LocalDog } from "@/lib/local-records";

// Verificar sesión administrativa
async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getUserFromToken(token);
}

function filterDogsList(dogs: LocalDog[], searchParams: URLSearchParams) {
  const ageCategory = searchParams.get("ageCategory");
  const size = searchParams.get("size");
  const temperament = searchParams.get("temperament");
  const status = searchParams.get("status");
  const deletedOnly = searchParams.get("deletedOnly") === "true";

  return dogs.filter((d) => {
    const isDel = Boolean(d.isDeleted);
    if (deletedOnly) {
      return isDel;
    }
    if (isDel) return false;

    if (status && d.status !== status) return false;
    if (ageCategory && ageCategory !== "Todos" && d.ageCategory !== ageCategory) return false;
    if (size && size !== "Todos" && d.size !== size) return false;
    if (
      temperament &&
      temperament !== "Todos" &&
      !d.temperament.toLowerCase().includes(temperament.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

// CONSULTAR PERRITOS ACTIVOS O PAPELERA
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localDogs = await getLocalDogs();

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(filterDogsList(localDogs, searchParams));
  }

  try {
    const deletedOnly = searchParams.get("deletedOnly") === "true";
    const ageCategory = searchParams.get("ageCategory");
    const size = searchParams.get("size");
    const temperament = searchParams.get("temperament");
    const status = searchParams.get("status");

    const whereClause: Prisma.DogWhereInput = {
      isDeleted: deletedOnly,
    };

    if (!deletedOnly) {
      if (ageCategory && ageCategory !== "Todos") whereClause.ageCategory = ageCategory;
      if (size && size !== "Todos") whereClause.size = size;
      if (temperament && temperament !== "Todos") {
        whereClause.temperament = { contains: temperament };
      }
      if (status) whereClause.status = status;
    }

    const dbDogs = await prisma.dog.findMany({
      where: whereClause,
      include: {
        medicalRecords: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!dbDogs || (dbDogs.length === 0 && !deletedOnly)) {
      return NextResponse.json(filterDogsList(localDogs, searchParams));
    }

    return NextResponse.json(dbDogs);
  } catch {
    return NextResponse.json(filterDogsList(localDogs, searchParams));
  }
}

// REGISTRAR NUEVO PERRITO
export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    if (
      typeof body?.name !== "string" ||
      !body.name.trim() ||
      typeof body?.photoUrl !== "string" ||
      !body.photoUrl.trim()
    ) {
      return NextResponse.json(
        { error: "El nombre y la fotografía son obligatorios" },
        { status: 400 }
      );
    }

    const newDogData: LocalDog = {
      id: `dog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: body.name.trim(),
      breed: body.breed?.trim() || "Mestizo",
      ageCategory: body.ageCategory || "Adulto",
      ageYears: Number(body.ageYears) || 1.0,
      gender: body.gender || "Macho",
      size: body.size || "Mediano",
      temperament: body.temperament?.trim() || "Sociable",
      status: body.status || "En Adopción",
      rescueHistory: body.rescueHistory || "",
      healthNotes: body.healthNotes || "",
      photoUrl: body.photoUrl.trim(),
      isSterilized: Boolean(body.isSterilized),
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      medicalRecords: [],
      applications: [],
    };

    const localDogs = await getLocalDogs();
    localDogs.unshift(newDogData);
    await saveLocalDogs(localDogs);

    if (process.env.DATABASE_URL) {
      try {
        const dbDog = await prisma.dog.create({
          data: {
            name: newDogData.name,
            breed: newDogData.breed,
            ageCategory: newDogData.ageCategory,
            ageYears: newDogData.ageYears,
            gender: newDogData.gender,
            size: newDogData.size,
            temperament: newDogData.temperament,
            status: newDogData.status,
            rescueHistory: newDogData.rescueHistory,
            healthNotes: newDogData.healthNotes,
            photoUrl: newDogData.photoUrl,
            isSterilized: newDogData.isSterilized,
            isDeleted: false,
          },
        });
        return NextResponse.json(dbDog, { status: 201 });
      } catch {
        // Fallback to local dog
      }
    }

    return NextResponse.json(newDogData, { status: 201 });
  } catch (error) {
    console.error("Error al crear perro:", error);
    return NextResponse.json({ error: "Error al crear perro" }, { status: 500 });
  }
}
