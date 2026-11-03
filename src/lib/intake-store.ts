import type { Prisma, AdoptionApplication } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { StoreOrder } from "@/lib/local-records";
import { IntakeError } from "@/lib/intake-validation";

export const dogInclude = { dog: { select: { id: true, name: true, photoUrl: true } } } as const;
export function applicationView(row: AdoptionApplication & { dog?: { id: string; name: string; photoUrl: string } | null }) {
  const snap = row.dogSnapshot && typeof row.dogSnapshot === 'object' && !Array.isArray(row.dogSnapshot) ? row.dogSnapshot : null;
  const snapshot = snap && typeof snap.id === 'string' && typeof snap.name === 'string' && typeof snap.photoUrl === 'string' ? { id: snap.id, name: snap.name, photoUrl: snap.photoUrl } : null;
  return { ...row, dogId: row.dogId ?? snapshot?.id ?? null, dog: row.dog ?? snapshot, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
export async function getApplications() {
  return (await prisma.adoptionApplication.findMany({ include: dogInclude, orderBy: { createdAt: 'desc' } })).map(applicationView);
}
export async function getApplication(id: string) {
  const row = await prisma.adoptionApplication.findUnique({ where: { id }, include: dogInclude });
  return row ? applicationView(row) : null;
}
export async function getVolunteers() {
  return (await prisma.volunteer.findMany({ orderBy: { createdAt: 'desc' } })).map(row => ({ ...row, createdAt: row.createdAt.toISOString() }));
}
export async function getVolunteer(id: string) {
  const row = await prisma.volunteer.findUnique({ where: { id } });
  return row ? { ...row, createdAt: row.createdAt.toISOString() } : null;
}
export async function getReports(client: Pick<Prisma.TransactionClient, 'caseReport'> = prisma) {
  return (await client.caseReport.findMany({ orderBy: { createdAt: 'desc' } })).map(row => ({ ...row, photos: row.photos.length ? row.photos : row.photoUrl ? [row.photoUrl] : [], createdAt: row.createdAt.toISOString() }));
}
type OrderClient = Pick<Prisma.TransactionClient, 'storeOrder'>;
export async function getOrders(client: OrderClient = prisma): Promise<StoreOrder[]> {
  const rows = await client.storeOrder.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  return rows.map(row => {
    if (!Array.isArray(row.items)) throw new IntakeError('El pedido almacenado no es válido.', 503);
    return { ...row, items: row.items as StoreOrder['items'], deliveryMethod: row.deliveryMethod as StoreOrder['deliveryMethod'], paymentMethod: row.paymentMethod as StoreOrder['paymentMethod'], paymentStatus: row.paymentStatus as StoreOrder['paymentStatus'], status: row.status as StoreOrder['status'], createdAt: row.createdAt.toISOString() };
  });
}
