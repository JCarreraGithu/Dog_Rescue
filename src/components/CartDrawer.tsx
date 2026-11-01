"use client";

import { useState } from "react";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  MessageCircle,
  CheckCircle2,
  Truck,
  MapPin,
  CreditCard,
  Banknote,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { SITE } from "@/config/site";
import type { DeliveryMethod, PaymentMethod } from "@/lib/local-records";

export default function CartDrawer() {
  const { items, total, isOpen, closeCart, setQty, removeItem, clear } =
    useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("Recoger en Sede");
  const [department, setDepartment] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    "Efectivo Contra Entrega"
  );
  const [paymentReference, setPaymentReference] = useState("");
  const [note, setNote] = useState("");

  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  if (!isOpen) return null;

  const shippingFee = deliveryMethod === "Cargo Expreso" ? 35 : 0;
  const finalTotal = total + shippingFee;

  const buildWhatsAppUrl = (orderId?: string) => {
    const lines = items.map(
      (i) =>
        `• ${i.qty} x ${i.name}${i.size ? ` (${i.size})` : ""} - Q${
          i.price * i.qty
        }`
    );
    const message = [
      `Hola ${SITE.name} 🐾, acabo de registrar mi pedido ${
        orderId ? `#${orderId}` : ""
      } en la Tienda Solidaria:`,
      "",
      ...lines,
      shippingFee > 0 ? `• Envío Cargo Expreso: Q${shippingFee}` : "",
      `Total a pagar: Q${finalTotal}`,
      "",
      `👤 Cliente: ${name.trim()}`,
      `📱 Teléfono: ${phone.trim()}`,
      `🚚 Entrega: ${
        deliveryMethod === "Cargo Expreso"
          ? `Cargo Expreso (${department.trim()} - ${shippingAddress.trim()})`
          : "Recoger en Sede / Jornada (Amatitlán)"
      }`,
      `💳 Método de Pago: ${paymentMethod}${
        paymentReference.trim() ? ` (Ref: ${paymentReference.trim()})` : ""
      }`,
      note.trim() ? `📝 Comentario: ${note.trim()}` : "",
      "",
      "Quedo atento(a) para coordinar mi pedido. ¡Gracias!",
    ]
      .filter((l, idx, arr) => !(l === "" && arr[idx - 1] === ""))
      .join("\n");
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
  };

  const handleCheckout = async (openWhatsApp: boolean) => {
    if (items.length === 0 || submittingOrder) return;
    setErrorMsg("");

    if (!name.trim() || name.trim().length < 3) {
      setErrorMsg("Por favor escribe tu nombre completo.");
      return;
    }

    if (!phone.trim() || phone.trim().length < 7) {
      setErrorMsg("Por favor escribe tu número de teléfono o WhatsApp.");
      return;
    }

    if (deliveryMethod === "Cargo Expreso") {
      if (!department.trim()) {
        setErrorMsg(
          "Por favor indica tu Departamento y Municipio para el envío por Cargo Expreso."
        );
        return;
      }
      if (!shippingAddress.trim() || shippingAddress.trim().length < 6) {
        setErrorMsg(
          "Por favor escribe la dirección exacta donde recibirás tu paquete de Cargo Expreso."
        );
        return;
      }
    }

    setSubmittingOrder(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          deliveryMethod,
          department: department.trim(),
          shippingAddress: shippingAddress.trim(),
          paymentMethod,
          paymentReference: paymentReference.trim(),
          note: note.trim(),
          items: items.map((i) => ({
            id: i.productId || i.key,
            name: i.name,
            size: i.size,
            price: i.price,
            qty: i.qty,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar el pedido.");
      }

      if (openWhatsApp) {
        const waUrl = buildWhatsAppUrl(data.id);
        window.open(waUrl, "_blank", "noopener,noreferrer");
      }

      setCreatedOrder(data);
      clear();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Error al procesar tu pedido."
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

  const resetAndClose = () => {
    setCreatedOrder(null);
    setErrorMsg("");
    closeCart();
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        onClick={resetAndClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Tu pedido"
        className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <h2 className="font-black text-base sm:text-lg flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <span>Finalizar Compra Solidaria</span>
          </h2>
          <button
            onClick={resetAndClose}
            aria-label="Cerrar"
            className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {createdOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 space-y-4 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider bg-slate-900 text-amber-300 px-3.5 py-1 rounded-full">
              Orden #{createdOrder.id}
            </span>
            <h3 className="font-black text-2xl text-slate-900">
              ¡Pedido Registrado con Éxito!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
              Hemos recibido los datos de tu compra y de entrega por{" "}
              <strong>{createdOrder.deliveryMethod}</strong>. El equipo de DOG Rescue Guatemala ya tiene la notificación en el panel administrativo para gestionar tu envío.
            </p>
            <div className="w-full max-w-sm p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5">
              <p>
                <strong>Cliente:</strong> {createdOrder.customerName} (
                {createdOrder.customerPhone})
              </p>
              <p>
                <strong>Entrega:</strong> {createdOrder.deliveryMethod}{" "}
                {createdOrder.deliveryMethod === "Cargo Expreso"
                  ? `— ${createdOrder.department} (${createdOrder.shippingAddress})`
                  : "(Amatitlán)"}
              </p>
              <p>
                <strong>Método de Pago:</strong> {createdOrder.paymentMethod}
              </p>
              <p className="text-sm font-black text-emerald-700 pt-1 border-t border-slate-200">
                Total: Q{createdOrder.total}
              </p>
            </div>
            <button
              type="button"
              onClick={resetAndClose}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition cursor-pointer"
            >
              Volver a la Tienda
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-slate-500">
            <ShoppingBag className="w-10 h-10 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">
              Aún no has agregado productos
            </p>
            <p className="text-sm mt-1">
              Elige tus playeras o paletas solidarias para apoyar al refugio.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
            {/* 1. LISTA DE PRODUCTOS */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  1. Productos en tu carrito ({items.length})
                </h3>
                <button
                  type="button"
                  onClick={clear}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Vaciar carrito
                </button>
              </div>

              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li
                    key={item.key}
                    className="py-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs sm:text-sm">
                        {item.name}
                      </p>
                      {item.size && (
                        <p className="text-xs font-medium text-sky-700">
                          {item.size}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500">
                        Q{item.price} c/u
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          onClick={() => setQty(item.key, item.qty - 1)}
                          aria-label="Quitar uno"
                          className="w-6 h-6 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-5 text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => setQty(item.key, item.qty + 1)}
                          aria-label="Agregar uno"
                          className="w-6 h-6 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-slate-900 text-sm">
                        Q{item.price * item.qty}
                      </p>
                      <button
                        onClick={() => removeItem(item.key)}
                        aria-label="Eliminar"
                        className="mt-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. DATOS OBLIGATORIOS DEL COMPRADOR */}
            <div className="p-5 space-y-3 bg-slate-50/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                2. Tus Datos de Contacto (Obligatorio *)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Gómez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 5544-3322"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 3. MÉTODO DE ENTREGA: RECOGER O CARGO EXPRESO */}
            <div className="p-5 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                3. Método de Entrega *
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("Recoger en Sede")}
                  className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex items-start gap-2.5 ${
                    deliveryMethod === "Recoger en Sede"
                      ? "border-emerald-600 bg-emerald-50/70"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <MapPin
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      deliveryMethod === "Recoger en Sede"
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      Recoger en Sede / Jornada
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Amatitlán (9a calle 7-27) • <strong>Gratis (Q0)</strong>
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod("Cargo Expreso")}
                  className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex items-start gap-2.5 ${
                    deliveryMethod === "Cargo Expreso"
                      ? "border-sky-600 bg-sky-50/70"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <Truck
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      deliveryMethod === "Cargo Expreso"
                        ? "text-sky-600"
                        : "text-slate-400"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      Envío por Cargo Expreso
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      A toda Guatemala • <strong>+Q35 envío</strong>
                    </p>
                  </div>
                </button>
              </div>

              {deliveryMethod === "Cargo Expreso" && (
                <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-sky-950 mb-1">
                      Departamento y Municipio *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Guatemala, Zona 10 / Antigua Guatemala..."
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sky-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-sky-950 mb-1">
                      Dirección exacta para Cargo Expreso *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Calle, avenida, número de casa, colonia y punto de referencia..."
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sky-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. MÉTODO DE PAGO */}
            <div className="p-5 space-y-3 bg-slate-50/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                4. Método de Pago *
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("Efectivo Contra Entrega")}
                  className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex items-start gap-2.5 ${
                    paymentMethod === "Efectivo Contra Entrega"
                      ? "border-emerald-600 bg-emerald-50/70"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <Banknote
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      paymentMethod === "Efectivo Contra Entrega"
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      Pago Contra Entrega
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pagas al recibir o recoger tu pedido
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("Transferencia / Depósito")}
                  className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex items-start gap-2.5 ${
                    paymentMethod === "Transferencia / Depósito"
                      ? "border-sky-600 bg-sky-50/70"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <CreditCard
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      paymentMethod === "Transferencia / Depósito"
                        ? "text-sky-600"
                        : "text-slate-400"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      Transferencia o Depósito
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Depósito bancario a cuenta del refugio
                    </p>
                  </div>
                </button>
              </div>

              {paymentMethod === "Transferencia / Depósito" && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
                  <p className="text-amber-900 font-semibold">
                    Puedes adjuntar tu número de boleta/referencia si ya realizaste la transferencia, o te enviaremos el número de cuenta al confirmar:
                  </p>
                  <input
                    type="text"
                    placeholder="No. de Boleta / Referencia bancaria (opcional)"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Notas adicionales (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Horario preferido, dedicatoria..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Pie Fijo con Resumen de Totales y Botones de Confirmación */}
        {!createdOrder && items.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-4 bg-white space-y-2.5 shadow-lg">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal productos:</span>
                <span>Q{total}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>
                  Entrega ({deliveryMethod}):
                </span>
                <span>{shippingFee > 0 ? `Q${shippingFee}` : "Gratis (Q0)"}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <span className="text-sm font-extrabold text-slate-800">
                  Total a Pagar:
                </span>
                <span className="text-xl font-black text-slate-900">
                  Q{finalTotal}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                disabled={submittingOrder}
                onClick={() => handleCheckout(false)}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black py-3 rounded-xl transition text-xs sm:text-sm cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {submittingOrder
                    ? "Procesando compra..."
                    : "Confirmar Compra en la Página"}
                </span>
              </button>

              <button
                type="button"
                disabled={submittingOrder}
                onClick={() => handleCheckout(true)}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition text-xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-green-400" />
                <span>Confirmar y Abrir también en WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
