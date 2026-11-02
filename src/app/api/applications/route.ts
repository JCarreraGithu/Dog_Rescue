import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";
import { getUserFromToken } from "@/lib/staff-store";
import { DEFAULT_DOGS } from "@/data/default-dogs";
import {
  getLocalApplications,
  saveLocalApplications,
  LocalAdoptionApplication,
} from "@/lib/local-records";
import { addNotification } from "@/lib/notifications";

async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getUserFromToken(token);
}

// Solo administradores pueden consultar solicitudes
export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const localApps = await getLocalApplications();

    if (process.env.DATABASE_URL) {
      try {
        const dbApps = await prisma.adoptionApplication.findMany({
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
        const merged = [
          ...localApps,
          ...dbApps.filter((d) => !localApps.some((l) => l.id === d.id)),
        ];
        return NextResponse.json(merged, {
          headers: { "Cache-Control": "no-store" },
        });
      } catch {
        // Fallback a registros locales
      }
    }

    return NextResponse.json(localApps, {
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
    const validBoolean = (value: unknown) => typeof value === "boolean";

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

    // Buscar información del perrito para vincularla a la solicitud y notificación
    const matchedDemoDog = DEFAULT_DOGS.find((d) => d.id === body.dogId);
    const dogInfo = matchedDemoDog
      ? {
          id: matchedDemoDog.id,
          name: matchedDemoDog.name,
          photoUrl: matchedDemoDog.photoUrl,
        }
      : {
          id: body.dogId,
          name: "Perrito en Adopción",
          photoUrl:
            "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800",
        };

    const newLocalApp: LocalAdoptionApplication = {
      id: `app-${Date.now()}`,
      dogId: body.dogId,
      dog: dogInfo,
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
      createdAt: new Date().toISOString(),
    };

    const currentLocal = await getLocalApplications();
    await saveLocalApplications([newLocalApp, ...currentLocal]);

    // Registrar notificación administrativa
    await addNotification({
      type: "adoption",
      title: `Nueva Solicitud de Adopción: ${dogInfo.name}`,
      message: `${name} (${age} años • Tel: ${phone}) envió postulación para adoptar a ${dogInfo.name} y aceptó el Acta de Compromiso.`,
      targetTab: "applications",
      metadata: {
        applicationId: newLocalApp.id,
        dogId: dogInfo.id,
        dogName: dogInfo.name,
        applicantName: name,
        applicantPhone: phone,
      },
    });

    // Si hay base de datos configurada y no es un perro demo, intentar guardar también en DB
    if (process.env.DATABASE_URL && !body.dogId.startsWith("demo-dog")) {
      try {
        await prisma.adoptionApplication.create({
          data: {
            dogId: body.dogId,
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
        });
      } catch {
        // Ya quedó guardado en almacenamiento local
      }
    }

    return NextResponse.json(newLocalApp, { status: 201 });
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
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

    // Actualizar en archivo local
    const localApps = await getLocalApplications();
    const idx = localApps.findIndex((a) => a.id === body.id);
    if (idx !== -1) {
      localApps[idx] = {
        ...localApps[idx],
        status: body.status,
        evaluatorNotes:
          typeof body.evaluatorNotes === "string"
            ? body.evaluatorNotes
            : localApps[idx].evaluatorNotes,
      };
      await saveLocalApplications(localApps);
      return NextResponse.json(localApps[idx]);
    }

    // Fallback a Prisma si era una solicitud en DB
    if (process.env.DATABASE_URL) {
      const updated = await prisma.adoptionApplication.update({
        where: { id: body.id },
        data: {
          status: body.status,
          evaluatorNotes:
            typeof body.evaluatorNotes === "string"
              ? body.evaluatorNotes
              : undefined,
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: "Solicitud no encontrada" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error al actualizar solicitud:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la solicitud" },
      { status: 500 }
    );
  }
}
