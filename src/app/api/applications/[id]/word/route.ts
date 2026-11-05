import { checkContentAccess } from "@/lib/content-auth";
import { intakeFailure } from "@/lib/intake-response";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { getApplication } from "@/lib/intake-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const respuesta = (value: boolean | null | undefined) =>
  value === null || value === undefined ? "________________" : value ? "Sí" : "No";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await checkContentAccess(_request, "/api/applications"); if (denied) return denied;

    const { id } = await context.params;
    const application = await getApplication(id);

    if (!application) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    const templatePath = path.join(
      process.cwd(),
      "src",
      "templates",
      "Plantilla_Adopcion_DOG_Rescue.docx"
    );
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

    const buffer = doc
      .getZip()
      .generate({ type: "nodebuffer", compression: "DEFLATE" });
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="adopcion-${id.slice(
          0,
          8
        )}.docx"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return intakeFailure(error);
  }
}
