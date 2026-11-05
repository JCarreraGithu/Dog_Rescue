"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import {
  Dog,
  Heart,
  Shield,
  AlertTriangle,
  Calendar,
  Users,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";
import { useCart } from "@/components/CartProvider";

const LINKS = [
  { href: "/", label: "Inicio", icon: null, color: "" },
  { href: "/catalogo", label: "Adopciones", icon: Dog, color: "text-amber-500" },
  { href: "/conocenos", label: "Conócenos", icon: Users, color: "text-sky-500" },
  { href: "/tienda", label: "Tienda", icon: ShoppingBag, color: "text-amber-500" },
  { href: "/apoyanos", label: "Apóyanos", icon: Heart, color: "text-rose-500" },
  { href: "/#transparencia", label: "Transparencia", icon: Shield, color: "text-sky-500" },
  { href: "/#voluntariado", label: "Voluntariado", icon: Calendar, color: "text-blue-500" },
  { href: "/#reportar-caso", label: "Reportar Caso", icon: AlertTriangle, color: "text-rose-500" },
];

export default function Navbar() {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo oficial y nombre del refugio */}
          <Link
            href="/"
            className="flex items-center gap-3 group shrink-0"
            aria-label="DOG rescue Guatemala - Ir al inicio"
          >
            <div className="w-12 h-12 shrink-0 flex items-center justify-center">
              <Image
                src="/logo-refugio.jpg"
                alt="Logo oficial DOG rescue Guatemala"
                width={48}
                height={48}
                priority
                className="w-12 h-12 object-contain"
              />
            </div>

            <div className="flex flex-col justify-center">
              <span className="font-extrabold text-lg text-slate-800 tracking-tight whitespace-nowrap leading-tight">
                DOG rescue <span className="text-sky-500">Guatemala</span>
              </span>

              <span className="text-xs text-slate-500 font-medium">
                Refugio Amatitlán
              </span>
            </div>
          </Link>

          {/* Nav Links (escritorio) */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-sm font-medium text-slate-600">
            {LINKS.map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="hover:text-emerald-600 transition flex items-center gap-1.5 whitespace-nowrap"
              >
                {Icon && <Icon className={`w-4 h-4 hidden xl:block ${color}`} />}
                {label}
              </Link>
            ))}
          </nav>

          {/* Acciones públicas */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={openCart}
              aria-label="Ver mi pedido"
              className="relative p-2.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              <ShoppingBag className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>

            <Link
              href="/catalogo"
              className="hidden sm:inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Adoptar Ahora</span>
            </Link>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              className="lg:hidden p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 transition"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {menuOpen && (
        <nav className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {LINKS.map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {Icon && <Icon className={`w-4 h-4 ${color}`} />}
              {label}
            </Link>
          ))}
          <Link
            href="/catalogo"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-600"
          >
            <Heart className="w-4 h-4 fill-white" />
            Adoptar Ahora
          </Link>
        </nav>
      )}
    </header>
  );
}
