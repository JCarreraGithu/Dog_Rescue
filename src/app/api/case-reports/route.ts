import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const reports = await prisma.caseReport.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reports);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al cargar reportes de casos", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newReport = await prisma.caseReport.create({
      data: {
        reporterName: body.reporterName,
        reporterPhone: body.reporterPhone,
        locationAddress: body.locationAddress,
        description: body.description,
        photoUrl: body.photoUrl || null,
        urgencyLevel: body.urgencyLevel || "Media",
        status: "Recibido",
      },
    });

    return NextResponse.json(newReport, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al enviar el reporte de caso", details: error.message },
      { status: 500 }
    );
  }
}
