import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkContentAccess } from "@/lib/content-auth";
import { body } from "@/lib/intake-validation";
import { intakeFailure, intakeHeaders as headers } from "@/lib/intake-response";
import { getStoreProducts, productInput, productView } from "@/lib/store";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return NextResponse.json(await getStoreProducts(), { headers }); } catch (error) { return intakeFailure(error); }
}
export async function POST(request: Request) {
  try {
    const denied = await checkContentAccess(request, "/api/products"); if (denied) return denied;
    const data = productInput(await body(request), true);
    const row = await prisma.storeProduct.create({ data: { name: data.name as string, price: data.price as number, description: "Producto solidario a beneficio de los perritos rescatados.", category: "Playeras", stock: 10, ...data } as import("@prisma/client").Prisma.StoreProductCreateInput });
    return NextResponse.json(productView(row), { status: 201, headers });
  } catch (error) { return intakeFailure(error); }
}
