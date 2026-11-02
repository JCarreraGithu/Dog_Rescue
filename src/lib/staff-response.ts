import { NextResponse } from "next/server";

// No devolver ni registrar errores Prisma: podrían incluir parámetros privados.
export function staffUnavailable() {
  return NextResponse.json({ error: "El servicio administrativo no está disponible temporalmente." }, { status: 503 });
}
