import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getLocalCaseReports,
  saveLocalCaseReports,
} from "@/lib/local-records";
import { addNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const localReports = await getLocalCaseReports();
    if (process.env.DATABASE_URL) {
      try {
        const reports = await prisma.caseReport.findMany({
          orderBy: { createdAt: "desc" },
        });
        const merged = [
          ...localReports,
          ...reports.filter((r) => !localReports.some((l) => l.id === r.id)),
        ];
        return NextResponse.json(merged, {
          headers: { "Cache-Control": "no-store" },
        });
      } catch {
        // Fallback a reportes locales
      }
    }
    return NextResponse.json(localReports, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const photos: string[] = Array.isArray(body.photos)
      ? body.photos.map((p: unknown) => String(p).trim()).filter(Boolean)
      : typeof body.photoUrl === "string" && body.photoUrl.trim()
      ? [body.photoUrl.trim()]
      : [];

    const mainPhoto = photos[0] || null;

    const newReport = {
      id: `REP-${Date.now().toString().slice(-6)}`,
      reporterName: (body.reporterName || "Ciudadano").trim(),
      reporterPhone: (body.reporterPhone || "").trim(),
      locationAddress: (body.locationAddress || "Amatitlán").trim(),
      description: (body.description || "").trim(),
      photoUrl: mainPhoto,
      photos,
      urgencyLevel: body.urgencyLevel || "Media",
      status: "Recibido",
      adminNotes: "",
      createdAt: new Date().toISOString(),
    };

    const current = await getLocalCaseReports();
    await saveLocalCaseReports([newReport, ...current]);

    await addNotification({
      type: "case_report",
      title: `Reporte de Perrito en Riesgo • Urgencia ${newReport.urgencyLevel}${
        photos.length > 0 ? ` (${photos.length} foto${photos.length > 1 ? "s" : ""})` : ""
      }`,
      message: `${newReport.reporterName} (Tel: ${newReport.reporterPhone}) reportó en "${newReport.locationAddress}": ${newReport.description}`,
      targetTab: "case-reports",
      metadata: {
        reportId: newReport.id,
        photoUrl: mainPhoto,
        urgencyLevel: newReport.urgencyLevel,
      },
    });

    if (process.env.DATABASE_URL) {
      try {
        await prisma.caseReport.create({
          data: {
            reporterName: newReport.reporterName,
            reporterPhone: newReport.reporterPhone,
            locationAddress: newReport.locationAddress,
            description: newReport.description,
            photoUrl: newReport.photoUrl,
            urgencyLevel: newReport.urgencyLevel,
            status: "Recibido",
          },
        });
      } catch {
        // Ya guardado localmente
      }
    }

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al enviar el reporte de caso", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, adminNotes, urgencyLevel } = body;
    const reports = await getLocalCaseReports();

    const updated = reports.map((r) =>
      r.id === id
        ? {
            ...r,
            status: status !== undefined ? status : r.status,
            adminNotes: adminNotes !== undefined ? adminNotes : r.adminNotes,
            urgencyLevel:
              urgencyLevel !== undefined ? urgencyLevel : r.urgencyLevel,
          }
        : r
    );

    await saveLocalCaseReports(updated);
    return NextResponse.json({ ok: true, reports: updated });
  } catch (error) {
    console.error("Error al actualizar reporte de caso:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el reporte" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Falta ID del reporte" }, { status: 400 });
    }
    const reports = await getLocalCaseReports();
    const filtered = reports.filter((r) => r.id !== id);
    await saveLocalCaseReports(filtered);
    return NextResponse.json({ ok: true, reports: filtered });
  } catch (error) {
    console.error("Error al eliminar reporte:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el reporte" },
      { status: 500 }
    );
  }
}
