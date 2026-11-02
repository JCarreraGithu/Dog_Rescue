import crypto from "crypto";
import { prisma } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
function keys(ip: string, email: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Autenticación no configurada.");
  return [`ip:${ip}`, `email:${email}`].map((value) =>
    crypto.createHmac("sha256", secret).update(value).digest("hex")
  );
}

// Reserva un intento ANTES de verificar la contraseña; evita carreras entre instancias.
// Se limitan intentos, incluidos los que todavía están en curso (5/cuenta, 10/IP).
export async function reserveLoginAttempt(ip: string, email: string): Promise<boolean> {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(74190217)`;
      const now = new Date();
      const identifiers = keys(ip, email);
      const limits = [10, 5];
      const rows = await tx.loginAttempt.findMany({ where: { key: { in: identifiers } } });
      if (identifiers.some((key, index) => rows.some((r) => r.key === key && r.resetAt > now && r.count >= limits[index]))) return false;
      for (const key of identifiers) {
        const row = rows.find((r) => r.key === key);
        const live = row && row.resetAt > now;
        const data = { count: live ? row.count + 1 : 1, resetAt: live ? row.resetAt : new Date(now.getTime() + WINDOW_MS) };
        await tx.loginAttempt.upsert({ where: { key }, create: { key, ...data }, update: data });
      }
      // Limpieza acotada temporalmente por la ventana; no se guardan IPs/correos en claro.
      await tx.loginAttempt.deleteMany({ where: { resetAt: { lt: now } } });
      return true;
    });
  } catch {
    throw new Error("No se pudo comprobar el límite de acceso.");
  }
}

export async function clearLoginAttempts(ip: string, email: string): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(74190217)`;
      await tx.loginAttempt.deleteMany({ where: { key: { in: keys(ip, email) } } });
    });
  } catch {
    throw new Error("No se pudo actualizar el límite de acceso.");
  }
}
