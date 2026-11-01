"use client";

import { useEffect, useState, useMemo } from "react";
import {
  HeartHandshake,
  MessageCircle,
  Package,
  ShoppingBag,
  Shirt,
  Sparkles,
  CheckCircle2,
  Search,
  Heart,
  ShieldCheck,
  Check,
  Plus,
  Minus,
  Lollipop,
  Truck,
} from "lucide-react";
import { DEFAULT_PRODUCTS, type Product, type ProductCategory } from "@/data/products";
import { useCart } from "@/components/CartProvider";

const CATEGORIES: Array<{ id: "Todos" | ProductCategory; label: string; desc: string }> = [
  { id: "Todos", label: "Todo el Catálogo", desc: "Playeras y paletas de dulce" },
  { id: "Playeras", label: "Playeras Oficiales", desc: "Diseños exclusivos del refugio" },
  { id: "Paletas", label: "Paletas de Dulce", desc: "Caramelo artesanal con causa" },
  { id: "Accesorios", label: "Accesorios y Más", desc: "Artículos con causa" },
];

function CategoryIcon({ category, className = "w-5 h-5" }: { category: string; className?: string }) {
  if (category === "Playeras") return <Shirt className={className} />;
  if (category === "Paletas") return <Lollipop className={className} />;
  if (category === "Accesorios") return <Package className={className} />;
  return <Sparkles className={className} />;
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const options = product.variants && product.variants.length > 0 ? product.variants : product.sizes ?? [];
  const label = product.variantLabel || (product.category === "Playeras" ? "Talla" : product.category === "Paletas" ? "Sabor" : "Opción");

  const [selectedVariant, setSelectedVariant] = useState(options[0] ?? "");
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    const opts = product.variants && product.variants.length > 0 ? product.variants : product.sizes ?? [];
    setSelectedVariant(opts[0] ?? "");
  }, [product]);

  const isOut = !product.available || (product.stock !== undefined && product.stock <= 0);

  const handleAdd = () => {
    if (isOut) return;
    const formattedSize = options.length > 0 && selectedVariant ? `${label}: ${selectedVariant}` : undefined;
    addItem(
      {
        productId: product.id,
        name: product.name,
        size: formattedSize,
        price: product.price,
      },
      qty
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
      {/* Fotografía del producto */}
      <div className="relative h-64 bg-gradient-to-br from-slate-100 to-sky-50 overflow-hidden flex items-center justify-center">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <CategoryIcon category={product.category} className="w-20 h-20 text-sky-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none" />

        {/* Badges superiores */}
        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5">
          <span className="bg-slate-900/85 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-xs">
            <CategoryIcon category={product.category} className="w-3.5 h-3.5 text-sky-400" />
            {product.category}
          </span>
          {product.badge && (
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-xl shadow-xs">
              {product.badge}
            </span>
          )}
        </div>

        {/* Estado de stock */}
        <span
          className={`absolute bottom-3 right-3.5 text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-md shadow-xs ${
            isOut
              ? "bg-rose-600/95 text-white"
              : product.stock <= 5
                ? "bg-amber-500/95 text-slate-950"
                : "bg-emerald-600/90 text-white"
          }`}
        >
          {isOut ? "Agotado" : product.stock <= 5 ? `¡Últimas ${product.stock} uds!` : "Disponible"}
        </span>
      </div>

      {/* Información y controles */}
      <div className="p-6 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-snug group-hover:text-sky-600 transition-colors">
              {product.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Selector de Tallas o Sabores */}
          {options.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Selecciona {label}: <span className="text-sky-600">{selectedVariant}</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedVariant(opt)}
                    aria-pressed={selectedVariant === opt}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      selectedVariant === opt
                        ? "bg-sky-600 border-sky-600 text-white shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-sky-400 hover:bg-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Precio, cantidad y botón agregar */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">Aporte solidario</span>
              <span className="text-2xl font-black text-slate-900">Q{product.price}</span>
            </div>

            {/* Control de cantidad */}
            {!isOut && (
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Disminuir cantidad"
                  className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-2xs cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center text-xs font-black text-slate-800">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                  aria-label="Aumentar cantidad"
                  className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={isOut}
            onClick={handleAdd}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-md cursor-pointer ${
              isOut
                ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                : justAdded
                  ? "bg-emerald-600 text-white shadow-emerald-600/20"
                  : "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20 hover:-translate-y-0.5"
            }`}
          >
            {isOut ? (
              <span>Temporalmente Agotado</span>
            ) : justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Agregado a tu pedido!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Agregar al pedido • Q{product.price * qty}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TiendaPage() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [category, setCategory] = useState<"Todos" | ProductCategory>("Todos");
  const [search, setSearch] = useState("");
  const { count, total, openCart } = useCart();

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => {});
  }, []);

  const visibleProducts = useMemo(() => {
    return products.filter((p) => {
      if (category !== "Todos" && p.category !== category) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, category, search]);

  return (
    <div className="bg-slate-50/60 min-h-screen pb-24">
      {/* 1. HERO BANNER TIENDA SOLIDARIA */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full backdrop-blur-md">
              <HeartHandshake className="w-4 h-4 text-amber-300" />
              <span>Tienda Solidaria • 100% a beneficio de los rescatados</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Playeras y Paletas{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-amber-300">
                que salvan vidas
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-light">
              Cada playera que vistes con orgullo y cada paleta de dulce artesanal que disfrutas o regalas se convierte directamente en concentrado, vacunas, esterilizaciones y tratamientos para los perritos del refugio.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10">
                <Shirt className="w-3.5 h-3.5 text-sky-400" /> Playeras Oficiales de Algodón
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10">
                <Lollipop className="w-3.5 h-3.5 text-amber-400" /> Paletas de Dulce Artesanales
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> Pedido directo por WhatsApp
              </span>
            </div>
          </div>

          {/* Tarjeta resumen de pedido flotante en el Hero */}
          <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500 text-slate-950 flex items-center justify-center font-black">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-300">Tu Carrito Solidario</p>
                  <p className="text-lg font-black text-white">
                    {count === 0 ? "Sin productos aún" : `${count} ${count === 1 ? "producto" : "productos"}`}
                  </p>
                </div>
              </div>
              {count > 0 && (
                <span className="text-xl font-black text-amber-300">Q{total}</span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Arma tu pedido combinando tallas de playeras y sabores de paletas. Coordina la entrega fácilmente por WhatsApp.
            </p>

            <button
              type="button"
              onClick={openCart}
              className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3 rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{count > 0 ? `Ver y Enviar Pedido (Q${total})` : "Abrir Carrito"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. BARRA DE CATEGORÍAS Y BUSCADOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200/90 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Pestañas de categoría */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
              {CATEGORIES.map((c) => {
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      active
                        ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-600/20"
                        : "bg-slate-50/80 border-slate-200 text-slate-800 hover:bg-white hover:border-sky-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <CategoryIcon
                        category={c.id}
                        className={`w-5 h-5 ${active ? "text-amber-300" : "text-sky-600"}`}
                      />
                      {active && <span className="w-2 h-2 rounded-full bg-amber-300" />}
                    </div>
                    <div>
                      <p className="font-extrabold text-xs sm:text-sm leading-tight">{c.label}</p>
                      <p className={`text-[11px] mt-0.5 line-clamp-1 ${active ? "text-sky-100" : "text-slate-500"}`}>
                        {c.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Buscador */}
            <div className="relative lg:w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar playera, sabor de paleta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATÁLOGO DE PRODUCTOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="text-lg font-extrabold text-slate-800">No encontramos productos en esta vista</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Prueba seleccionando otra categoría o limpiando el texto de búsqueda.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory("Todos");
                setSearch("");
              }}
              className="bg-sky-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl"
            >
              Ver todos los productos
            </button>
          </div>
        )}
      </section>

      {/* 4. CÓMO FUNCIONA TU COMPRA SOLIDARIA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950 px-3.5 py-1 rounded-full border border-sky-800">
              Compra Fácil y Transparente
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-3">
              ¿Cómo pedir tus playeras y paletas?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
              <span className="inline-flex w-8 h-8 rounded-xl bg-sky-500 text-slate-950 font-black text-sm items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-base text-white">Elige tus favoritos</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Selecciona la talla de tu playera oficial o tus sabores favoritos de paletas artesanales y agrégalos al carrito.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
              <span className="inline-flex w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-sm items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-base text-white">Envía tu pedido por WhatsApp</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Abre tu carrito, escribe tu nombre y presiona el botón de WhatsApp. Tu lista se genera automáticamente.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
              <span className="inline-flex w-8 h-8 rounded-xl bg-emerald-400 text-slate-950 font-black text-sm items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-base text-white">Coordinamos entrega y ayudas</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Acordamos el punto de entrega en Amatitlán o envío, y el 100% de tu aporte se transforma en alimento y salud para los perritos.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
