import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const apps = await prisma.adoptionApplication.findMany({
      include: {
        dog: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(apps);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al obtener postulaciones", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const app = await prisma.adoptionApplication.create({
      data: {
        dogId: body.dogId || null,
        applicantName: body.applicantName,
        applicantEmail: body.applicantEmail,
        applicantPhone: body.applicantPhone,
        applicantAddress: body.applicantAddress,
        homeType: body.homeType || "Casa",
        hasYard: Boolean(body.hasYard),
        hasOtherPets: Boolean(body.hasOtherPets),
        status: "Pendiente",
      },
    });

    return NextResponse.json(app, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al registrar postulación", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json(); // { id, status, evaluatorNotes }
    const updated = await prisma.adoptionApplication.update({
      where: { id: body.id },
      data: {
        status: body.status,
        evaluatorNotes: body.evaluatorNotes,
      },
    });

    // Si la solicitud es Aprobada y tiene un perrito asociado, podemos actualizar el estado del perrito a Adoptado
    if (body.status === "Aprobado" && updated.dogId) {
      await prisma.dog.update({
        where: { id: updated.dogId },
        data: { status: "Adoptado" },
      });
      // Y actualizar contador de adopciones
      await prisma.transparencyStat.updateMany({
        where: { key: "adoptions_count" },
        data: { value: { increment: 1 } },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al actualizar estado de postulación", details: error.message },
      { status: 500 }
    );
  }
}
