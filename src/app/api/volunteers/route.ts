
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return !!token && !!(await verifySessionToken(token));
}

// Solo los administradores pueden consultar las solicitudes.
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const volunteers = await prisma.volunteer.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(volunteers, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error al listar voluntarios:", error);
    return NextResponse.json(
      { error: "Error al listar voluntarios" },
      { status: 500 }
    );
  }
}

// Formulario público de postulación.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const age = body.age;


    const allowedDays = [
      "Lunes", "Martes", "Miércoles", "Jueves",
      "Viernes", "Sábado", "Domingo",
    ];

    const allowedAreas = [
      "Rescate y Logística en Campo",
      "Cuidados en Refugio",
      "Venta de Paletas y Productos Solidarios",
      "Venta de Playeras y Merch Oficial",
      "Redes Sociales y Difusión",
      "Casas Cuna / Hogar Temporal",
    ];

    const allowedCommitments = [
      "Fines de semana",
      "Al menos 3 meses",
      "6 meses o más",
    ];

    const validDays =
      Array.isArray(body.availableDays) &&
      body.availableDays.length > 0 &&
      body.availableDays.every(
        (day: unknown) =>
          typeof day === "string" && allowedDays.includes(day)
      );

    const validAreas =
      Array.isArray(body.interestAreas) &&
      body.interestAreas.length > 0 &&
      body.interestAreas.every(
        (area: unknown) =>
          typeof area === "string" && allowedAreas.includes(area)
      );

    if (
      !name ||
      !phone ||
      !Number.isInteger(age) ||
      age < 18 ||
      age > 120 ||

      !validDays ||
      !validAreas ||
      !allowedCommitments.includes(body.commitmentDuration) ||
      body.acceptsSafetyRules !== true ||
      body.authorizesDataUse !== true
    ) {
      return NextResponse.json(
        { error: "Completa correctamente los campos obligatorios." },
        { status: 400 }
      );
    }

    const volunteer = await prisma.volunteer.create({
      data: {
        name,
        phone,
        age,
        availableDays: body.availableDays,
        commitmentDuration: body.commitmentDuration,
        interestAreas: body.interestAreas,
        animalExperience:
          typeof body.animalExperience === "string"
            ? body.animalExperience.trim()
            : "",
        motivation:
          typeof body.motivation === "string"
            ? body.motivation.trim()
            : "",
        acceptsSafetyRules: true,
        authorizesDataUse: true,
        status: "En Evaluación",
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(volunteer, { status: 201 });
  } catch (error) {
    console.error("Error al registrar solicitud:", error);
    return NextResponse.json(
      { error: "Error al registrar solicitud de voluntariado" },
      { status: 500 }
    );
  }
}

// Aprobar o rechazar solicitudes desde el panel administrativo.
export async function PUT(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (
      typeof body.id !== "string" ||
      !["Aprobado", "Rechazado"].includes(body.status)
    ) {
      return NextResponse.json(
        { error: "Datos de evaluación inválidos" },
        { status: 400 }
      );
    }

    const volunteer = await prisma.volunteer.update({
      where: { id: body.id },
      data: {
        status: body.status,
        evaluatorNotes:
          typeof body.evaluatorNotes === "string"
            ? body.evaluatorNotes.trim()
            : null,
      },
    });

    return NextResponse.json(volunteer);
  } catch (error) {
    console.error("Error al evaluar solicitud:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la solicitud" },
      { status: 500 }
    );
  }
}
