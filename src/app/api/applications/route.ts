
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

// Solo administradores pueden consultar solicitudes
export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const apps = await prisma.adoptionApplication.findMany({
      include: {
        dog: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(apps, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error al consultar solicitudes:", error);
    return NextResponse.json(
      { error: "Error al obtener solicitudes" },
      { status: 500 }
    );
  }
}

// Los visitantes pueden enviar solicitudes

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.applicantName === "string"
        ? body.applicantName.trim()
        : "";

    const phone =
      typeof body.applicantPhone === "string"
        ? body.applicantPhone.trim()
        : "";

    const age = body.applicantAge;

    const validBoolean = (value: unknown) =>
      typeof value === "boolean";

    if (
      !name ||
      !phone ||
      !Number.isInteger(age) ||
      age < 18 ||
      age > 120 ||
      !validBoolean(body.petsAllowed) ||
      !validBoolean(body.safeHome) ||
      !validBoolean(body.enoughSpace) ||
      !["Todos", "Algunos"].includes(body.petAccess) ||
      !validBoolean(body.knowsFiveFreedoms) ||
      !validBoolean(body.commitsToWelfare) ||
      !validBoolean(body.commitsToSterilize) ||
      typeof body.dogId !== "string" ||
      !body.dogId.trim()
    ) {
      return NextResponse.json(
        { error: "Completa todos los campos de la solicitud correctamente" },
        { status: 400 }
      );
    }

    const dog = await prisma.dog.findFirst({
      where: {
        id: body.dogId,
        isDeleted: false,
        status: "En Adopción",
      },
      select: { id: true },
    });

    if (!dog) {
      return NextResponse.json(
        { error: "Este perrito no está disponible para adopción" },
        { status: 404 }
      );
    }

    const app = await prisma.adoptionApplication.create({
      data: {
        dogId: dog.id,
        applicantName: name,
        applicantAge: age,
        applicantPhone: phone,
        petsAllowed: body.petsAllowed,
        safeHome: body.safeHome,
        enoughSpace: body.enoughSpace,
        petAccess: body.petAccess,
        knowsFiveFreedoms: body.knowsFiveFreedoms,
        commitsToWelfare: body.commitsToWelfare,
        commitsToSterilize: body.commitsToSterilize,
        status: "En Evaluación",
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(app, { status: 201 });
  } catch (error) {
    console.error("Error al registrar solicitud:", error);

    return NextResponse.json(
      { error: "Error al registrar solicitud" },
      { status: 500 }
    );
  }
}


// Solo administradores pueden evaluar solicitudes
export async function PUT(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const allowedStatuses = [
      "Pendiente",
      "En Evaluación",
      "Aprobado",
      "Rechazado",
    ];

    if (
      typeof body.id !== "string" ||
      !allowedStatuses.includes(body.status)
    ) {
      return NextResponse.json(
        { error: "Datos de actualización inválidos" },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.adoptionApplication.findUnique({
        where: { id: body.id },
      });

      if (!current) {
        throw new Error("Solicitud no encontrada");
      }

      const application = await tx.adoptionApplication.update({
        where: { id: body.id },
        data: {
          status: body.status,
          evaluatorNotes:
            typeof body.evaluatorNotes === "string"
              ? body.evaluatorNotes
              : current.evaluatorNotes,
        },
      });

      // Contar únicamente una nueva aprobación
      if (
        body.status === "Aprobado" &&
        current.status !== "Aprobado" &&
        application.dogId
      ) {
        const dogUpdate = await tx.dog.updateMany({
          where: {
            id: application.dogId,
            isDeleted: false,
            status: "En Adopción",
          },
          data: { status: "Adoptado" },
        });

        if (dogUpdate.count === 1) {
          await tx.transparencyStat.updateMany({
            where: { key: "adoptions_count" },
            data: { value: { increment: 1 } },
          });
        }
      }

      return application;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar solicitud:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la solicitud" },
      { status: 500 }
    );
  }
}
