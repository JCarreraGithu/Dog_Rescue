
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

// AGREGAR REGISTRO MÉDICO O PROGRAMAR CITA
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
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

    const dog = await prisma.dog.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (!dog) {
      return NextResponse.json(
        { error: "Perrito no encontrado o eliminado" },
        { status: 404 }
      );
    }

    // Permitir crear citas programadas o registrar atenciones
    const allowedStatuses = ["Programado", "Pendiente", "Completado"];

    const status = allowedStatuses.includes(body.status)
      ? body.status
      : "Programado";

    const record = await prisma.medicalRecord.create({
      data: {
        dogId: id,
        type: body.type || "Consulta",
        title: body.title.trim(),
        description: body.description || "",
        date,
        nextDueDate: body.nextDueDate
          ? new Date(body.nextDueDate)
          : null,
        vetName: body.vetName || "Dr. Veterinario Amatitlán",
        status,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error al agregar registro médico:", error);

    return NextResponse.json(
      { error: "Error al agregar registro médico" },
      { status: 500 }
    );
  }
}
