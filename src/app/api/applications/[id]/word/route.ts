import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFile } from "node:fs/promises";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const respuesta = (value: boolean | null) =>
  value === null ? "________________" : value ? "Sí" : "No";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!(await verifySessionToken(token))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const application = await prisma.adoptionApplication.findUnique({
      where: { id },
      include: { dog: { select: { name: true } } },
    });
    if (!application) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    const templatePath = path.join(process.cwd(), "src", "templates", "Plantilla_Adopcion_DOG_Rescue.docx");
    const templateBytes = await readFile(templatePath);
    const doc = new Docxtemplater(new PizZip(templateBytes), {
      delimiters: { start: "{{", end: "}}" },
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render({
      nombre: application.applicantName,
      edad: application.applicantAge?.toString() || "________________",
      telefono: application.applicantPhone,
      tipo_mascota: "Perro",
      mascota: application.dog?.name || "________________",
      permiso: respuesta(application.petsAllowed),
      seguridad: respuesta(application.safeHome),
      espacio: respuesta(application.enoughSpace),
      ambientes: application.petAccess || "________________",
      conoce_libertades: respuesta(application.knowsFiveFreedoms),
      compromiso_libertades: respuesta(application.commitsToWelfare),
      esterilizacion: respuesta(application.commitsToSterilize),
    });

    const buffer = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="adopcion-${id.slice(0, 8)}.docx"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error generando Word de adopción:", error instanceof Error ? error.name : "desconocido");
    return NextResponse.json({ error: "No se pudo generar el Word" }, { status: 500 });
  }
}
