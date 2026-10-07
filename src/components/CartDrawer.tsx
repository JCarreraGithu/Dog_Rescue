"use client";

import { useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { SITE } from "@/config/site";

export default function CartDrawer() {
  const { items, total, isOpen, closeCart, setQty, removeItem, clear } = useCart();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  const buildWhatsAppUrl = () => {
    const lines = items.map(
      (i) => `• ${i.qty} x ${i.name}${i.size ? ` (Talla ${i.size})` : ""} - Q${i.price * i.qty}`
    );
    const message = [
      `Hola ${SITE.name} 🐾, quiero apoyar al refugio con estos productos:`,
      "",
      ...lines,
      "",
      `Total: Q${total}`,
      name.trim() ? `Nombre: ${name.trim()}` : "",
      note.trim() ? `Comentario: ${note.trim()}` : "",
      "",
      "¿Me pueden indicar cómo coordinar el pago y la entrega? ¡Gracias!",
    ]
      .filter((l, idx, arr) => !(l === "" && arr[idx - 1] === ""))
      .join("\n");
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={closeCart} aria-hidden="true" />
      <aside
        role="dialog"
        aria-label="Tu pedido"
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-sky-500" /> Tu pedido
          </h2>
          <button onClick={closeCart} aria-label="Cerrar" className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-slate-500">
            <ShoppingBag className="w-10 h-10 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Aún no has agregado nada</p>
            <p className="text-sm mt-1">Elige un producto y ayuda al refugio con tu compra.</p>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-slate-100 px-5">
              {items.map((item) => (
                <li key={item.key} className="py-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                    {item.size && <p className="text-xs text-slate-500">Talla {item.size}</p>}
                    <p className="text-xs text-slate-500 mt-0.5">Q{item.price} c/u</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setQty(item.key, item.qty - 1)}
                        aria-label="Quitar uno"
                        className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => setQty(item.key, item.qty + 1)}
                        aria-label="Agregar uno"
                        className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-800 text-sm">Q{item.price * item.qty}</p>
                    <button
                      onClick={() => removeItem(item.key)}
                      aria-label="Eliminar"
                      className="mt-2 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-slate-200 px-5 py-4 space-y-3 bg-slate-50">
              <input
                type="text"
                placeholder="Tu nombre (opcional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              />
              <textarea
                rows={2}
                placeholder="Comentario (opcional): color, dirección de entrega, etc."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Total</span>
                <span className="text-xl font-black text-slate-900">Q{total}</span>
              </div>
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar pedido por WhatsApp</span>
              </a>
              <p className="text-[11px] text-slate-500 text-center leading-snug">
                Se abrirá WhatsApp con tu pedido listo. El pago y la entrega se coordinan directamente con el refugio.
              </p>
              <button onClick={clear} className="w-full text-xs font-semibold text-slate-500 hover:text-rose-600">
                Vaciar pedido
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
