"use client";
import type { StoreOrder } from "@/lib/local-records";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Shirt,
  Lollipop,
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowUpRight,
  Check,
  Sparkles,
  Tag,
  Layers,
  Truck,
  MapPin,
  CreditCard,
  MessageCircle,
  Phone,
  FileText,
} from "lucide-react";
import type { Product, ProductCategory } from "@/data/products";

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  category: ProductCategory;
  variantLabel: string;
  variantsText: string;
  image: string;
  stock: string;
  available: boolean;
  featured: boolean;
  badge: string;
};

const EMPTY_FORM: ProductFormState = {
  name: "",
  description: "",
  price: "100",
  category: "Playeras",
  variantLabel: "Talla",
  variantsText: "S, M, L, XL",
  image: "",
  stock: "20",
  available: true,
  featured: false,
  badge: "100% Solidaria",
};

const PRESET_IMAGES: Record<ProductCategory, Array<{ label: string; url: string }>> = {
  Playeras: [
    {
      label: "Playera Blanca Clásica",
      url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800",
    },
    {
      label: "Playera Negra Edición",
      url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800",
    },
    {
      label: "Playera Casual Algodón",
      url: "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800",
    },
  ],
  Paletas: [
    {
      label: "Paleta de Dulce Artesanal",
      url: "https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&q=80&w=800",
    },
    {
      label: "Pack Surtido de Paletas de Dulce",
      url: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&q=80&w=800",
    },
    {
      label: "Paleta de Caramelo Multicolor",
      url: "https://images.unsplash.com/photo-1514517521153-1be72277b32f?auto=format&fit=crop&q=80&w=800",
    },
  ],
  Accesorios: [
    {
      label: "Taza Solidaria",
      url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800",
    },
  ],
};

