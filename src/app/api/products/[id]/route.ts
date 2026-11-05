import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkContentAccess } from "@/lib/content-auth";
import { body, id, IntakeError } from "@/lib/intake-validation";
import { intakeFailure, intakeHeaders as headers } from "@/lib/intake-response";
import { productInput, productView } from "@/lib/store";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  try {
    const denied = await checkContentAccess(request, "/api/products"); if (denied) return denied;
    const productId = id((await context.params).id), input = await body(request);
    const stockDelta = input.stockChange === undefined ? undefined : Number(input.stockChange);
    if (stockDelta !== undefined && (!Number.isSafeInteger(stockDelta) || Math.abs(stockDelta) > 10000 || input.stock !== undefined)) throw new IntakeError("Cambio de stock inválido.");
    const patch = productInput(stockDelta === undefined ? input : { ...input, stock: 0 });
    const row = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "StoreProduct" WHERE id = ${productId} FOR UPDATE`;
      const current = await tx.storeProduct.findUnique({ where: { id: productId } });
      if (!current || current.isDeleted) throw new IntakeError("Producto no encontrado.", 404);
      if (stockDelta !== undefined) { patch.stock = Math.max(0, current.stock + stockDelta); if (patch.stock === 0) patch.available = false; }
      return tx.storeProduct.update({ where: { id: productId }, data: patch });
    });
    return NextResponse.json(productView(row), { headers });
  } catch (error) { return intakeFailure(error); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const denied = await checkContentAccess(request, "/api/products"); if (denied) return denied;
    const result = await prisma.storeProduct.updateMany({ where: { id: id((await context.params).id), isDeleted: false }, data: { isDeleted: true, available: false } });
    if (!result.count) throw new IntakeError("Producto no encontrado.", 404);
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) { return intakeFailure(error); }
}
