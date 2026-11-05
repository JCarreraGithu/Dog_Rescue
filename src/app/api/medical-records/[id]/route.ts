import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkContentAccess } from "@/lib/content-auth";
import { body, id } from "@/lib/intake-validation";
import { intakeFailure, intakeHeaders as headers } from "@/lib/intake-response";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
import { medicalInput } from "@/lib/dog-store";
export async function PATCH(request: Request, context: Context) {
  try {
    const denied = await checkContentAccess(request, "/api/medical-records"); if (denied) return denied;
    const row = await prisma.medicalRecord.update({ where: { id: id((await context.params).id) }, data: medicalInput(await body(request)) });
    return NextResponse.json(row, { headers });
  } catch (error) { return intakeFailure(error); }
}
