import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  // No registrar consultas ni parámetros: el personal incluye hashes privados.
  new PrismaClient({ log: [] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
