"use client";

import { useState } from "react";
import { Coffee, HeartHandshake, MessageCircle, Package, ShoppingBag, Shirt } from "lucide-react";
import { PRODUCTS, type Product } from "@/data/products";
import { useCart } from "@/components/CartProvider";

const CATEGORIES = ["Todos", "Camisas", "Tazas", "Otros"] as const;

function ProductIcon({ category }: { category: Product["category"] }) {
  const cls = "w-16 h-16 text-sky-400";
  if (category === "Camisas") return <Shirt className={cls} />;
  if (category === "Tazas") return <Coffee className={cls} />;
  return <Package className={cls} />;
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes?.[0] ?? "");

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col">
      <div className="relative h-56 bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <ProductIcon category={product.category} />
        )}
        <span className="absolute top-3 left-3 bg-white/90 text-sky-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
          {product.category}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-grow gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{product.name}</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{product.description}</p>
        </div>

        {product.sizes && product.sizes.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-700 mb-1.5">Talla</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                  className={`min-w-9 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                    size === s
                      ? "bg-sky-500 border-sky-500 text-white"
                      : "bg-white border-slate-300 text-slate-700 hover:border-sky-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-2xl font-black text-slate-900">Q{product.price}</span>
          <button
            type="button"
            disabled={!product.available}
            onClick={() =>
              addItem({
                productId: product.id,
                name: product.name,
                size: product.sizes && product.sizes.length > 0 ? size : undefined,
                price: product.price,
              })
            }
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 text-sm rounded-xl transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{product.available ? "Agregar" : "Agotado"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TiendaPage() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Todos");
  const { count, openCart } = useCart();

  const visible = PRODUCTS.filter((p) => category === "Todos" || p.category === category);

  return (
    <div className="pb-16">
      {/* Banner */}
      <section className="bg-gradient-to-b from-sky-800 to-sky-900 text-white px-4 sm:px-6 lg:px-8 py-14">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-sky-700/60 border border-sky-500/30 text-sky-200 text-xs font-semibold px-3.5 py-1.5 rounded-full">
            <HeartHandshake className="w-4 h-4" />
            <span>Todo lo que se recauda es para el refugio</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Ayúdanos comprando</h1>
          <p className="text-sky-100/90 max-w-2xl mx-auto leading-relaxed">
            Camisas, tazas y más, hechas con cariño para apoyar a los perritos rescatados. Arma tu pedido y envíalo
            directo por WhatsApp.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  category === c
                    ? "bg-sky-500 border-sky-500 text-white"
                    : "bg-white border-slate-300 text-slate-700 hover:border-sky-400"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <button
            onClick={openCart}
            className="inline-flex items-center justify-center gap-2 text-sm font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-4 py-2.5 rounded-xl transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ver mi pedido{count > 0 ? ` (${count})` : ""}</span>
          </button>
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p>Pronto habrá más productos en esta categoría.</p>
          </div>
        )}

        <div className="mt-12 bg-sky-50 border border-sky-100 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <MessageCircle className="w-8 h-8 text-sky-500 shrink-0" />
          <div>
            <h2 className="font-bold text-slate-900">¿Cómo funciona?</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Agrega lo que quieras a tu pedido y presiona &quot;Enviar pedido por WhatsApp&quot;. Nos llega tu lista y
              coordinamos contigo el pago y la entrega.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
