import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const saturdayDate = searchParams.get("saturdayDate");

    const whereClause: any = {};
    if (saturdayDate) {
      whereClause.saturdayDate = saturdayDate;
    }

    const volunteers = await prisma.volunteer.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(volunteers);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al listar voluntarios", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newVolunteer = await prisma.volunteer.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        saturdayDate: body.saturdayDate,
        assignedTask: body.assignedTask || "Cuidado General",
        status: body.status || "Confirmado",
      },
    });

    return NextResponse.json(newVolunteer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al registrar voluntario", details: error.message },
      { status: 500 }
    );
  }
}
