
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return verifySessionToken(token);
}

// EDITAR, COMPLETAR O CANCELAR UNA CITA
export async function PATCH(
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

    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        dog: {
          select: { isDeleted: true },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Registro médico no encontrado" },
        { status: 404 }
      );
    }

    if (record.dog.isDeleted) {
      return NextResponse.json(
        { error: "No se pueden modificar citas de un perrito archivado" },
        { status: 409 }
      );
    }

    const allowedFields = [
      "type",
      "title",
      "description",
      "date",
      "nextDueDate",
      "vetName",
      "status",
    ];

    const allowedStatuses = [
      "Programado",
      "Pendiente",
      "Completado",
      "Cancelado",
    ];

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length === 0 ||
      Object.keys(body).some(
        (field) => !allowedFields.includes(field)
      )
    ) {
      return NextResponse.json(
        { error: "Campos de actualización no válidos" },
        { status: 400 }
      );
    }

    const data: {
      type?: string;
      title?: string;
      description?: string;
      date?: Date;
      nextDueDate?: Date | null;
      vetName?: string;
      status?: string;
    } = {};

    for (const field of [
      "type",
      "title",
      "description",
      "vetName",
    ] as const) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== "string") {
          return NextResponse.json(
            { error: `El campo ${field} debe ser texto` },
            { status: 400 }
          );
        }

        const value = body[field].trim();

        if (
          ["type", "title", "vetName"].includes(field) &&
          !value
        ) {
          return NextResponse.json(
            { error: `El campo ${field} es obligatorio` },
            { status: 400 }
          );
        }

        data[field] = value;
      }
    }

    if (body.date !== undefined) {
      if (
        typeof body.date !== "string" ||
        !body.date.trim()
      ) {
        return NextResponse.json(
          { error: "La fecha es obligatoria" },
          { status: 400 }
        );
      }

      const date = new Date(body.date);

      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Fecha inválida" },
          { status: 400 }
        );
      }

      data.date = date;
    }

    if (body.nextDueDate !== undefined) {
      if (
        body.nextDueDate === null ||
        body.nextDueDate === ""
      ) {
        data.nextDueDate = null;
      } else {
        if (typeof body.nextDueDate !== "string") {
          return NextResponse.json(
            { error: "Próxima fecha inválida" },
            { status: 400 }
          );
        }

        const nextDate = new Date(body.nextDueDate);

        if (Number.isNaN(nextDate.getTime())) {
          return NextResponse.json(
            { error: "Próxima fecha inválida" },
            { status: 400 }
          );
        }

        data.nextDueDate = nextDate;
      }
    }

    if (body.status !== undefined) {
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Estado no válido" },
          { status: 400 }
        );
      }

      data.status = body.status;
    }

    const updatedRecord = await prisma.medicalRecord.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error("Error al actualizar cita médica:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar la cita médica" },
      { status: 500 }
    );
  }
}
