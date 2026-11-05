import { checkContentAccess } from "@/lib/content-auth";
import { intakeFailure } from "@/lib/intake-response";
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { getVolunteer } from "@/lib/intake-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await checkContentAccess(_request, "/api/volunteers"); if (denied) return denied;
    const { id } = await context.params;
    const vol = await getVolunteer(id);

    if (!vol) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    const templatePath = path.join(
      process.cwd(),
      "src",
      "templates",
      "Plantilla_Voluntariado_DOG_Rescue.docx"
    );
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
      experiencia:
        vol.animalExperience || "________________________________________",
      motivacion: vol.motivation || "________________________________________",
      seguridad: vol.acceptsSafetyRules === true ? "Sí" : "Sin respuesta",
      datos: vol.authorizesDataUse === true ? "Sí" : "Sin respuesta",
      estado: vol.status,
      notas: vol.evaluatorNotes || "",
    });
    const buffer = doc.toBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Voluntariado_${id.slice(
          0,
          8
        )}.docx"`,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    return intakeFailure(error);
  }
}
