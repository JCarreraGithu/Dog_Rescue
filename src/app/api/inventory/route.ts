import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkContentAccess } from "@/lib/content-auth";
import { body, id, IntakeError } from "@/lib/intake-validation";
import { stringField, numberField } from "@/lib/admin-validation";
import { intakeFailure, intakeHeaders as headers } from "@/lib/intake-response";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { const denied = await checkContentAccess(request, "/api/inventory"); if (denied) return denied; return NextResponse.json(await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }), { headers }); }
  catch (error) { return intakeFailure(error); }
}
export async function POST(request: Request) {
  try {
    const denied = await checkContentAccess(request, "/api/inventory"); if (denied) return denied;
    const input = await body(request);
    const row = await prisma.inventoryItem.create({ data: { name: stringField(input.name, true), category: input.category === undefined ? "Concentrado" : stringField(input.category, true), unit: input.unit === undefined ? "costales" : stringField(input.unit, true), quantity: numberField(input.quantity ?? 0), minThreshold: numberField(input.minThreshold ?? 5) } });
    return NextResponse.json(row, { status: 201, headers });
  } catch (error) { return intakeFailure(error); }
}
export async function PUT(request: Request) {
  try {
    const denied = await checkContentAccess(request, "/api/inventory"); if (denied) return denied;
    const input = await body(request), itemId = id(input.id);
    const row = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "InventoryItem" WHERE id = ${itemId} FOR UPDATE`;
      const current = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!current) throw new IntakeError("Insumo no encontrado.", 404);
      let quantity: number;
      if (input.setQuantity !== undefined) quantity = numberField(input.setQuantity);
      else {
        if ((typeof input.quantityChange !== "number" && typeof input.quantityChange !== "string") || input.quantityChange === "" || !Number.isFinite(Number(input.quantityChange))) throw new IntakeError("Cambio de cantidad inválido.");
        quantity = numberField(Math.max(0, current.quantity + Number(input.quantityChange)));
      }
      return tx.inventoryItem.update({ where: { id: itemId }, data: { quantity } });
    });
    return NextResponse.json(row, { headers });
  } catch (error) { return intakeFailure(error); }
}
export async function DELETE(request: Request) {
  try {
    const denied = await checkContentAccess(request, "/api/inventory"); if (denied) return denied;
    await prisma.inventoryItem.delete({ where: { id: id((await body(request)).id) } });
    return NextResponse.json({ success: true }, { headers });
  } catch (error) { return intakeFailure(error); }
}
