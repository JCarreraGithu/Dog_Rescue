"use client";
import { useEffect, useState } from "react";
import { Award, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import type { AboutSlide } from "@/lib/about-content";
import AboutPhoto from "@/components/AboutPhoto";
export default function AboutHeroVisual() {
  const [slides, setSlides] = useState<AboutSlide[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/about-settings", { cache: "no-store", signal: controller.signal }).then(res => { if (!res.ok) throw Error(); return res.json(); }).then(data => { if (Array.isArray(data.carousel)) setSlides(data.carousel); }).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);
  const active = slides[index];
  const move = (next: number) => { setPaused(true); setIndex((next + slides.length) % slides.length); };
  return <div className="relative mx-auto max-w-md lg:max-w-none" role="region" aria-roledescription="carrusel" aria-label="Nuestra historia en fotografías" onPointerEnter={() => setPaused(true)} onPointerDown={() => setPaused(true)} onFocusCapture={() => setPaused(true)} onKeyDown={e => { if (slides.length && e.key === "ArrowLeft") { e.preventDefault(); move(index - 1); } if (slides.length && e.key === "ArrowRight") { e.preventDefault(); move(index + 1); } }}>
    <div className="relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800 aspect-[4/3] sm:aspect-[1/1]">
      {slides.length === 0 && <div className="h-full flex items-center justify-center text-slate-300 text-sm">Nuestra historia</div>}
      {slides.map((slide, i) => <div key={slide.id} aria-hidden={i !== index} className={"absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none " + (i === index ? "opacity-100" : "opacity-0 pointer-events-none")}><AboutPhoto key={slide.url} src={slide.url} alt={slide.title || "Fotografía del refugio"} className="w-full h-full object-cover" /></div>)}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
      {active && <div className="absolute bottom-10 left-5 right-5 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex items-center justify-between gap-3"><div><p className="text-xs tracking-wider text-sky-400 font-bold">{active.title}</p><p className="text-sm font-semibold text-white mt-0.5">{active.subtitle}</p></div><Heart className="w-5 h-5 text-sky-400 shrink-0" /></div>}
      {slides.length > 1 && <><button type="button" aria-label="Fotografía anterior" onClick={() => move(index - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 text-white"><ChevronLeft /></button><button type="button" aria-label="Fotografía siguiente" onClick={() => move(index + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 text-white"><ChevronRight /></button><div className="absolute bottom-3 inset-x-0 flex justify-center gap-2">{slides.map((slide, i) => <button type="button" key={slide.id} aria-label={"Ir a fotografía " + (i + 1)} aria-current={index === i ? "true" : undefined} onClick={() => move(i)} className="p-1.5"><span className={"block w-2.5 h-2.5 rounded-full " + (index === i ? "bg-amber-400" : "bg-white/50")} /></button>)}</div></>}
    </div>
    {active?.badge && <div className="absolute -top-3 right-2 sm:-right-4 bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black text-xs px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border-2 border-slate-950 max-w-[90%]"><Award className="w-4 h-4 shrink-0" /><span>{active.badge}</span></div>}
  </div>;
}
