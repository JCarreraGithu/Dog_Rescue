import type { PrismaClient, Prisma } from "@prisma/client";
import { isDeepStrictEqual } from "node:util";
import { ORDER_STATUSES } from "./intake-validation";

export class OrderImportError extends Error {}
const requiredText = ['id', 'customerName', 'customerPhone', 'deliveryMethod', 'paymentMethod', 'paymentStatus', 'status', 'createdAt'] as const;
const optionalText = ['department', 'shippingAddress', 'paymentReference', 'trackingNumber', 'adminNotes', 'note'] as const;
const amounts = ['shippingFee', 'subtotal', 'total'] as const;
export function validateOrderImport(input: unknown) {
  if (!Array.isArray(input)) throw new OrderImportError('El archivo debe contener una lista de pedidos.');
  const ids = new Set<string>();
  return input.map((row, index) => {
    const fail = () => { throw new OrderImportError(`Pedido ${index + 1}: estructura o dato no válido.`); };
    if (!row || typeof row !== 'object' || Array.isArray(row)) return fail();
    const value = row as Record<string, unknown>;
    if (Object.keys(value).some(key => ![...requiredText, ...optionalText, ...amounts, 'items'].includes(key))) return fail();
    for (const key of requiredText) if (typeof value[key] !== 'string' || !value[key]) return fail();
    if (ids.has(value.id as string)) return fail();
    ids.add(value.id as string);
    if (!Number.isFinite(Date.parse(value.createdAt as string)) || new Date(value.createdAt as string).toISOString() !== value.createdAt) return fail();
    if (!ORDER_STATUSES.includes(value.status as string) || !['Pendiente', 'Verificado'].includes(value.paymentStatus as string) || !['Cargo Expreso', 'Recoger en Sede'].includes(value.deliveryMethod as string) || !['Transferencia / Depósito', 'Efectivo Contra Entrega'].includes(value.paymentMethod as string)) return fail();
    for (const key of amounts) if (typeof value[key] !== 'number' || !Number.isFinite(value[key]) || (value[key] as number) < 0) return fail();
    if (!Array.isArray(value.items) || !value.items.length || !value.items.every(item => item && typeof item === 'object' && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0 && Number.isInteger(item.qty) && item.qty > 0 && (item.size === undefined || typeof item.size === 'string'))) return fail();
    const strings = Object.fromEntries(optionalText.map(key => { if (value[key] !== undefined && typeof value[key] !== 'string') return fail(); return [key, value[key] ?? '']; })) as Record<typeof optionalText[number], string>;
    return { ...strings, id: value.id as string, customerName: value.customerName as string, customerPhone: value.customerPhone as string, deliveryMethod: value.deliveryMethod as string, paymentMethod: value.paymentMethod as string, paymentStatus: value.paymentStatus as string, status: value.status as string, createdAt: new Date(value.createdAt as string), shippingFee: value.shippingFee as number, subtotal: value.subtotal as number, total: value.total as number, items: value.items as Prisma.InputJsonArray };
  });
}
export async function importOrders(client: PrismaClient, input: unknown, apply = false) {
  const orders = validateOrderImport(input);
  try {
    return await client.$transaction(async tx => {
      await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(74190219)`;
      const existing = await tx.storeOrder.findMany({ where: { id: { in: orders.map(order => order.id) } } });
      const pending = [];
      for (const order of orders) {
        const row = existing.find(other => other.id === order.id);
        if (!row) { pending.push(order); continue; }
        if (!isDeepStrictEqual(row, order)) throw new Error('Conflicto de pedido.');
      }
      if (apply) for (const order of pending) await tx.storeOrder.create({ data: order });
      return { total: orders.length, pending: pending.length, unchanged: existing.length, inserted: apply ? pending.length : 0 };
    });
  } catch { throw new OrderImportError('Importación cancelada por conflicto o fallo de base de datos. No se sobrescribieron pedidos.'); }
}
