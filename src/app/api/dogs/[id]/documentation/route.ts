import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { getUserFromToken } from "@/lib/staff-store";
import {
  getLocalDogs,
  saveLocalDogs,
  buildDefaultDogDocumentation,
  DogDocumentation,
  getLocalApplications,
  getLocalCaseReports,
} from "@/lib/local-records";
import { addNotification } from "@/lib/notifications";

async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getUserFromToken(token);
}

// OBTENER DOCUMENTACIÓN POR CICLO DE VIDA (ETAPAS 1, 2 Y 3)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const localDogs = await getLocalDogs();
    const dog = localDogs.find((d) => d.id === id);

    if (!dog) {
      return NextResponse.json(
        { error: "Expediente canino no encontrado" },
        { status: 404 }
      );
    }

    const documentation =
      dog.documentation || buildDefaultDogDocumentation(dog);

    const allApplications = await getLocalApplications();
    const dogApplications = allApplications.filter((a) => a.dogId === id);

    const caseReports = await getLocalCaseReports();

    return NextResponse.json({
      dog,
      documentation,
      dogApplications,
      caseReports,
    });
  } catch (error) {
    console.error("Error al obtener documentación del perrito:", error);
    return NextResponse.json(
      { error: "Error al obtener documentación" },
      { status: 500 }
    );
  }
}

// GUARDAR DOCUMENTACIÓN DEL PERRITO Y SINCRONIZAR ESTADO DEL EXPEDIENTE
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
    const incomingDoc = body?.documentation as DogDocumentation | undefined;

    if (!incomingDoc) {
      return NextResponse.json(
        { error: "Datos de documentación inválidos" },
        { status: 400 }
      );
    }

    const localDogs = await getLocalDogs();
    const index = localDogs.findIndex((d) => d.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: "Expediente canino no encontrado" },
        { status: 404 }
      );
    }

    const currentDog = localDogs[index];
    const updatedDoc: DogDocumentation = {
      ...buildDefaultDogDocumentation(currentDog),
      ...incomingDoc,
      updatedAt: new Date().toISOString(),
    };

    // Sincronizar estado general del perrito según el avance documental
    let nextStatus = currentDog.status;
    if (updatedDoc.adoption?.adoptionCompleted) {
      nextStatus = "Adoptado";
    } else if (updatedDoc.rehabilitation?.rehabCompleted) {
      nextStatus = "En Adopción";
    } else {
      nextStatus = "En Tratamiento";
    }

    const nextSterilized = Boolean(updatedDoc.rehabilitation?.sterilized);

    localDogs[index] = {
      ...currentDog,
      isSterilized: nextSterilized,
      status: nextStatus,
      documentation: updatedDoc,
    };

    await saveLocalDogs(localDogs);

    await addNotification({
      type: "system",
      title: `Documentación actualizada: ${currentDog.name}`,
      message: `Se actualizaron las etapas documentales (Ingreso: ${
        updatedDoc.arrival.intakeCompleted ? "Completo" : "En curso"
      }, Rehabilitación: ${
        updatedDoc.rehabilitation.rehabCompleted ? "Completa" : "En curso"
      }, Adopción: ${
        updatedDoc.adoption.adoptionCompleted ? "Formalizada" : "Pendiente"
      }). Estado actual: ${nextStatus}.`,
      targetTab: "dogs",
      metadata: { dogId: currentDog.id },
    });

    return NextResponse.json(localDogs[index]);
  } catch (error) {
    console.error("Error al guardar documentación del perrito:", error);
    return NextResponse.json(
      { error: "No se pudo guardar la documentación" },
      { status: 500 }
    );
  }
}
