"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { useCart } from "@/components/CartProvider";

const LINKS = [
  { href: "/", label: "Inicio", icon: null, color: "" },
  { href: "/catalogo", label: "Adopciones", icon: Dog, color: "text-amber-500" },
  { href: "/conocenos", label: "Conócenos", icon: Users, color: "text-sky-500" },
  { href: "/tienda", label: "Ayúdanos comprando", icon: ShoppingBag, color: "text-sky-500" },
  { href: "/#transparencia", label: "Transparencia", icon: Shield, color: "text-sky-500" },
  { href: "/#voluntariado", label: "Voluntariado", icon: Calendar, color: "text-blue-500" },
  { href: "/#reportar-caso", label: "Reportar Caso", icon: AlertTriangle, color: "text-rose-500" },
];

export default function Navbar() {
  const router = useRouter();
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  // Solo el personal con sesión iniciada ve los accesos al panel.
  // Para el público NO existe ningún botón hacia /admin.
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setIsStaff(Boolean(d.admin)))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsStaff(false);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:bg-emerald-700 transition">
              <Dog className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-800 tracking-tight block leading-none">
                DOG Rescue <span className="text-emerald-600">Guatemala</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">Refugio Amatitlán</span>
            </div>
          </Link>

          {/* Nav Links (escritorio) */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
            {LINKS.map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href} className="hover:text-emerald-600 transition flex items-center gap-1.5 whitespace-nowrap">
                {Icon && <Icon className={`w-4 h-4 hidden xl:block ${color}`} />}
                {label}
              </Link>
            ))}
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isStaff && (
              <>
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex items-center gap-2 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-600" />
                  <span>Panel</span>
                </Link>
                <button
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  className="hidden sm:inline-flex p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}

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
          {isStaff && (
            <div className="flex gap-2 pt-2">
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100"
              >
                <LayoutDashboard className="w-4 h-4" /> Panel
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100"
              >
                <LogOut className="w-4 h-4" /> Salir
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
