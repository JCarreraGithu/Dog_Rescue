"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, HeartPulse, MapPin } from "lucide-react";
import { DEFAULT_IMPACT_CASES, ImpactCase } from "@/data/impact-cases";

export default function ImpactCarousel() {
  const [cases, setCases] = useState<ImpactCase[]>(DEFAULT_IMPACT_CASES);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch("/api/special-cases")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const featured = data.filter((c: ImpactCase) => c.featured !== false);
          setCases(featured.length > 0 ? featured : data);
        }
      })
      .catch(() => {});
  }, []);

  const total = cases.length;
  const go = (i: number) => setIndex((i + total) % total);

  // Avance automático cada 7 s (se detiene con el mouse encima o si el caso tiene video)
  useEffect(() => {
    if (total < 2 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % total), 7000);
    return () => clearInterval(timer);
  }, [total, paused]);

  if (total === 0) return null;
  const current = cases[index] ?? cases[0];
  if (!current) return null;

  return (
    <div
      className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-4 border border-sky-100"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrusel"
      aria-label="Casos de impacto"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider">
          <HeartPulse className="w-4 h-4" />
          <span>Casos Especiales</span>
        </div>
        {current.status && (
          <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            {current.status}
          </span>
        )}
      </div>

      <div className="relative h-64 rounded-2xl overflow-hidden bg-slate-100">
        {current.video ? (
          <video
            key={current.id}
            src={current.video}
            poster={current.image}
            controls
            playsInline
            preload="metadata"
            onPlay={() => setPaused(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            key={current.id}
            src={current.image}
            alt={current.title}
            className="w-full h-full object-cover"
          />
        )}

        {current.name && (
          <span className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-amber-300 text-xs font-extrabold px-3 py-1 rounded-lg">
            🐾 {current.name}
          </span>
        )}

        {total > 1 && (
          <>
            <button
              onClick={() => go(index - 1)}
              aria-label="Caso anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Caso siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>
          </>
        )}
      </div>

      <div className="min-h-[115px]" aria-live="polite">
        <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
          {current.name ? `${current.name}: ` : ""}
          {current.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed line-clamp-3">
          {current.story}
        </p>
        {current.location && (
          <p className="text-[11px] font-semibold text-slate-400 mt-2 inline-flex items-center gap-1">
            <MapPin className="w-3 h-3 text-sky-500" />
            <span>{current.location}</span>
          </p>
        )}
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-2">
          {cases.map((c, i) => (
            <button
              key={c.id}
              onClick={() => go(i)}
              aria-label={`Ir al caso ${i + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                i === index
                  ? "w-6 bg-sky-500"
                  : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}

      <Link
        href="/conocenos#casos"
        className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-3 rounded-xl transition"
      >
        <span>Conoce más casos especiales</span>
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
