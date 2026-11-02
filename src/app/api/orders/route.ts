import { NextRequest, NextResponse } from "next/server";
import {
  getStoreOrders,
  saveStoreOrders,
  StoreOrder,
  DeliveryMethod,
  PaymentMethod,
} from "@/lib/local-records";
import { addNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const orders = await getStoreOrders();
    return NextResponse.json(orders, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error al cargar pedidos de la tienda:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "El pedido no contiene productos" },
        { status: 400 }
      );
    }

    const customerName =
      typeof body.customerName === "string" ? body.customerName.trim() : "";
    const customerPhone =
      typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";

    if (!customerName || customerName.length < 2) {
      return NextResponse.json(
        { error: "Por favor ingresa tu nombre completo para el pedido." },
        { status: 400 }
      );
    }

    if (!customerPhone || customerPhone.length < 7) {
      return NextResponse.json(
        { error: "Por favor ingresa tu número de teléfono o WhatsApp." },
        { status: 400 }
      );
    }

    const deliveryMethod: DeliveryMethod =
      body.deliveryMethod === "Cargo Expreso"
        ? "Cargo Expreso"
        : "Recoger en Sede";

    const department =
      typeof body.department === "string" ? body.department.trim() : "";
    const shippingAddress =
      typeof body.shippingAddress === "string"
        ? body.shippingAddress.trim()
        : "";

    if (
      deliveryMethod === "Cargo Expreso" &&
      (!department || !shippingAddress)
    ) {
      return NextResponse.json(
        {
          error:
            "Para envío por Cargo Expreso debes indicar tu Departamento/Municipio y la dirección exacta.",
        },
        { status: 400 }
      );
    }

    const paymentMethod: PaymentMethod =
      body.paymentMethod === "Transferencia / Depósito"
        ? "Transferencia / Depósito"
        : "Efectivo Contra Entrega";

    const paymentReference =
      typeof body.paymentReference === "string"
        ? body.paymentReference.trim()
        : "";

    const note = typeof body.note === "string" ? body.note.trim() : "";

    const cleanItems = items.map((item: Record<string, unknown>) => ({
      id: String(item.id || ""),
      name: String(item.name || "Producto"),
      size: typeof item.size === "string" ? item.size : undefined,
      price: Number(item.price) || 0,
      qty: Number(item.qty) || 1,
    }));

    const subtotal = cleanItems.reduce(
      (acc: number, item: { price: number; qty: number }) => acc + item.price * item.qty,
      0
    );

    const shippingFee = deliveryMethod === "Cargo Expreso" ? 35 : 0;
    const total = subtotal + shippingFee;

    const newOrder: StoreOrder = {
      id: `PED-${Date.now().toString().slice(-6)}`,
      customerName,
      customerPhone,
      deliveryMethod,
      department: deliveryMethod === "Cargo Expreso" ? department : "Amatitlán",
      shippingAddress:
        deliveryMethod === "Cargo Expreso"
          ? shippingAddress
          : "Recoger en Sede / Jornada (Amatitlán)",
      shippingFee,
      paymentMethod,
      paymentReference,
      paymentStatus: "Pendiente",
      trackingNumber: "",
      adminNotes: "",
      note,
      items: cleanItems,
      subtotal,
      total,
      status: "Pendiente",
      createdAt: new Date().toISOString(),
    };

    const currentOrders = await getStoreOrders();
    await saveStoreOrders([newOrder, ...currentOrders]);

    const itemsSummary = cleanItems
      .map(
        (i: { qty: number; name: string; size?: string }) => `${i.qty}x ${i.name}${i.size ? ` (${i.size})` : ""}`
      )
      .join(", ");

    await addNotification({
      type: "order",
      title: `Nuevo Pedido #${newOrder.id} • ${deliveryMethod} (Q${total})`,
      message: `${customerName} (Tel: ${customerPhone}) • Pago: ${paymentMethod} • Entrega: ${
        deliveryMethod === "Cargo Expreso"
          ? `Cargo Expreso a ${department} (${shippingAddress})`
          : "Recoger en Sede Amatitlán"
      } • Productos: ${itemsSummary}.`,
      targetTab: "store",
      metadata: {
        orderId: newOrder.id,
        total,
        deliveryMethod,
        paymentMethod,
      },
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Error al registrar pedido de tienda:", error);
    return NextResponse.json(
      { error: "No se pudo registrar el pedido" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      status,
      paymentStatus,
      trackingNumber,
      adminNotes,
      shippingAddress,
      department,
    } = body;
    const orders = await getStoreOrders();

    const updated = orders.map((o) =>
      o.id === id
        ? {
            ...o,
            status: status !== undefined ? status : o.status,
            paymentStatus:
              paymentStatus !== undefined ? paymentStatus : o.paymentStatus,
            trackingNumber:
              trackingNumber !== undefined ? trackingNumber : o.trackingNumber,
            adminNotes:
              adminNotes !== undefined ? adminNotes : o.adminNotes,
            shippingAddress:
              shippingAddress !== undefined
                ? shippingAddress
                : o.shippingAddress,
            department:
              department !== undefined ? department : o.department,
          }
        : o
    );
    await saveStoreOrders(updated);

    return NextResponse.json({ ok: true, orders: updated });
  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el pedido" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Falta ID del pedido" }, { status: 400 });
    }
    const orders = await getStoreOrders();
    const filtered = orders.filter((o) => o.id !== id);
    await saveStoreOrders(filtered);
    return NextResponse.json({ ok: true, orders: filtered });
  } catch (error) {
    console.error("Error al eliminar pedido:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el pedido" },
      { status: 500 }
    );
  }
}
