import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkContentAccess } from "@/lib/content-auth";
import { body, id, IntakeError } from "@/lib/intake-validation";
import { intakeFailure, intakeHeaders as headers } from "@/lib/intake-response";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
import { medicalInput } from "@/lib/dog-store";
export async function POST(request: Request, context: Context) {
  try {
    const denied = await checkContentAccess(request, "/api/dogs/medical"); if (denied) return denied;
    const dogId = id((await context.params).id), patch = medicalInput(await body(request), true);
    const row = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Dog" WHERE id = ${dogId} FOR UPDATE`;
      const dog = await tx.dog.findUnique({ where: { id: dogId } });
      if (!dog || dog.isDeleted) throw new IntakeError("Perrito no encontrado.", 404);
      return tx.medicalRecord.create({ data: { dogId, type: "Consulta", description: "", vetName: "Dra. María Morales", status: "Programado", ...patch } as import("@prisma/client").Prisma.MedicalRecordUncheckedCreateInput });
    });
    return NextResponse.json(row, { status: 201, headers });
  } catch (error) { return intakeFailure(error); }
}
