import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { cookies } from "next/headers";
import fs from "node:fs/promises";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token || !(await verifySessionToken(token))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = await context.params;
    const vol = await prisma.volunteer.findUnique({ where: { id } });
    if (!vol) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    const templatePath = path.join(process.cwd(), "src", "templates", "Plantilla_Voluntariado_DOG_Rescue.docx");
    const bytes = await fs.readFile(templatePath);
    const doc = new Docxtemplater(new PizZip(bytes), {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    });
    doc.render({
      nombre: vol.name || "",
      telefono: vol.phone || "",
      edad: vol.age == null ? "No registrada" : String(vol.age),
      dias: vol.availableDays?.join(", ") || "No registrados",
      compromiso: vol.commitmentDuration || "No registrado",
      areas: vol.interestAreas?.join(", ") || "No registradas",
      experiencia: vol.animalExperience || "________________________________________",
      motivacion: vol.motivation || "________________________________________",
      seguridad: vol.acceptsSafetyRules === true ? "Sí" : "Sin respuesta",
      datos: vol.authorizesDataUse === true ? "Sí" : "Sin respuesta",
      estado: vol.status,
      notas: vol.evaluatorNotes || "",
    });
    const buffer = doc.toBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Voluntariado_${id.slice(0, 8)}.docx"`,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error al generar Word de voluntariado:", error);
    return NextResponse.json({ error: "No se pudo generar el Word." }, { status: 500 });
  }
}
