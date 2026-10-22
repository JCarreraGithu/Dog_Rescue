
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Verifica que exista una sesión administrativa válida.
async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return verifySessionToken(token);
}

// CONSULTAR EXPEDIENTE CANINO
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      return NextResponse.json(
        { error: "Perro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(dog);
  } catch (error) {
    console.error("Error al obtener expediente:", error);

    return NextResponse.json(
      { error: "Error al obtener el expediente canino" },
      { status: 500 }
    );
  }
}

// ACTUALIZAR HISTORIA DE RESCATE Y NOTAS DE SALUD
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación administrativa.
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validar los campos recibidos.
    if (
      !body ||
      typeof body.rescueHistory !== "string" ||
      typeof body.healthNotes !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "La Historia de Rescate y las Notas de Salud deben ser textos válidos",
        },
        { status: 400 }
      );
    }

    // Actualizar únicamente los dos campos permitidos.
    const updatedDog = await prisma.dog.update({
      where: { id },
      data: {
        rescueHistory: body.rescueHistory,
        healthNotes: body.healthNotes,
      },
    });

    return NextResponse.json(updatedDog);
  } catch (error) {
    console.error("Error al actualizar expediente:", error);

    return NextResponse.json(
      { error: "Error al actualizar el expediente canino" },
      { status: 500 }
    );
  }
}


  // ARCHIVAR EXPEDIENTE CANINO SIN BORRAR SUS DATOS
  export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      // Solo administradores autenticados
      if (!(await isAdminAuthenticated())) {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        );
      }

      const { id } = await params;

      // Comprobar que el perrito existe y está activo
      const dog = await prisma.dog.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!dog) {
        return NextResponse.json(
          { error: "Perrito no encontrado o ya eliminado" },
          { status: 404 }
        );
      }

      // Eliminación lógica: conservar datos en Neon
      await prisma.dog.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Perrito eliminado de los expedientes activos",
      });
    } catch (error) {
      console.error("Error al eliminar expediente:", error);

      return NextResponse.json(
        { error: "Error al eliminar el expediente canino" },
        { status: 500 }
      );
    }
  }
