import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { addNotification } from "@/lib/notifications";
import { checkContentAccess } from "@/lib/content-auth";
import { getOrders } from "@/lib/intake-store";
import { body, text, id, choice, ORDER_STATUSES, IntakeError, object } from "@/lib/intake-validation";
import { intakeFailure, intakeHeaders as headers } from "@/lib/intake-response";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { const denied = await checkContentAccess(request, "/api/orders"); if (denied) return denied; return NextResponse.json(await getOrders(), { headers }); }
  catch (error) { return intakeFailure(error); }
}
export async function POST(request: Request) {
  try {
    const data = await body(request);
    const customerName = text(data.customerName), customerPhone = text(data.customerPhone);
    if (customerName.length < 2 || customerPhone.length < 7) throw new IntakeError("Ingresa tu nombre completo y un teléfono válido.");
    if (!Array.isArray(data.items) || !data.items.length || data.items.length > 100) throw new IntakeError("El pedido no contiene productos válidos.");
    const items = data.items.map(value => {
      const item = object(value); const price = Number(item.price), qty = Number(item.qty);
      if (!Number.isFinite(price) || price < 0 || !Number.isInteger(qty) || qty <= 0 || qty > 10000) throw new IntakeError("Precio o cantidad de producto no válida.");
      return { id: text(item.id), name: text(item.name, "Producto"), ...(typeof item.size === 'string' ? { size: item.size } : {}), price, qty };
    });
    const deliveryMethod = data.deliveryMethod === "Cargo Expreso" ? "Cargo Expreso" : "Recoger en Sede";
    const department = text(data.department), shippingAddress = text(data.shippingAddress);
    if (deliveryMethod === "Cargo Expreso" && (!department || !shippingAddress)) throw new IntakeError("Para envío por Cargo Expreso debes indicar tu Departamento/Municipio y la dirección exacta.");
    const paymentMethod = data.paymentMethod === "Transferencia / Depósito" ? "Transferencia / Depósito" : "Efectivo Contra Entrega";
    const subtotal = Math.round(items.reduce((sum, item) => sum + item.price * item.qty, 0) * 100) / 100;
    const shippingFee = deliveryMethod === "Cargo Expreso" ? 35 : 0, total = subtotal + shippingFee;
    if (!Number.isFinite(total)) throw new IntakeError("Total de pedido no válido.");
    const order = await prisma.$transaction(async tx => {
      const row = await tx.storeOrder.create({ data: { customerName, customerPhone, deliveryMethod, department: deliveryMethod === 'Cargo Expreso' ? department : 'Amatitlán', shippingAddress: deliveryMethod === 'Cargo Expreso' ? shippingAddress : 'Recoger en Sede / Jornada (Amatitlán)', paymentMethod, paymentReference: text(data.paymentReference), note: text(data.note), items: items as Prisma.InputJsonArray, subtotal, shippingFee, total } });
      await addNotification({ type: 'order', title: 'Nuevo Pedido #' + row.id + ' • ' + deliveryMethod + ' (Q' + total + ')', message: customerName + ' (Tel: ' + customerPhone + ') • Pago: ' + paymentMethod + ' • Productos: ' + items.map(i => i.qty + 'x ' + i.name + (i.size ? ' (' + i.size + ')' : '')).join(', '), targetTab: 'store', metadata: { orderId: row.id, total, deliveryMethod, paymentMethod } }, tx);
      return row;
    });
    return NextResponse.json(order, { status: 201, headers });
  } catch (error) { return intakeFailure(error); }
}
export async function PUT(request: Request) {
  try {
    const denied = await checkContentAccess(request, '/api/orders'); if (denied) return denied;
    const data = await body(request), orderId = id(data.id);
    const patch: Prisma.StoreOrderUpdateManyMutationInput = {};
    if (data.status !== undefined) patch.status = choice(data.status, ORDER_STATUSES);
    if (data.paymentStatus !== undefined) patch.paymentStatus = choice(data.paymentStatus, ['Pendiente', 'Verificado']);
    for (const key of ['trackingNumber', 'adminNotes', 'shippingAddress', 'department'] as const) if (data[key] !== undefined) { if (typeof data[key] !== 'string') throw new IntakeError('Campo de pedido no válido.'); patch[key] = data[key]; }
    if (!Object.keys(patch).length) throw new IntakeError('No hay cambios válidos.');
    const orders = await prisma.$transaction(async tx => { const result = await tx.storeOrder.updateMany({ where: { id: orderId }, data: patch }); if (!result.count) throw new IntakeError('Pedido no encontrado.', 404); return getOrders(tx); });
    return NextResponse.json({ ok: true, orders }, { headers });
  } catch (error) { return intakeFailure(error); }
}
export async function DELETE(request: Request) {
  try {
    const denied = await checkContentAccess(request, '/api/orders'); if (denied) return denied;
    const orderId = id(new URL(request.url).searchParams.get('id'));
    const orders = await prisma.$transaction(async tx => { const result = await tx.storeOrder.deleteMany({ where: { id: orderId } }); if (!result.count) throw new IntakeError('Pedido no encontrado.', 404); return getOrders(tx); });
    return NextResponse.json({ ok: true, orders }, { headers });
  } catch (error) { return intakeFailure(error); }
}
