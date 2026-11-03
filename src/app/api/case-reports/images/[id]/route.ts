import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { intakeFailure } from "@/lib/intake-response";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse(null, { status: 404 });
    const image = await prisma.reportImage.findUnique({ where: { id } });
    if (!image || image.received !== image.totalSize) return new NextResponse(null, { status: 404 });
    return new NextResponse(new Uint8Array(image.content), { headers: { "Content-Type": image.contentType, "Content-Length": String(image.content.length), "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return intakeFailure(error); }
}
