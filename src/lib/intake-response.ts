import { NextResponse } from "next/server";
import { IntakeError } from "@/lib/intake-validation";
export const intakeHeaders = { "Cache-Control": "no-store" };
export function intakeFailure(error: unknown) {
  if (error instanceof IntakeError) return NextResponse.json({ error: error.message }, { status: error.status, headers: intakeHeaders });
  if (error && typeof error === "object" && "code" in error && error.code === "P2025") return NextResponse.json({ error: "Registro no encontrado." }, { status: 404, headers: intakeHeaders });
  return NextResponse.json({ error: "No se pudo guardar o consultar el registro. Inténtalo de nuevo." }, { status: 503, headers: intakeHeaders });
}
