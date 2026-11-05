"use client";
import { useEffect, useState } from "react";
import type { AboutContent, AboutSlide, Founder } from "@/lib/about-content";
import AboutPhoto from "@/components/AboutPhoto";
export default function AboutContentManager() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  async function load() {
    setError("");
    try { const res = await fetch("/api/about-settings", { cache: "no-store" }); if (!res.ok) throw Error("No se pudo cargar Conócenos."); const data = await res.json(); if (!Array.isArray(data.carousel) || !Array.isArray(data.family) || data.family.length !== 3) throw Error("Configuración no válida."); setContent(data); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo cargar."); }
  }
  useEffect(() => { void load(); }, []);
  async function save(key: keyof AboutContent) {
    if (!content || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const res = await fetch("/api/about-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: content[key] }) });
      const data = await res.json(); if (!res.ok) throw Error(data.error || "No se pudo guardar.");
      setContent(current => current ? { ...current, [key]: data[key] } : current);
      setNotice(key === "carousel" ? "Carrusel guardado." : "Familia guardada.");
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo guardar."); } finally { setSaving(false); }
  }
  function editSlide(index: number, patch: Partial<AboutSlide>) { setContent(current => current ? { ...current, carousel: current.carousel.map((slide, i) => i === index ? { ...slide, ...patch } : slide) } : current); }
  function editMember(index: number, patch: Partial<Founder>) { setContent(current => current ? { ...current, family: current.family.map((member, i) => i === index ? { ...member, ...patch } : member) } : current); }
  function reorder(index: number, delta: number) { setContent(current => { if (!current) return current; const slides = [...current.carousel]; [slides[index], slides[index + delta]] = [slides[index + delta], slides[index]]; return { ...current, carousel: slides }; }); }
  const inputClass = "w-full rounded-xl border border-slate-300 p-2 text-sm";
  const buttonClass = "rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-bold disabled:opacity-40";
  return <div className="space-y-6">
    {error && <p role="alert" className="text-rose-700 bg-rose-50 rounded-xl p-3">{error} {!content && <button type="button" onClick={() => void load()} className="underline">Reintentar</button>}</p>}
    {notice && <p role="status" className="text-emerald-700">{notice}</p>}
    {!content ? <p>Cargando configuración de Conócenos…</p> : <fieldset disabled={saving} className="space-y-6 disabled:opacity-70">
      <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4"><h2 className="text-xl font-extrabold text-slate-900">Carrusel de Nuestra Historia</h2><p className="text-sm text-slate-500">El orden de esta lista es el orden público. Usa URLs persistentes o rutas de imágenes publicadas. Guarda para aplicar los cambios.</p>
        {content.carousel.map((slide, i) => <div key={slide.id} className="grid sm:grid-cols-[160px_1fr] gap-4 border border-slate-200 p-4 rounded-xl"><AboutPhoto key={slide.url} src={slide.url} alt={slide.title || "Vista previa"} className="w-full h-36 object-cover rounded-xl" /><div className="space-y-2">{([['url','URL o ruta'],['title','Título'],['subtitle','Subtítulo'],['badge','Insignia amarilla (opcional)']] as const).map(([key, label]) => <label key={key} className="block text-xs font-bold text-slate-700">{label}<input className={inputClass} value={slide[key]} onChange={e => editSlide(i, { [key]: e.target.value })} /></label>)}<div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} disabled={i === 0} onClick={() => reorder(i, -1)} aria-label={"Subir fotografía " + (i + 1)}>↑ Subir</button><button type="button" className={buttonClass} disabled={i === content.carousel.length - 1} onClick={() => reorder(i, 1)} aria-label={"Bajar fotografía " + (i + 1)}>↓ Bajar</button><button type="button" className="text-rose-700 px-3" onClick={() => setContent({ ...content, carousel: content.carousel.filter(item => item.id !== slide.id) })}>Eliminar fotografía {i + 1}</button></div></div></div>)}
        {!content.carousel.length && <p className="text-sm text-slate-500">Sin fotografías. La portada original no se volverá a agregar automáticamente.</p>}
        <div className="flex flex-wrap gap-3"><button type="button" className={buttonClass} disabled={content.carousel.length >= 30} onClick={() => setContent({ ...content, carousel: [...content.carousel, { id: crypto.randomUUID(), url: "", title: "", subtitle: "", badge: "" }] })}>Agregar fotografía</button><button type="button" className={buttonClass} onClick={() => void save('carousel')}>{saving ? "Guardando…" : "Guardar carrusel"}</button></div>
      </section>
      <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4"><h2 className="text-xl font-extrabold text-slate-900">Familia Fundadora</h2><div className="grid md:grid-cols-3 gap-6">{content.family.map((member, i) => <div key={i} className="space-y-3"><AboutPhoto key={member.image} src={member.image} alt={member.name} className="mx-auto rounded-full w-32 h-32 object-cover border-4 border-sky-100" /><label className="block text-xs font-bold">Nombre del integrante {i + 1}<input className={inputClass} value={member.name} onChange={e => editMember(i, { name: e.target.value })} /></label><label className="block text-xs font-bold">URL de fotografía<input className={inputClass} value={member.image} onChange={e => editMember(i, { image: e.target.value })} /></label></div>)}</div><button type="button" className={buttonClass} onClick={() => void save('family')}>{saving ? "Guardando…" : "Guardar familia"}</button></section>
    </fieldset>}
  </div>;
}
