"use client";

import { useState } from "react";
import {
  Bell,
  Heart,
  ShoppingBag,
  Users,
  AlertTriangle,
  CheckCheck,
  Trash2,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { AdminNotification } from "@/lib/notifications";

type Props = {
  notifications: AdminNotification[];
  onRefresh: () => void;
  onNavigateTab: (tab: any) => void;
};

export default function NotificationsCenter({
  notifications,
  onRefresh,
  onNavigateTab,
}: Props) {
  const [filterType, setFilterType] = useState<string>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const adoptionCount = notifications.filter(
    (n) => n.type === "adoption"
  ).length;
  const orderCount = notifications.filter((n) => n.type === "order").length;
  const volunteerCount = notifications.filter(
    (n) => n.type === "volunteer" || n.type === "case_report"
  ).length;

  const filtered =
    filterType === "all"
      ? notifications
      : notifications.filter((n) => n.type === filterType);

  const handleMarkRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onRefresh();
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    onRefresh();
  };

  const handleDeleteOne = async (id: string) => {
    await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    onRefresh();
  };

  const handleClearAll = async () => {
    if (!window.confirm("¿Deseas limpiar todo el historial de notificaciones?"))
      return;
    await fetch("/api/notifications", { method: "DELETE" });
    onRefresh();
  };

  const getTypeStyle = (type: AdminNotification["type"]) => {
    switch (type) {
      case "adoption":
        return {
          label: "Solicitud de Adopción",
          icon: Heart,
          badge: "bg-rose-100 text-rose-800 border-rose-200",
          iconBg: "bg-rose-500 text-white",
          buttonLabel: "Ver en Gestión Adoptantes",
        };
      case "order":
        return {
          label: "Compra en Tienda",
          icon: ShoppingBag,
          badge: "bg-sky-100 text-sky-800 border-sky-200",
          iconBg: "bg-sky-600 text-white",
          buttonLabel: "Ver Pedido en Gestión Tienda",
        };
      case "volunteer":
        return {
          label: "Postulación Voluntariado",
          icon: Users,
          badge: "bg-amber-100 text-amber-800 border-amber-200",
          iconBg: "bg-amber-500 text-white",
          buttonLabel: "Ver en Gestión Voluntarios",
        };
      case "case_report":
        return {
          label: "Perrito en Riesgo",
          icon: AlertTriangle,
          badge: "bg-purple-100 text-purple-800 border-purple-200",
          iconBg: "bg-purple-600 text-white",
          buttonLabel: "Ver Reporte",
        };
      default:
        return {
          label: "Actividad del Sistema",
          icon: Bell,
          badge: "bg-slate-100 text-slate-800 border-slate-200",
          iconBg: "bg-slate-700 text-white",
          buttonLabel: "Ir al módulo",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* CABECERA Y KPIs DE ACTIVIDAD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full mb-1.5 border border-emerald-200">
              <Bell className="w-3.5 h-3.5" />
              <span>Actividad en Tiempo Real del Sitio Web</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Centro de Notificaciones (Adopciones, Compras y Solicitudes)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Aquí se registra automáticamente cada postulación de adopción, compra en la tienda solidaria, solicitud de voluntariado y reporte ciudadano.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shadow-xs"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Marcar todas como leídas ({unreadCount})</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpiar historial</span>
              </button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <p className="text-xs font-bold text-emerald-800 uppercase">
              Nuevas sin leer
            </p>
            <p className="text-3xl font-black text-emerald-900 mt-1">
              {unreadCount}
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Alertas pendientes de revisión
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80">
            <p className="text-xs font-bold text-rose-800 uppercase">
              Solicitudes Adopción
            </p>
            <p className="text-3xl font-black text-rose-900 mt-1">
              {adoptionCount}
            </p>
            <p className="text-[11px] text-rose-700 mt-0.5">
              Postulaciones desde /catalogo
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80">
            <p className="text-xs font-bold text-sky-800 uppercase">
              Compras en Tienda
            </p>
            <p className="text-3xl font-black text-sky-900 mt-1">
              {orderCount}
            </p>
            <p className="text-[11px] text-sky-700 mt-0.5">
              Pedidos de Playeras y Paletas
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <p className="text-xs font-bold text-amber-800 uppercase">
              Voluntarios y Reportes
            </p>
            <p className="text-3xl font-black text-amber-900 mt-1">
              {volunteerCount}
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Participación ciudadana
            </p>
          </div>
        </div>

        {/* FILTROS */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {[
            { id: "all", label: `Todas (${notifications.length})` },
            { id: "adoption", label: `Adopciones (${adoptionCount})` },
            { id: "order", label: `Compras Tienda (${orderCount})` },
            {
              id: "volunteer",
              label: `Voluntariado (${
                notifications.filter((n) => n.type === "volunteer").length
              })`,
            },
            {
              id: "case_report",
              label: `Reportes de Riesgo (${
                notifications.filter((n) => n.type === "case_report").length
              })`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterType === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE NOTIFICACIONES */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">
            No hay notificaciones en esta categoría todavía
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            En cuanto un visitante envíe una solicitud de adopción en /catalogo o confirme una compra en /tienda, aparecerá aquí al instante.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const style = getTypeStyle(n.type);
            const Icon = style.icon;
            return (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  n.read
                    ? "bg-white border-slate-200"
                    : "bg-emerald-50/40 border-emerald-300 shadow-xs"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${style.iconBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${style.badge}`}
                      >
                        {style.label}
                      </span>
                      {!n.read && (
                        <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                          Nueva
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(n.createdAt).toLocaleString("es-GT", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      {n.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!n.read) await handleMarkRead(n.id);
                      onNavigateTab(n.targetTab);
                    }}
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    <span>{style.buttonLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      title="Marcar como leída"
                      className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteOne(n.id)}
                    title="Eliminar notificación"
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
