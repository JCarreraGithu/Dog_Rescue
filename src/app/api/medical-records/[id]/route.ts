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

// EDITAR, COMPLETAR O CANCELAR UNA CITA
export async function PATCH(
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
    let updatedLocalRecord: any = null;

    for (const dog of localDogs) {
      if (Array.isArray(dog.medicalRecords)) {
        const recIdx = dog.medicalRecords.findIndex((r: any) => r.id === id);
        if (recIdx !== -1) {
          dog.medicalRecords[recIdx] = {
            ...dog.medicalRecords[recIdx],
            ...(body.type !== undefined ? { type: body.type } : {}),
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.date !== undefined ? { date: new Date(body.date).toISOString() } : {}),
            ...(body.vetName !== undefined ? { vetName: body.vetName } : {}),
            ...(body.status !== undefined ? { status: body.status } : {}),
          };
          updatedLocalRecord = dog.medicalRecords[recIdx];
          await saveLocalDogs(localDogs);
          break;
        }
      }
    }

    if (process.env.DATABASE_URL) {
      try {
        const data: any = {};
        if (body.type !== undefined) data.type = body.type;
        if (body.title !== undefined) data.title = body.title;
        if (body.description !== undefined) data.description = body.description;
        if (body.date !== undefined) data.date = new Date(body.date);
        if (body.vetName !== undefined) data.vetName = body.vetName;
        if (body.status !== undefined) data.status = body.status;

        const updatedDb = await prisma.medicalRecord.update({
          where: { id },
          data,
        });
        return NextResponse.json(updatedDb);
      } catch {
        if (updatedLocalRecord) return NextResponse.json(updatedLocalRecord);
      }
    }

    if (updatedLocalRecord) {
      return NextResponse.json(updatedLocalRecord);
    }

    return NextResponse.json(
      { error: "Registro médico no encontrado" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error al actualizar cita médica:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la cita médica" },
      { status: 500 }
    );
  }
}
