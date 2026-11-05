"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Sparkles,
  MapPin,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  Images,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import type { ImpactCase } from "@/data/impact-cases";

function getStatusStyle(status?: string) {
  switch (status) {
    case "Rehabilitado y Adoptado":
      return "bg-emerald-500/95 text-white border-emerald-400";
    case "En Rehabilitación":
      return "bg-amber-500/95 text-slate-950 border-amber-300";
    case "En Adopción":
      return "bg-rose-500/95 text-white border-rose-400";
    default:
      return "bg-sky-600/95 text-white border-sky-400";
  }
}

export default function SpecialCasesSection() {
  const [cases, setCases] = useState<ImpactCase[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [activePhotoByCase, setActivePhotoByCase] = useState<Record<string, number>>({});
  const [selectedCase, setSelectedCase] = useState<ImpactCase | null>(null);
  const [modalPhotoIndex, setModalPhotoIndex] = useState(0);

  useEffect(() => {
    fetch("/api/special-cases", { cache: "no-store" })
      .then(async (res) => { if (!res.ok) throw new Error("Casos no disponibles"); return res.json(); })
      .then((data) => {
        if (Array.isArray(data)) {
          setCases(data);
        }
      })
      .catch(() => {});
  }, []);

  const statuses = [
    "Todos",
    ...Array.from(
      new Set(cases.map((c) => c.status || "Caso Éxito").filter(Boolean))
    ),
  ];

  const filteredCases =
    statusFilter === "Todos"
      ? cases
      : cases.filter((c) => (c.status || "Caso Éxito") === statusFilter);

  const openCaseModal = (c: ImpactCase) => {
    setSelectedCase(c);
    setModalPhotoIndex(activePhotoByCase[c.id] || 0);
  };

  if (cases.length === 0) return null;

  return (
    <section
      id="casos"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-28 scroll-mt-20"
    >
      {/* ENCABEZADO EDITORIAL DE CASOS ESPECIALES */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 rounded-3xl p-8 sm:p-12 text-white mb-12 overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 text-sky-300 text-xs font-extrabold uppercase tracking-wider px-4 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Casos Especiales • Evidencia de Amor</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Historias reales que{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-amber-300">
                transformaron vidas
              </span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
              Cada caso especial representa semanas de cirugías, curaciones, rehabilitación y desvelos. Conoce a los guerreros de cuatro patas que superaron el abandono y el dolor gracias al apoyo de nuestra comunidad.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statuses.map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    active
                      ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25"
                      : "bg-white/10 text-slate-200 hover:bg-white/15 border border-white/10"
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* GRID DE CASOS ESPECIALES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {filteredCases.map((c) => {
          const photos =
            Array.isArray(c.gallery) && c.gallery.length > 0
              ? c.gallery
              : [c.image];
          const activeIdx = activePhotoByCase[c.id] ?? 0;
          const currentImg = photos[activeIdx] || c.image;

          return (
            <article
              key={c.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-2xl hover:border-sky-200 transition-all duration-300 flex flex-col group"
            >
              {/* CABECERA VISUAL CON MINIATURAS DE GALERÍA */}
              <div className="relative h-72 bg-slate-900 overflow-hidden">
                {c.video && activeIdx === 0 ? (
                  <video
                    src={c.video}
                    poster={currentImg}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={currentImg}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

                {/* Estado y contador de fotos */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                  <span
                    className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-md backdrop-blur-md ${getStatusStyle(
                      c.status
                    )}`}
                  >
                    {c.status || "Caso Éxito"}
                  </span>

                  {photos.length > 1 && (
                    <span className="inline-flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/15">
                      <Images className="w-3.5 h-3.5 text-sky-400" />
                      <span>{photos.length} fotos</span>
                    </span>
                  )}
                </div>

                {/* Nombre del perrito y metadatos sobre la imagen */}
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
                  <div>
                    {c.name && (
                      <span className="inline-block bg-amber-400 text-slate-950 font-black text-xs px-3 py-0.5 rounded-lg mb-1.5 shadow">
                        🐾 {c.name}
                      </span>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-200 font-medium">
                      {c.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-400" />
                          {c.location}
                        </span>
                      )}
                      {c.date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-300" />
                          {c.date}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Miniaturas interactivas si tiene más de 1 foto */}
                  {photos.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md p-1.5 rounded-xl border border-white/15">
                      {photos.slice(0, 4).map((photoUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setActivePhotoByCase((prev) => ({
                              ...prev,
                              [c.id]: idx,
                            }))
                          }
                          aria-label={`Ver foto ${idx + 1} de ${c.name || c.title}`}
                          className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                            activeIdx === idx
                              ? "border-amber-400 scale-105"
                              : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={photoUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CONTENIDO DEL CASO */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-snug group-hover:text-sky-700 transition-colors">
                      {c.title}
                    </h3>
                    {c.subtitle && (
                      <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl mt-2 inline-flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                        <span>{c.subtitle}</span>
                      </p>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                    {c.story}
                  </p>

                  {/* Comparativa Antes / Después */}
                  {(c.beforeText || c.afterText) && (
                    <div className="grid grid-cols-1 gap-2.5 pt-1">
                      {c.beforeText && (
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                          <span className="font-black uppercase tracking-wider text-slate-500 block text-[10px] mb-0.5">
                            1. ¿Cómo llegó al rescate?
                          </span>
                          <p className="text-slate-700 leading-relaxed">
                            {c.beforeText}
                          </p>
                        </div>
                      )}
                      {c.afterText && (
                        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
                          <span className="font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1 text-[10px] mb-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>2. Transformación hoy</span>
                          </span>
                          <p className="text-emerald-950 font-medium leading-relaxed">
                            {c.afterText}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* PIE DE TARJETA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => openCaseModal(c)}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-600 hover:text-sky-800 transition cursor-pointer"
                  >
                    <span>Leer historia completa y fotos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>DOG rescue</span>
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* MODAL DE HISTORIA COMPLETA Y GALERÍA */}
      {selectedCase && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedCase(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Caso especial de ${selectedCase.name || selectedCase.title}`}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8 max-h-[92vh] flex flex-col"
          >
            {/* Barra superior */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${getStatusStyle(
                    selectedCase.status
                  )}`}
                >
                  {selectedCase.status || "Caso Éxito"}
                </span>
                {selectedCase.name && (
                  <span className="text-sm font-bold text-amber-300">
                    Caso de {selectedCase.name}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
              {(() => {
                const modalPhotos =
                  Array.isArray(selectedCase.gallery) &&
                  selectedCase.gallery.length > 0
                    ? selectedCase.gallery
                    : [selectedCase.image];
                const safeIndex =
                  modalPhotoIndex < modalPhotos.length ? modalPhotoIndex : 0;

                return (
                  <div className="space-y-3">
                    <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-950">
                      <img
                        src={modalPhotos[safeIndex]}
                        alt={selectedCase.title}
                        className="w-full h-full object-cover"
                      />

                      {modalPhotos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setModalPhotoIndex(
                                (safeIndex - 1 + modalPhotos.length) %
                                  modalPhotos.length
                              )
                            }
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg cursor-pointer"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setModalPhotoIndex(
                                (safeIndex + 1) % modalPhotos.length
                              )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg cursor-pointer"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>

                    {modalPhotos.length > 1 && (
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                        {modalPhotos.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setModalPhotoIndex(idx)}
                            className={`h-16 w-24 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                              safeIndex === idx
                                ? "border-sky-600 ring-2 ring-sky-300"
                                : "border-slate-200 opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Detalles del Caso */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-semibold">
                  {selectedCase.location && (
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      {selectedCase.location}
                    </span>
                  )}
                  {selectedCase.date && (
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      {selectedCase.date}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {selectedCase.name ? `${selectedCase.name}: ` : ""}
                  {selectedCase.title}
                </h2>

                {selectedCase.subtitle && (
                  <p className="text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl inline-flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 shrink-0" />
                    <span>Diagnóstico de ingreso: {selectedCase.subtitle}</span>
                  </p>
                )}

                <p className="text-slate-700 text-base leading-relaxed whitespace-pre-line">
                  {selectedCase.story}
                </p>

                {(selectedCase.beforeText || selectedCase.afterText) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {selectedCase.beforeText && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                          Estado al momento del rescate
                        </span>
                        <p className="text-sm text-slate-800 leading-relaxed">
                          {selectedCase.beforeText}
                        </p>
                      </div>
                    )}
                    {selectedCase.afterText && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 mb-1">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Evolución y estado actual</span>
                        </span>
                        <p className="text-sm text-emerald-950 font-medium leading-relaxed">
                          {selectedCase.afterText}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Gracias a las donaciones y compras solidarias podemos financiar cirugías y rehabilitaciones como esta.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/tienda"
                    className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition"
                  >
                    <span>Apoyar en Tienda Solidaria</span>
                  </Link>
                  <Link
                    href="/catalogo"
                    className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Ver Perritos en Adopción</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
