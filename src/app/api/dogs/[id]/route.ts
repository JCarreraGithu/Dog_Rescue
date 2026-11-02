import type { LocalDog } from "@/lib/local-records";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";
import { getUserFromToken } from "@/lib/staff-store";
import { getLocalDogs, saveLocalDogs } from "@/lib/local-records";

async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getUserFromToken(token);
}

// CONSULTAR EXPEDIENTE CANINO
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const localDogs = await getLocalDogs();
  const localMatch = localDogs.find((d) => d.id === id);

  if (!process.env.DATABASE_URL) {
    if (localMatch) return NextResponse.json(localMatch);
    return NextResponse.json({ error: "Perro no encontrado" }, { status: 404 });
  }

  try {
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
      if (localMatch) return NextResponse.json(localMatch);
      return NextResponse.json({ error: "Perro no encontrado" }, { status: 404 });
    }

    return NextResponse.json(dog);
  } catch {
    if (localMatch) return NextResponse.json(localMatch);
    return NextResponse.json(
      { error: "Error al obtener el expediente canino" },
      { status: 500 }
    );
  }
}

// ACTUALIZAR EXPEDIENTE CANINO COMPLETO O RESTABLECER DE LA PAPELERA
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

    const localDogs = await getLocalDogs();
    const index = localDogs.findIndex((d) => d.id === id);

    if (index === -1 && !process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Expediente canino no encontrado" },
        { status: 404 }
      );
    }

    // Construir objeto de actualización flexible
    const updateData: Partial<Omit<LocalDog, "medicalRecords" | "applications" | "documentation">> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }
    if (typeof body.breed === "string" && body.breed.trim()) {
      updateData.breed = body.breed.trim();
    }
    if (typeof body.ageCategory === "string" && body.ageCategory.trim()) {
      updateData.ageCategory = body.ageCategory.trim();
    }
    if (body.ageYears !== undefined && !Number.isNaN(Number(body.ageYears))) {
      updateData.ageYears = Number(body.ageYears);
    }
    if (typeof body.gender === "string" && body.gender.trim()) {
      updateData.gender = body.gender.trim();
    }
    if (typeof body.size === "string" && body.size.trim()) {
      updateData.size = body.size.trim();
    }
    if (typeof body.temperament === "string") {
      updateData.temperament = body.temperament.trim() || "Sociable";
    }
    if (typeof body.status === "string" && body.status.trim()) {
      updateData.status = body.status.trim();
    }
    if (typeof body.photoUrl === "string" && body.photoUrl.trim()) {
      updateData.photoUrl = body.photoUrl.trim();
    }
    if (typeof body.isSterilized === "boolean") {
      updateData.isSterilized = body.isSterilized;
    }
    if (typeof body.rescueHistory === "string") {
      updateData.rescueHistory = body.rescueHistory;
    }
    if (typeof body.healthNotes === "string") {
      updateData.healthNotes = body.healthNotes;
    }

    // Soporte para restablecer desde la papelera
    if (body.action === "restore" || body.isDeleted === false) {
      updateData.isDeleted = false;
      updateData.deletedAt = null;
    }

    let updatedLocal = null;
    if (index !== -1) {
      localDogs[index] = {
        ...localDogs[index],
        ...updateData,
      };
      updatedLocal = localDogs[index];
      await saveLocalDogs(localDogs);
    }

    if (process.env.DATABASE_URL) {
      try {
        const updatedDb = await prisma.dog.update({
          where: { id },
          data: updateData,
        });
        return NextResponse.json(updatedDb);
      } catch {
        if (updatedLocal) return NextResponse.json(updatedLocal);
      }
    }

    return NextResponse.json(updatedLocal);
  } catch (error) {
    console.error("Error al actualizar expediente:", error);
    return NextResponse.json(
      { error: "Error al actualizar el expediente canino" },
      { status: 500 }
    );
  }
}

// MOVER A LA PAPELERA (SOFT DELETE) O ELIMINAR DEFINITIVAMENTE (?permanent=true)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    const localDogs = await getLocalDogs();
    const index = localDogs.findIndex((d) => d.id === id);

    if (permanent) {
      // Eliminación definitiva de la papelera
      if (index !== -1) {
        localDogs.splice(index, 1);
        await saveLocalDogs(localDogs);
      }

      if (process.env.DATABASE_URL) {
        try {
          await prisma.dog.delete({ where: { id } });
        } catch {
          // Ignorar si sólo estaba en local
        }
      }

      return NextResponse.json({
        success: true,
        message: "Expediente eliminado definitivamente de la papelera",
      });
    }

    // Mover a la Papelera (isDeleted = true)
    const deletedAtIso = new Date().toISOString();
    if (index !== -1) {
      localDogs[index] = {
        ...localDogs[index],
        isDeleted: true,
        deletedAt: deletedAtIso,
      };
      await saveLocalDogs(localDogs);
    }

    if (process.env.DATABASE_URL) {
      try {
        await prisma.dog.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(deletedAtIso),
          },
        });
      } catch {
        // Ignorar si sólo estaba en local
      }
    }

    if (index === -1 && !process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Perrito no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Perrito enviado a la papelera de expedientes",
    });
  } catch (error) {
    console.error("Error al eliminar expediente:", error);
    return NextResponse.json(
      { error: "Error al mover el expediente a la papelera" },
      { status: 500 }
    );
  }
}
