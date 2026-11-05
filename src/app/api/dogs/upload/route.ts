import { NextResponse } from "next/server";
import { checkContentAccess } from "@/lib/content-auth";
import { uploadReportImage } from "@/lib/report-images";
import { IntakeError } from "@/lib/intake-validation";
import { intakeFailure, intakeHeaders as headers } from "@/lib/intake-response";
export async function POST(request: Request) {
  try {
    const denied = await checkContentAccess(request, "/api/dogs/upload"); if (denied) return denied;
    let form: FormData;
    try { form = await request.formData(); } catch { throw new IntakeError("Formulario de imagen inválido."); }
    return NextResponse.json(await uploadReportImage(form, form.get("private") === "true"), { status: 201, headers });
  } catch (error) { return intakeFailure(error); }
}
