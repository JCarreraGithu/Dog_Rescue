import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkContentAccess } from "@/lib/content-auth";
import { getUserFromRequest } from "@/lib/staff-store";
import { body, id, IntakeError } from "@/lib/intake-validation";
import { intakeFailure, intakeHeaders as headers } from "@/lib/intake-response";
import { dogInput, dogView, dogRelations } from "@/lib/dog-store";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    const staff = await getUserFromRequest(request);
    if (staff) { const denied = await checkContentAccess(request, "/api/dogs"); if (denied) return denied; }
    const row = await prisma.dog.findUnique({ where: { id: id((await context.params).id) }, ...(staff ? { include: { ...dogRelations, applications: { orderBy: { createdAt: "desc" } } } } : {}) });
    if (!row || row.isArchived || (!staff && row.isDeleted)) throw new IntakeError("Perrito no encontrado.", 404);
    return NextResponse.json(dogView(row, Boolean(staff)), { headers });
  } catch (error) { return intakeFailure(error); }
}
export async function PUT(request: Request, context: Context) {
  try {
    const denied = await checkContentAccess(request, "/api/dogs"); if (denied) return denied;
    const row = await prisma.dog.update({ where: { id: id((await context.params).id), isArchived: false }, data: dogInput(await body(request)) });
    return NextResponse.json(dogView(row, true), { headers });
  } catch (error) { return intakeFailure(error); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const denied = await checkContentAccess(request, "/api/dogs"); if (denied) return denied;
    const dogId = id((await context.params).id);
    // Se conserva siempre el historial y sus relaciones, incluso al vaciar la papelera.
    const row = await prisma.dog.updateMany({ where: { id: dogId }, data: { isDeleted: true, deletedAt: new Date(), ...(new URL(request.url).searchParams.get("permanent") === "true" ? { isArchived: true } : {}) } });
    if (!row.count) throw new IntakeError("Perrito no encontrado.", 404);
    return NextResponse.json({ success: true }, { headers });
  } catch (error) { return intakeFailure(error); }
}
