import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getLocalDogs, saveLocalDogs } from "@/lib/local-records";

async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

// AGREGAR REGISTRO MÉDICO O PROGRAMAR CITA
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (
      typeof body?.title !== "string" ||
      !body.title.trim() ||
      typeof body?.date !== "string" ||
      !body.date.trim()
    ) {
      return NextResponse.json(
        { error: "El título y la fecha son obligatorios" },
        { status: 400 }
      );
    }

    const date = new Date(body.date);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "La fecha ingresada no es válida" },
        { status: 400 }
      );
    }

    const allowedStatuses = ["Programado", "Pendiente", "Completado"];
    const status = allowedStatuses.includes(body.status)
      ? body.status
      : "Programado";

    const newRecord = {
      id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dogId: id,
      type: body.type || "Consulta",
      title: body.title.trim(),
      description: body.description || "",
      date: date.toISOString(),
      nextDueDate: body.nextDueDate ? new Date(body.nextDueDate).toISOString() : null,
      vetName: body.vetName || "Dra. María Morales",
      status,
    };

    const localDogs = await getLocalDogs();
    const dogIdx = localDogs.findIndex((d) => d.id === id);

    if (dogIdx !== -1) {
      const records = Array.isArray(localDogs[dogIdx].medicalRecords)
        ? localDogs[dogIdx].medicalRecords
        : [];
      records.unshift(newRecord);
      localDogs[dogIdx].medicalRecords = records;
      await saveLocalDogs(localDogs);
    }

    if (process.env.DATABASE_URL) {
      try {
        const dbRecord = await prisma.medicalRecord.create({
          data: {
            dogId: id,
            type: newRecord.type,
            title: newRecord.title,
            description: newRecord.description,
            date,
            nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
            vetName: newRecord.vetName,
            status: newRecord.status,
          },
        });
        return NextResponse.json(dbRecord, { status: 201 });
      } catch {
        // Fallback to local
      }
    }

    if (dogIdx === -1) {
      return NextResponse.json(
        { error: "Perrito no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error("Error al agregar registro médico:", error);
    return NextResponse.json(
      { error: "Error al agregar registro médico" },
      { status: 500 }
    );
  }
}