export default function StoreManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<"Todos" | ProductCategory>("Todos");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal Crear / Editar
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState("");
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [orderDeliveryFilter, setOrderDeliveryFilter] = useState<string>("Todos");
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [orderEditForm, setOrderEditForm] = useState<Pick<StoreOrder, "status" | "paymentStatus" | "trackingNumber" | "department" | "shippingAddress" | "adminNotes">>({
    status: "Pendiente",
    paymentStatus: "Pendiente",
    trackingNumber: "",
    department: "",
    shippingAddress: "",
    adminNotes: "",
  });

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron cargar los pedidos.");
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrderError("");
        setOrders(data);
      }
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "No se pudieron cargar los pedidos.");
    }
  };

  const openOrderModal = (order: StoreOrder) => {
    setSelectedOrder(order);
    setOrderEditForm({
      status: order.status || "Pendiente",
      paymentStatus: order.paymentStatus || "Pendiente",
      trackingNumber: order.trackingNumber || "",
      department: order.department || "",
      shippingAddress: order.shippingAddress || "",
      adminNotes: order.adminNotes || "",
    });
  };

  const handleUpdateOrder = async (orderId: string, patch: Partial<StoreOrder>) => {
    setOrderError("");
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, ...patch }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "No se pudo actualizar el pedido."); }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);
          if (selectedOrder && selectedOrder.id === orderId) {
            const updated = data.orders.find((o: StoreOrder) => o.id === orderId);
            if (updated) setSelectedOrder(updated);
          }
        } else {
          await loadOrders();
        }
        showSuccess("Pedido actualizado correctamente.");
        return true;
      }
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "No se pudo actualizar el pedido.");
    }
    return false;
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este pedido del registro?")) return;
    try {
      const res = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, {
        method: "DELETE",
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "No se pudo eliminar el pedido."); }
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setOrderError("");
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
        showSuccess("Pedido eliminado.");
      }
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "No se pudo eliminar el pedido.");
    }
  };

  const buildCustomerWhatsApp = (order: StoreOrder) => {
    const cleanPhone = String(order.customerPhone || "").replace(/[^0-9]/g, "");
    const gtPhone =
      cleanPhone.length === 8 ? `502${cleanPhone}` : cleanPhone;
    const itemsText = (order.items || [])
      .map((i) => `${i.qty}x ${i.name}${i.size ? ` (${i.size})` : ""}`)
      .join(", ");

    const msg =
      order.deliveryMethod === "Cargo Expreso"
        ? `Hola ${order.customerName} 🐾, te saludamos de DOG Rescue Guatemala respecto a tu pedido #${order.id} (${itemsText} - Total Q${order.total}).\n\nEstado: *${order.status}*${
            order.trackingNumber
              ? `\n🚚 *No. de Guía Cargo Expreso:* ${order.trackingNumber}`
              : ""
          }\n📍 Dirección de envío: ${order.department || ""} - ${
            order.shippingAddress || ""
          }\n\n¡Muchas gracias por apoyar a nuestros perritos rescatados!`
        : `Hola ${order.customerName} 🐾, te saludamos de DOG Rescue Guatemala respecto a tu pedido #${order.id} (${itemsText} - Total Q${order.total}).\n\nEstado: *${order.status}*\n📍 Entrega: Recoger en Sede / Jornada Amatitlán (9a calle 7-27).\n\n¡Muchas gracias por apoyar a nuestros perritos rescatados!`;

    return `https://wa.me/${gtPhone}?text=${encodeURIComponent(msg)}`;
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, []);

  const showSuccess = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 4000);
  };

  // KPIs de arquitectura de tienda
  const stats = useMemo(() => {
    const playeras = products.filter((p) => p.category === "Playeras");
    const paletas = products.filter((p) => p.category === "Paletas");
    const active = products.filter((p) => p.available && (p.stock ?? 0) > 0);
    const outOfStock = products.length - active.length;
    return {
      total: products.length,
      playerasCount: playeras.length,
      playerasStock: playeras.reduce((acc, p) => acc + (p.stock ?? 0), 0),
      paletasCount: paletas.length,
      paletasStock: paletas.reduce((acc, p) => acc + (p.stock ?? 0), 0),
      outOfStock,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filterCat !== "Todos" && p.category !== filterCat) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.badge && p.badge.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, filterCat, search]);

  const openCreateModal = (defaultCat: ProductCategory = "Playeras") => {
    setEditingId(null);
    setErrorMsg("");
    if (defaultCat === "Paletas") {
      setForm({
        name: "",
        description: "",
        price: "10",
        category: "Paletas",
        variantLabel: "Sabor",
        variantsText: "Fresa, Cereza, Mango, Sandía, Uva",
        image: PRESET_IMAGES.Paletas[0].url,
        stock: "50",
        available: true,
        featured: false,
        badge: "Dulce Solidario",
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        category: defaultCat,
        image: PRESET_IMAGES[defaultCat]?.[0]?.url ?? "",
      });
    }
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setErrorMsg("");
    const opts = product.variants && product.variants.length > 0 ? product.variants : product.sizes ?? [];
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category,
      variantLabel:
        product.variantLabel ||
        (product.category === "Playeras" ? "Talla" : product.category === "Paletas" ? "Sabor" : "Opción"),
      variantsText: opts.join(", "),
      image: product.image ?? "",
      stock: String(product.stock ?? 15),
      available: product.available,
      featured: Boolean(product.featured),
      badge: product.badge ?? "",
    });
    setShowModal(true);
  };

  const handleCategoryChange = (cat: ProductCategory) => {
    if (!editingId) {
      if (cat === "Playeras") {
        setForm((prev) => ({
          ...prev,
          category: cat,
          price: "110",
          variantLabel: "Talla",
          variantsText: "S, M, L, XL",
          badge: "100% Solidaria",
          image: prev.image || PRESET_IMAGES.Playeras[0].url,
        }));
        return;
      }
      if (cat === "Paletas") {
        setForm((prev) => ({
          ...prev,
          category: cat,
          price: "10",
          variantLabel: "Sabor",
          variantsText: "Fresa, Cereza, Mango, Sandía, Uva",
          badge: "Dulce Solidario",
          image: prev.image || PRESET_IMAGES.Paletas[0].url,
        }));
        return;
      }
    }
    setForm((prev) => ({ ...prev, category: cat }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        variantLabel: form.variantLabel.trim(),
        variants: form.variantsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        image: form.image.trim(),
        stock: Number(form.stock),
        available: form.available,
        featured: form.featured,
        badge: form.badge.trim(),
      };

      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "No se pudo guardar el producto.");
      }

      await loadProducts();
      setShowModal(false);
      showSuccess(editingId ? "¡Producto actualizado correctamente!" : "¡Nuevo producto agregado a la tienda!");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error inesperado al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailable = async (product: Product) => {
    setBusyId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !product.available }),
      });
      if (res.ok) {
        await loadProducts();
        showSuccess(`Estado de "${product.name}" actualizado.`);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickStock = async (product: Product, delta: number) => {
    const newStock = Math.max(0, (product.stock ?? 0) + delta);
    setBusyId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: newStock,
          available: newStock > 0 ? product.available : false,
        }),
      });
      if (res.ok) {
        await loadProducts();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`¿Eliminar "${product.name}" de la tienda solidaria?`)) return;
    setBusyId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (res.ok) {
        await loadProducts();
        showSuccess(`"${product.name}" fue eliminado del catálogo.`);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {orderError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-700">{orderError}</p>}
      {/* 0. CENTRO DE GESTIÓN DE PEDIDOS, PAGOS Y ENVÍOS (CARGO EXPRESO / RECOGER) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Control de Pedidos y Envíos • {orders.length}{" "}
              {orders.length === 1 ? "Pedido" : "Pedidos"}
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-2">
              Gestión de Compras, Pagos y Envíos (Cargo Expreso / Recoger en Sede)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Administra cada compra recibida, verifica transferencias o pagos contra entrega, asigna número de guía de Cargo Expreso y notifica al cliente por WhatsApp.
            </p>
          </div>

          {/* Filtro por tipo de entrega */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "Todos", label: `Todos (${orders.length})` },
              {
                id: "Cargo Expreso",
                label: `🚚 Cargo Expreso (${
                  orders.filter((o) => o.deliveryMethod === "Cargo Expreso")
                    .length
                })`,
              },
              {
                id: "Recoger en Sede",
                label: `📍 Recoger en Sede (${
                  orders.filter((o) => o.deliveryMethod !== "Cargo Expreso")
                    .length
                })`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setOrderDeliveryFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  orderDeliveryFilter === tab.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
            <Truck className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              Aún no hay pedidos registrados
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Cuando un visitante llene sus datos de contacto, método de entrega (Cargo Expreso o Recoger en Sede) y método de pago en /tienda, aparecerá aquí para que lo gestiones.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders
              .filter(
                (o) =>
                  orderDeliveryFilter === "Todos" ||
                  (orderDeliveryFilter === "Cargo Expreso"
                    ? o.deliveryMethod === "Cargo Expreso"
                    : o.deliveryMethod !== "Cargo Expreso")
              )
              .map((order) => {
                const isCargoExpreso = order.deliveryMethod === "Cargo Expreso";
                const isPaid = order.paymentStatus === "Verificado";

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-sky-300 transition space-y-4"
                  >
                    {/* Fila superior: Folio, Cliente, Teléfono, Total y Estado */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="bg-slate-900 text-amber-300 text-xs font-black px-3 py-1 rounded-lg">
                          #{order.id}
                        </span>
                        <span className="font-black text-slate-900 text-base">
                          {order.customerName}
                        </span>
                        {order.customerPhone && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200">
                            <Phone className="w-3 h-3" />
                            {order.customerPhone}
                          </span>
                        )}
                        <span
                          className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                            order.status === "Entregado"
                              ? "bg-emerald-600 text-white"
                              : order.status === "Enviado (Cargo Expreso)" ||
                                order.status === "Listo para Recoger"
                              ? "bg-sky-600 text-white"
                              : order.status === "Cancelado"
                              ? "bg-rose-600 text-white"
                              : "bg-amber-400 text-slate-950"
                          }`}
                        >
                          {order.status}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(order.createdAt).toLocaleString("es-GT", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Total Pedido
                          </span>
                          <span className="text-xl font-black text-slate-900">
                            Q{order.total}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openOrderModal(order)}
                          className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Gestionar Envío / Pedido</span>
                        </button>

                        {order.customerPhone && (
                          <a
                            href={buildCustomerWhatsApp(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition"
                            title="Contactar comprador por WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2.5 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition cursor-pointer"
                          title="Eliminar pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Grid de 3 columnas: Productos, Entrega (Cargo Expreso / Sede) y Pago */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80 text-xs">
                      {/* 1. Productos */}
                      <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          1. Productos Solicitados
                        </span>
                        <ul className="space-y-1 font-semibold text-slate-800">
                          {(order.items || []).map((i, idx: number) => (
                            <li key={idx}>
                              • {i.qty}x {i.name}{" "}
                              {i.size ? (
                                <span className="text-sky-700 font-bold">
                                  ({i.size})
                                </span>
                              ) : null}{" "}
                              — Q{i.price * i.qty}
                            </li>
                          ))}
                        </ul>
                        {order.note && (
                          <p className="text-[11px] text-slate-500 italic pt-1">
                            Nota cliente: &ldquo;{order.note}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* 2. Entrega: Cargo Expreso o Recoger en Sede */}
                      <div
                        className={`p-3 rounded-xl border space-y-1.5 ${
                          isCargoExpreso
                            ? "bg-sky-50/70 border-sky-200"
                            : "bg-emerald-50/60 border-emerald-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            2. Logística de Entrega
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isCargoExpreso
                                ? "bg-sky-600 text-white"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            {isCargoExpreso
                              ? "🚚 Cargo Expreso"
                              : "📍 Recoger en Sede"}
                          </span>
                        </div>

                        {isCargoExpreso ? (
                          <div className="space-y-1 text-slate-800">
                            <p>
                              <strong>Depto/Municipio:</strong>{" "}
                              {order.department || "No especificado"}
                            </p>
                            <p>
                              <strong>Dirección:</strong>{" "}
                              {order.shippingAddress || "No especificada"}
                            </p>
                            {order.trackingNumber ? (
                              <p className="inline-block bg-slate-900 text-amber-300 font-black px-2.5 py-1 rounded-lg text-[11px] mt-1">
                                Guía Cargo Expreso: {order.trackingNumber}
                              </p>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openOrderModal(order)}
                                className="text-[11px] font-bold text-sky-700 underline cursor-pointer block pt-0.5"
                              >
                                + Asignar No. de Guía Cargo Expreso
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-700 font-medium">
                            El cliente pasará a recoger su pedido en el Refugio / Jornada en Amatitlán (Envío Q0).
                          </p>
                        )}
                      </div>

                      {/* 3. Método y Estado de Pago */}
                      <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col justify-between gap-2">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              3. Método de Pago
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                isPaid
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isPaid ? "✓ Pago Verificado" : "Pago Pendiente"}
                            </span>
                          </div>
                          <p className="font-bold text-slate-900 mt-1">
                            {order.paymentMethod || "Efectivo Contra Entrega"}
                          </p>
                          {order.paymentReference && (
                            <p className="text-[11px] text-sky-700 font-semibold mt-0.5">
                              Ref / Boleta: {order.paymentReference}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateOrder(order.id, {
                                paymentStatus: isPaid
                                  ? "Pendiente"
                                  : "Verificado",
                              })
                            }
                            className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              isPaid
                                ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                            }`}
                          >
                            {isPaid
                              ? "Marcar Pago como Pendiente"
                              : "✓ Verificar Pago Recibido"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Barra rápida de cambio de estado */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] font-bold text-slate-500">
                        Cambiar estado rápido:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Pendiente",
                          "En Preparación",
                          isCargoExpreso
                            ? "Enviado (Cargo Expreso)"
                            : "Listo para Recoger",
                          "Entregado",
                          "Cancelado",
                        ].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              handleUpdateOrder(order.id, { status: st as StoreOrder["status"] })
                            }
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                              order.status === st
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* 1. CABECERA Y KPIs DE LA TIENDA */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Arquitectura y Gestión de Tienda Solidaria
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Administra el catálogo de <strong>Playeras Oficiales</strong> y <strong>Paletas Artesanales</strong>, tallas, sabores, precios y stock en vivo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/tienda"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 px-4 py-2.5 rounded-xl transition"
            >
              <span>Ver Tienda Pública</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => openCreateModal("Playeras")}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Shirt className="w-4 h-4" />
              <span>+ Nueva Playera</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateModal("Paletas")}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Lollipop className="w-4 h-4" />
              <span>+ Nueva Paleta de Dulce</span>
            </button>
          </div>
        </div>

        {/* KPIs de Inventario Comercial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Productos</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total} artículos</p>
            <p className="text-xs text-slate-500 mt-0.5">En el catálogo de la tienda</p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-700 uppercase">Línea de Playeras</span>
              <Shirt className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black text-sky-900 mt-1">{stats.playerasCount} diseños</p>
            <p className="text-xs text-sky-700 mt-0.5">{stats.playerasStock} unidades disponibles</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase">Paletas de Dulce</span>
              <Lollipop className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-900 mt-1">{stats.paletasCount} variedades</p>
            <p className="text-xs text-amber-800 mt-0.5">{stats.paletasStock} unidades en existencia</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase">Disponibilidad</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-900 mt-1">
              {stats.total - stats.outOfStock} activos
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              {stats.outOfStock > 0 ? `${stats.outOfStock} agotados/pausados` : "Todo el catálogo disponible"}
            </p>
          </div>
        </div>

        {feedback && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Filtros y buscador */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-1.5">
            {(["Todos", "Playeras", "Paletas", "Accesorios"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCat(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  filterCat === cat
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* 2. LISTADO DE PRODUCTOS */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Cargando catálogo de la tienda...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <Package className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No hay productos en esta vista</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((p) => {
              const variants = p.variants && p.variants.length > 0 ? p.variants : p.sizes ?? [];
              const isOut = !p.available || (p.stock ?? 0) <= 0;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-4 transition ${
                    isOut ? "bg-slate-50/70 border-slate-200 opacity-85" : "bg-white border-slate-200 shadow-2xs hover:shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex gap-3.5">
                      <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : p.category === "Playeras" ? (
                          <Shirt className="w-8 h-8 text-sky-400" />
                        ) : (
                          <Lollipop className="w-8 h-8 text-amber-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              p.category === "Playeras"
                                ? "bg-sky-100 text-sky-800"
                                : p.category === "Paletas"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {p.category}
                          </span>
                          {p.badge && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                              {p.badge}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm mt-1 leading-snug line-clamp-2">
                          {p.name}
                        </h3>
                        <p className="text-lg font-black text-slate-900 mt-0.5">Q{p.price}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-3 line-clamp-2">{p.description}</p>

                    {variants.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1">
                        <span className="text-[11px] font-bold text-slate-600 mr-1">
                          {p.variantLabel || (p.category === "Playeras" ? "Tallas" : "Sabores")}:
                        </span>
                        {variants.map((v) => (
                          <span
                            key={v}
                            className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Controles rápidos de Stock, Estado y Edición */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-600">Stock:</span>
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => handleQuickStock(p, -1)}
                          className="w-6 h-6 rounded-md border border-slate-300 bg-white hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-black text-slate-900 w-7 text-center">{p.stock ?? 0}</span>
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => handleQuickStock(p, 1)}
                          className="w-6 h-6 rounded-md border border-slate-300 bg-white hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => handleToggleAvailable(p)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                          p.available && (p.stock ?? 0) > 0
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                        }`}
                      >
                        {p.available && (p.stock ?? 0) > 0 ? "● Disponible" : "○ Agotado"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => handleDeleteProduct(p)}
                        aria-label="Eliminar producto"
                        className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. MODAL CREAR / EDITAR PRODUCTO */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-5 max-h-[92vh] overflow-y-auto my-6">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                Catálogo Solidario
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                {editingId ? "Editar Producto de la Tienda" : "Agregar Producto a la Tienda"}
              </h3>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs sm:text-sm">
              {/* Selector de Categoría */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Categoría del Producto *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Playeras", "Paletas", "Accesorios"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        form.category === cat
                          ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-white"
                      }`}
                    >
                      {cat === "Playeras" && <Shirt className="w-4 h-4" />}
                      {cat === "Paletas" && <Lollipop className="w-4 h-4" />}
                      {cat === "Accesorios" && <Package className="w-4 h-4" />}
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder={
                      form.category === "Playeras"
                        ? 'Ej. Playera Oficial "Guardianes"'
                        : "Ej. Paleta de Dulce Artesanal"
                    }
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Precio (Q) *
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    step="1"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe la tela, sabores de dulce/caramelo o cómo ayuda esta compra al refugio..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              {/* Variantes: Tallas o Sabores */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tipo de Opción
                    </label>
                    <input
                      type="text"
                      placeholder="Talla o Sabor"
                      value={form.variantLabel}
                      onChange={(e) => setForm({ ...form, variantLabel: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Opciones separadas por coma
                    </label>
                    <input
                      type="text"
                      placeholder={
                        form.category === "Playeras"
                          ? "S, M, L, XL"
                          : "Fresa, Cereza, Mango, Sandía, Uva"
                      }
                      value={form.variantsText}
                      onChange={(e) => setForm({ ...form, variantsText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, variantLabel: "Talla", variantsText: "XS, S, M, L, XL" })
                    }
                    className="text-sky-700 bg-sky-100 hover:bg-sky-200 px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                  >
                    Usar tallas de playera (XS a XL)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        variantLabel: "Sabor",
                        variantsText: "Fresa, Cereza, Mango, Sandía, Uva",
                      })
                    }
                    className="text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                  >
                    Usar sabores de paletas de dulce
                  </button>
                </div>
              </div>

              {/* Stock, Insignia y Fotografía */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock Disponible (Unidades)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Etiqueta / Insignia (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Más Vendida, 100% Solidaria"
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL de Fotografía del Producto
                </label>
                <input
                  type="text"
                  placeholder="https://... o /tienda/mi-foto.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
                {/* Selector rápido de fotos de ejemplo */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PRESET_IMAGES[form.category]?.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setForm({ ...form, image: preset.url })}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                    >
                      📷 {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) => setForm({ ...form, available: e.target.checked })}
                />
                <span>Producto disponible para la venta en la tienda pública</span>
              </label>

              {errorMsg && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                  {errorMsg}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {saving ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL DE GESTIÓN DE ENVÍO (CARGO EXPRESO / RECOGER) Y PAGO DEL PEDIDO */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Gestionar pedido ${selectedOrder.id}`}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-sky-600">
                  Gestión Logística y Pago • Pedido #{selectedOrder.id}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Cliente: {selectedOrder.customerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-black uppercase text-slate-400 text-[10px]">
                  Datos del Comprador
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {selectedOrder.customerName}
                </p>
                <p className="text-slate-600">
                  Teléfono / WhatsApp:{" "}
                  <strong>{selectedOrder.customerPhone || "No registrado"}</strong>
                </p>
                <p className="text-slate-600">
                  Método de Entrega:{" "}
                  <strong className="text-sky-700">
                    {selectedOrder.deliveryMethod || "Recoger en Sede"}
                  </strong>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-black uppercase text-slate-400 text-[10px]">
                  Resumen Financiero
                </span>
                <p className="text-slate-600">
                  Método de Pago:{" "}
                  <strong>
                    {selectedOrder.paymentMethod || "Efectivo Contra Entrega"}
                  </strong>
                </p>
                {selectedOrder.paymentReference && (
                  <p className="text-sky-700 font-bold">
                    No. Boleta / Ref: {selectedOrder.paymentReference}
                  </p>
                )}
                <p className="text-base font-black text-emerald-700 pt-1">
                  Total a Cobrar: Q{selectedOrder.total}
                </p>
              </div>
            </div>

            {/* Formulario de Gestión de Envío y Estado */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (await handleUpdateOrder(selectedOrder.id, orderEditForm)) setSelectedOrder(null);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado del Pedido
                  </label>
                  <select
                    value={orderEditForm.status}
                    onChange={(e) =>
                      setOrderEditForm({
                        ...orderEditForm,
                        status: e.target.value as StoreOrder["status"],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-bold"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Preparación">En Preparación</option>
                    <option value="Enviado (Cargo Expreso)">
                      Enviado (Cargo Expreso)
                    </option>
                    <option value="Listo para Recoger">
                      Listo para Recoger en Sede
                    </option>
                    <option value="Entregado">Entregado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado del Pago
                  </label>
                  <select
                    value={orderEditForm.paymentStatus}
                    onChange={(e) =>
                      setOrderEditForm({
                        ...orderEditForm,
                        paymentStatus: e.target.value as StoreOrder["paymentStatus"],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-bold"
                  >
                    <option value="Pendiente">Pago Pendiente</option>
                    <option value="Verificado">✓ Pago Verificado</option>
                  </select>
                </div>
              </div>

              {selectedOrder.deliveryMethod === "Cargo Expreso" && (
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-3">
                  <div className="flex items-center gap-2 text-sky-900 font-black text-xs uppercase">
                    <Truck className="w-4 h-4 text-sky-600" />
                    <span>Datos de Envío por Cargo Expreso</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-sky-950 mb-1">
                      Número de Guía de Cargo Expreso
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. CE-90451238"
                      value={orderEditForm.trackingNumber}
                      onChange={(e) =>
                        setOrderEditForm({
                          ...orderEditForm,
                          trackingNumber: e.target.value,
                          status:
                            e.target.value.trim() &&
                            orderEditForm.status === "Pendiente"
                              ? "Enviado (Cargo Expreso)"
                              : orderEditForm.status,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-sky-300 bg-white text-sm font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-sky-950 mb-1">
                        Departamento / Municipio
                      </label>
                      <input
                        type="text"
                        value={orderEditForm.department}
                        onChange={(e) =>
                          setOrderEditForm({
                            ...orderEditForm,
                            department: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-sky-300 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-sky-950 mb-1">
                        Dirección Exacta
                      </label>
                      <input
                        type="text"
                        value={orderEditForm.shippingAddress}
                        onChange={(e) =>
                          setOrderEditForm({
                            ...orderEditForm,
                            shippingAddress: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-sky-300 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas Internas de Seguimiento / Entrega
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Se despachó en agencia Cargo Expreso Amatitlán / Se acordó entrega el sábado..."
                  value={orderEditForm.adminNotes}
                  onChange={(e) =>
                    setOrderEditForm({
                      ...orderEditForm,
                      adminNotes: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                {selectedOrder.customerPhone && (
                  <a
                    href={buildCustomerWhatsApp({
                      ...selectedOrder,
                      ...orderEditForm,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar Guía / Estado por WhatsApp</span>
                  </a>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    Guardar Gestión del Pedido
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
