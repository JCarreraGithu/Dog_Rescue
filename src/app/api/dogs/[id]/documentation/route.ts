import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkContentAccess } from "@/lib/content-auth";
import { body, id, IntakeError } from "@/lib/intake-validation";
import { intakeFailure, intakeHeaders as headers } from "@/lib/intake-response";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
import { emptyDocumentation, documentationInput, dogView } from "@/lib/dog-store";
import { getApplications, getReports } from "@/lib/intake-store";
import { addNotification } from "@/lib/notifications";
export async function GET(request: Request, context: Context) {
  try {
    const denied = await checkContentAccess(request, "/api/dogs/documentation"); if (denied) return denied;
    const dogId = id((await context.params).id), dog = await prisma.dog.findUnique({ where: { id: dogId } });
    if (!dog || dog.isArchived) throw new IntakeError("Expediente no encontrado.", 404);
    return NextResponse.json({ dog: dogView(dog, true), documentation: dog.documentation ?? emptyDocumentation(dog), dogApplications: (await getApplications()).filter(a => a.dogId === dogId), caseReports: await getReports() }, { headers });
  } catch (error) { return intakeFailure(error); }
}
export async function PUT(request: Request, context: Context) {
  try {
    const denied = await checkContentAccess(request, "/api/dogs/documentation"); if (denied) return denied;
    const dogId = id((await context.params).id), input = await body(request);
    const row = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Dog" WHERE id = ${dogId} FOR UPDATE`;
      const dog = await tx.dog.findUnique({ where: { id: dogId } });
      if (!dog || dog.isDeleted) throw new IntakeError("Expediente no encontrado.", 404);
      const defaults = dog.documentation ? documentationInput(dog.documentation, emptyDocumentation(dog)) : emptyDocumentation(dog);
      const doc = documentationInput(input.documentation, defaults);
      const status = doc.adoption.adoptionCompleted ? "Adoptado" : doc.rehabilitation.rehabCompleted ? "En Adopción" : "En Tratamiento";
      const updated = await tx.dog.update({ where: { id: dogId }, data: { documentation: doc as unknown as import("@prisma/client").Prisma.InputJsonObject, isSterilized: doc.rehabilitation.sterilized, status } });
      await addNotification({ type: "system", title: "Documentación actualizada: " + dog.name, message: "Se actualizaron las etapas documentales. Estado actual: " + status + ".", targetTab: "dogs", metadata: { dogId } }, tx);
      return updated;
    });
    return NextResponse.json(row, { headers });
  } catch (error) { return intakeFailure(error); }
}
