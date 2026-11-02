import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

// El mismo bloqueo se utiliza en importación, equipo y cambios de contraseña.
// A diferencia de una cola JS, coordina todas las instancias de Vercel.
export async function withStaffTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(74190216)`;
      return fn(tx);
    }, { maxWait: 10000, timeout: 15000 });
  } catch {
    throw new Error("La operación del personal no pudo completarse.");
  }
}
