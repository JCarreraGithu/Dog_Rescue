import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";
import { getUserFromToken } from "@/lib/staff-store";
import { cookies } from "next/headers";
import { getLocalVolunteers, saveLocalVolunteers } from "@/lib/local-records";
import { addNotification } from "@/lib/notifications";

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return !!token && !!(await getUserFromToken(token));
}

// Solo los administradores pueden consultar las solicitudes.
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const localVols = await getLocalVolunteers();

    if (process.env.DATABASE_URL) {
      try {
        const volunteers = await prisma.volunteer.findMany({
          orderBy: { createdAt: "desc" },
        });
        const merged = [
          ...localVols,
          ...volunteers.filter((v) => !localVols.some((l) => l.id === v.id)),
        ];
        return NextResponse.json(merged, {
          headers: { "Cache-Control": "no-store" },
        });
      } catch {
        // Fallback a voluntarios locales
      }
    }

    return NextResponse.json(localVols, {
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
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
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
        (day: unknown) => typeof day === "string" && allowedDays.includes(day)
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

    const newVol = {
      id: `vol-${Date.now()}`,
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
        typeof body.motivation === "string" ? body.motivation.trim() : "",
      acceptsSafetyRules: true,
      authorizesDataUse: true,
      status: "En Evaluación",
      createdAt: new Date().toISOString(),
    };

    const currentLocal = await getLocalVolunteers();
    await saveLocalVolunteers([newVol, ...currentLocal]);

    await addNotification({
      type: "volunteer",
      title: `Nueva Postulación de Voluntariado: ${name}`,
      message: `${name} (${age} años • Tel: ${phone}) se postuló para: ${body.interestAreas.join(
        ", "
      )}.`,
      targetTab: "volunteers",
      metadata: { volunteerId: newVol.id },
    });

    if (process.env.DATABASE_URL) {
      try {
        await prisma.volunteer.create({
          data: {
            name,
            phone,
            age,
            availableDays: body.availableDays,
            commitmentDuration: body.commitmentDuration,
            interestAreas: body.interestAreas,
            animalExperience: newVol.animalExperience,
            motivation: newVol.motivation,
            acceptsSafetyRules: true,
            authorizesDataUse: true,
            status: "En Evaluación",
          },
        });
      } catch {
        // Ya guardado localmente
      }
    }

    return NextResponse.json(newVol, { status: 201 });
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
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

    const localVols = await getLocalVolunteers();
    const idx = localVols.findIndex((v) => v.id === body.id);
    if (idx !== -1) {
      localVols[idx] = {
        ...localVols[idx],
        status: body.status,
        evaluatorNotes:
          typeof body.evaluatorNotes === "string"
            ? body.evaluatorNotes.trim()
            : localVols[idx].evaluatorNotes,
      };
      await saveLocalVolunteers(localVols);
      return NextResponse.json(localVols[idx]);
    }

    if (process.env.DATABASE_URL) {
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
    }

    return NextResponse.json(
      { error: "Solicitud no encontrada" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error al evaluar solicitud:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la solicitud" },
      { status: 500 }
    );
  }
}
