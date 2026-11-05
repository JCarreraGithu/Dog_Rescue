import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkContentAccess } from "@/lib/content-auth";
import { getUserFromRequest } from "@/lib/staff-store";
import { body } from "@/lib/intake-validation";
import { intakeFailure, intakeHeaders as headers } from "@/lib/intake-response";
import { dogInput, dogView, dogRelations } from "@/lib/dog-store";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams, deletedOnly = query.get("deletedOnly") === "true";
    const staff = await getUserFromRequest(request);
    if (deletedOnly || staff) { const denied = await checkContentAccess(request, "/api/dogs"); if (denied) return denied; }
    const where: import("@prisma/client").Prisma.DogWhereInput = { isDeleted: deletedOnly, isArchived: false };
    if (!deletedOnly) {
      for (const key of ["ageCategory", "size", "status"] as const) { const value = query.get(key); if (value && value !== "Todos") where[key] = value; }
      const temperament = query.get("temperament"); if (temperament && temperament !== "Todos") where.temperament = { contains: temperament, mode: "insensitive" };
    }
    const rows = await prisma.dog.findMany({ where, ...(staff ? { include: dogRelations } : {}), orderBy: { createdAt: "desc" } });
    return NextResponse.json(rows.map(row => dogView(row, Boolean(staff))), { headers });
  } catch (error) { return intakeFailure(error); }
}
export async function POST(request: Request) {
  try {
    const denied = await checkContentAccess(request, "/api/dogs"); if (denied) return denied;
    const data = dogInput(await body(request), true);
    const row = await prisma.dog.create({ data: { breed: "Mestizo", ageCategory: "Adulto", ageYears: 1, gender: "Macho", size: "Mediano", temperament: "Sociable", status: "En Adopción", rescueHistory: "", healthNotes: "", ...data } as import("@prisma/client").Prisma.DogCreateInput });
    return NextResponse.json(dogView(row, true), { status: 201, headers });
  } catch (error) { return intakeFailure(error); }
}
