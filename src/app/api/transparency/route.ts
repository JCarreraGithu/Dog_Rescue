import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkContentAccess } from "@/lib/content-auth";
import { body, IntakeError } from "@/lib/intake-validation";
import { numberField } from "@/lib/admin-validation";
import { intakeFailure, intakeHeaders as headers } from "@/lib/intake-response";
export const dynamic = "force-dynamic";
const labels = { rescues_count: "Perros Rescatados", adoptions_count: "Adopciones Integradas", sterilizations_count: "Esterilizaciones" };
export async function GET() {
  try { return NextResponse.json(await prisma.transparencyStat.findMany({ orderBy: { key: "asc" } }), { headers }); } catch (error) { return intakeFailure(error); }
}
export async function PUT(request: Request) {
  try {
    const denied = await checkContentAccess(request, "/api/transparency"); if (denied) return denied;
    const input = await body(request), entries = input.key !== undefined ? [[input.key, input.value]] : Object.entries(input);
    if (!entries.length) throw new IntakeError("No hay cifras para guardar.");
    const changes = entries.map(([key, value]) => {
      if (typeof key !== "string" || !Object.hasOwn(labels, key)) throw new IntakeError("Cifra desconocida.");
      return { key: key as keyof typeof labels, value: numberField(value, true) };
    });
    const rows = await prisma.$transaction(async tx => {
      for (const { key, value } of changes) await tx.transparencyStat.upsert({ where: { key }, create: { key, value, label: labels[key] }, update: { value } });
      return tx.transparencyStat.findMany({ orderBy: { key: "asc" } });
    });
    return NextResponse.json(rows, { headers });
  } catch (error) { return intakeFailure(error); }
}
