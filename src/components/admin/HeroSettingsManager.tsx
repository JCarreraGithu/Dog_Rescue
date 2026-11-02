"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Type,
  Palette,
  Check,
  RotateCcw,
  Eye,
  ArrowUpRight,
  MapPin,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  AlignLeft,
  AlignCenter,
  Bold,
  Italic,
} from "lucide-react";
import {
  HomeHeroSettings,
  DEFAULT_HOME_HERO_SETTINGS,
  getHeroFontFamilyStyle,
  getHeroHighlightClass,
  getHeroFontSizeClass,
  getHeroWeightClass,
} from "@/lib/home-settings-client";

const FONT_OPTIONS: Array<{
  id: HomeHeroSettings["fontFamily"];
  name: string;
  preview: string;
  description: string;
  style: React.CSSProperties;
}> = [
  {
    id: "sans",
    name: "Inter (Moderna y Limpia)",
    preview: "Transformando vidas",
    description: "Geométrica, profesional y de máxima legibilidad.",
    style: { fontFamily: "'Inter', sans-serif" },
  },
  {
    id: "montserrat",
    name: "Montserrat (Fuerte y Sólida)",
    preview: "Transformando vidas",
    description: "Urbana, enérgica y con gran presencia institucional.",
    style: { fontFamily: "'Montserrat', sans-serif" },
  },
  {
    id: "serif",
    name: "Merriweather (Clásica y Conmovedora)",
    preview: "Transformando vidas",
    description: "Cálida, literaria, transmite empatía y tradición.",
    style: { fontFamily: "'Merriweather', serif" },
  },
  {
    id: "fredoka",
    name: "Fredoka (Amigable y Redondeada)",
    preview: "Transformando vidas",
    description: "Cercana, suave y tierna, ideal para rescate animal.",
    style: { fontFamily: "'Fredoka', sans-serif" },
  },
  {
    id: "caveat",
    name: "Caveat (Manuscrita con Corazón)",
    preview: "Transformando vidas",
    description: "Estilo firma hecha a mano, muy humana y cercana.",
    style: { fontFamily: "'Caveat', cursive" },
  },
  {
    id: "oswald",
    name: "Oswald (Condensada e Impacto)",
    preview: "TRANSFORMANDO VIDAS",
    description: "Alta, compacta, excelente para lemas en mayúsculas.",
    style: { fontFamily: "'Oswald', sans-serif" },
  },
];

const HIGHLIGHT_COLOR_OPTIONS: Array<{
  id: HomeHeroSettings["highlightColor"];
  name: string;
  bgPreview: string;
  className: string;
}> = [
  {
    id: "sky",
    name: "Celeste Cielo (Oficial)",
    bgPreview: "bg-sky-400",
    className: "text-sky-400",
  },
  {
    id: "emerald",
    name: "Verde Esmeralda",
    bgPreview: "bg-emerald-400",
    className: "text-emerald-400",
  },
  {
    id: "amber",
    name: "Ámbar Cálido / Sol",
    bgPreview: "bg-amber-400",
    className: "text-amber-400",
  },
  {
    id: "rose",
    name: "Rosa Solidario",
    bgPreview: "bg-rose-400",
    className: "text-rose-400",
  },
  {
    id: "white",
    name: "Blanco Puro Subrayado",
    bgPreview: "bg-white",
    className: "text-white underline decoration-sky-400",
  },
  {
    id: "gradient-cyan",
    name: "Degradado Cyan Eléctrico",
    bgPreview: "bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300",
    className:
      "bg-gradient-to-r from-sky-300 via-cyan-400 to-teal-300 bg-clip-text text-transparent",
  },
  {
    id: "gradient-gold",
    name: "Degradado Oro Radiante",
    bgPreview: "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500",
    className:
      "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent",
  },
];

export default function HeroSettingsManager() {
  const [settings, setSettings] = useState<HomeHeroSettings>(
    DEFAULT_HOME_HERO_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<"content" | "typography" | "colors">("content");

  useEffect(() => {
    fetch("/api/home-settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setSettings(data);
        }
      })
      .catch((err) => console.error("Error cargando lema:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/home-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo guardar la configuración");
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4500);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Error al guardar el lema de inicio."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (
      !window.confirm(
        "¿Restablecer el lema y estilos a los valores originales predeterminados?"
      )
    ) {
      return;
    }
    setSettings(DEFAULT_HOME_HERO_SETTINGS);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">
          Cargando configuración del lema de portada...
        </p>
      </div>
    );
  }

  const fontStyle = getHeroFontFamilyStyle(settings.fontFamily);
  const highlightClass = getHeroHighlightClass(settings.highlightColor);
  const sizeClass = getHeroFontSizeClass(settings.fontSize);
  const weightClass = getHeroWeightClass(settings.fontWeight);

  return (
    <div className="space-y-6">
      {/* HEADER DE LA SECCIÓN */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Personalización del Lema y Portada Principal
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Edita el mensaje principal de bienvenida, elige el tipo de letra, tamaño, color y estilos con vista previa en vivo.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Original</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3.5 py-2.5 rounded-xl border border-sky-200 transition"
          >
            <span>Ver sitio público</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-bold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            ¡El lema principal y sus estilos tipográficos fueron guardados exitosamente! Los cambios ya son visibles en la página de inicio.
          </span>
        </div>
      )}

      {/* CONTENEDOR DE DOS COLUMNAS: FORMULARIO Y VISTA PREVIA */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* COLUMNA 1: FORMULARIO DE PERSONALIZACIÓN */}
        <div className="xl:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          {/* SUB-PESTAÑAS DE EDICIÓN */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-extrabold gap-1">
            <button
              type="button"
              onClick={() => setActiveFormTab("content")}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeFormTab === "content"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Type className="w-4 h-4 text-sky-600" />
              <span>1. Textos del Lema</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab("typography")}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeFormTab === "typography"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>2. Tipografía y Estilo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab("colors")}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeFormTab === "colors"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Palette className="w-4 h-4 text-amber-500" />
              <span>3. Colores y Resaltado</span>
            </button>
          </div>

          {/* 1. TEXTOS */}
          {activeFormTab === "content" && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-800 mb-1">
                  Distintivo Superior (Badge con Ubicación)
                </label>
                <input
                  type="text"
                  value={settings.badgeText}
                  onChange={(e) =>
                    setSettings({ ...settings, badgeText: e.target.value })
                  }
                  placeholder="Ej. Amatitlán, Guatemala • Iniciativa Comunitaria 100% Local"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Aparece arriba del lema principal con el icono de ubicación.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    Lema - Primera Parte (Texto Blanco)
                  </label>
                  <input
                    type="text"
                    value={settings.mottoPart1}
                    onChange={(e) =>
                      setSettings({ ...settings, mottoPart1: e.target.value })
                    }
                    placeholder="Ej. Transformando vidas,"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Primera línea o frase inicial del lema.
                  </p>
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    Lema - Frase Destacada (Con Color)
                  </label>
                  <input
                    type="text"
                    value={settings.mottoHighlight}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mottoHighlight: e.target.value,
                      })
                    }
                    placeholder="Ej. un rescate a la vez."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sky-700 font-black text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Segunda línea que llevará el color de acento elegido.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-800 mb-1">
                  Párrafo de Misión / Descripción del Refugio
                </label>
                <textarea
                  rows={4}
                  value={settings.description}
                  onChange={(e) =>
                    setSettings({ ...settings, description: e.target.value })
                  }
                  placeholder="Escribe la misión, presentación y valores del albergue..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs leading-relaxed focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    Botón Principal (Adopciones)
                  </label>
                  <input
                    type="text"
                    value={settings.button1Text}
                    onChange={(e) =>
                      setSettings({ ...settings, button1Text: e.target.value })
                    }
                    placeholder="Ver Catálogo de Adopciones"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    Botón Secundario (Emergencias)
                  </label>
                  <input
                    type="text"
                    value={settings.button2Text}
                    onChange={(e) =>
                      setSettings({ ...settings, button2Text: e.target.value })
                    }
                    placeholder="Reportar Perrito en Riesgo"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. TIPOGRAFÍA Y ESTILO */}
          {activeFormTab === "typography" && (
            <div className="space-y-5 text-xs">
              <div>
                <label className="block font-black text-slate-800 mb-2">
                  Tipo de Letra (Fuente Tipográfica)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FONT_OPTIONS.map((font) => {
                    const isSelected = settings.fontFamily === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() =>
                          setSettings({ ...settings, fontFamily: font.id })
                        }
                        className={`text-left p-3.5 rounded-2xl border transition cursor-pointer ${
                          isSelected
                            ? "bg-sky-50 border-sky-400 ring-2 ring-sky-300/40"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900">
                            {font.name}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[11px] font-black">
                              ✓
                            </span>
                          )}
                        </div>
                        <p
                          className="text-base text-slate-800 mt-1 font-bold line-clamp-1"
                          style={font.style}
                        >
                          {font.preview}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {font.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    Grosor de Letra (Weight)
                  </label>
                  <select
                    value={settings.fontWeight}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        fontWeight: e.target.value as HomeHeroSettings["fontWeight"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold"
                  >
                    <option value="normal">Normal (400)</option>
                    <option value="semibold">Seminegrita (600)</option>
                    <option value="bold">Negrita (700)</option>
                    <option value="black">Extra Gruesa / Black (900)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    Tamaño de Letra del Lema
                  </label>
                  <select
                    value={settings.fontSize}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        fontSize: e.target.value as HomeHeroSettings["fontSize"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold"
                  >
                    <option value="large">Grande (4xl)</option>
                    <option value="extra">Muy Grande / Equilibrado (5xl)</option>
                    <option value="giant">Gigante / Gran Impacto (6xl)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    Estilo Cursiva
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({ ...settings, fontStyle: "normal" })
                      }
                      className={`flex-1 py-1.5 text-center rounded-lg font-bold transition cursor-pointer ${
                        settings.fontStyle === "normal"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600"
                      }`}
                    >
                      Recta
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({ ...settings, fontStyle: "italic" })
                      }
                      className={`flex-1 py-1.5 text-center rounded-lg font-bold italic transition cursor-pointer ${
                        settings.fontStyle === "italic"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600"
                      }`}
                    >
                      Cursiva
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    Transformación
                  </label>
                  <select
                    value={settings.textTransform}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        textTransform: e.target.value as HomeHeroSettings["textTransform"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold"
                  >
                    <option value="none">Normal</option>
                    <option value="uppercase">MAYÚSCULAS</option>
                    <option value="capitalize">Capitalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    Alineación
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({ ...settings, textAlignment: "left" })
                      }
                      className={`flex-1 py-1.5 flex items-center justify-center gap-1 rounded-lg font-bold transition cursor-pointer ${
                        settings.textAlignment === "left"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600"
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>Izquierda</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({ ...settings, textAlignment: "center" })
                      }
                      className={`flex-1 py-1.5 flex items-center justify-center gap-1 rounded-lg font-bold transition cursor-pointer ${
                        settings.textAlignment === "center"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600"
                      }`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                      <span>Centro</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. COLORES Y RESALTADO */}
          {activeFormTab === "colors" && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-800 mb-1">
                  Color de la Frase Destacada ({`"${settings.mottoHighlight}"`})
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Selecciona la tonalidad que resaltará el lema en la portada:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {HIGHLIGHT_COLOR_OPTIONS.map((col) => {
                    const isSelected = settings.highlightColor === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() =>
                          setSettings({ ...settings, highlightColor: col.id })
                        }
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition text-left cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 ring-2 ring-sky-300"
                            : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full shrink-0 shadow-xs border border-white/30 ${col.bgPreview}`}
                        />
                        <div className="flex-1">
                          <p className="font-black text-xs">{col.name}</p>
                          <p
                            className={`text-[11px] font-bold mt-0.5 ${
                              isSelected ? "text-slate-300" : col.className
                            }`}
                          >
                            Muestra: {settings.mottoHighlight || "Lema"}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* BOTÓN INFERIOR DE GUARDAR */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? "Guardando cambios..." : "Guardar Cambios del Lema"}</span>
            </button>
          </div>
        </div>

        {/* COLUMNA 2: VISTA PREVIA EN VIVO (STICKY) */}
        <div className="xl:col-span-6 space-y-3 sticky top-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-sky-600" />
              <span>Vista Previa en Tiempo Real de la Portada</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Así se verá en la página de inicio
            </span>
          </div>

          {/* SIMULADOR DEL HERO CON LA APARIENCIA EXACTA DE LA PÁGINA */}
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative bg-gradient-to-b from-sky-900 via-sky-800 to-slate-900 text-white p-6 sm:p-8">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            <div
              className={`relative z-10 space-y-5 ${
                settings.textAlignment === "center"
                  ? "text-center mx-auto max-w-lg"
                  : "text-left"
              }`}
            >
              {/* Badge */}
              <div
                className={`inline-flex items-center gap-2 bg-sky-700/60 backdrop-blur-md border border-sky-400/30 text-sky-200 text-[11px] font-semibold px-3 py-1.5 rounded-full ${
                  settings.textAlignment === "center" ? "mx-auto" : ""
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-sky-300" />
                <span>{settings.badgeText}</span>
              </div>

              {/* H1 Principal con la tipografía y estilos seleccionados */}
              <h1
                style={fontStyle}
                className={`tracking-tight leading-tight transition-all ${sizeClass} ${weightClass} ${
                  settings.fontStyle === "italic" ? "italic" : ""
                } ${
                  settings.textTransform === "uppercase"
                    ? "uppercase"
                    : settings.textTransform === "capitalize"
                    ? "capitalize"
                    : ""
                }`}
              >
                <span>{settings.mottoPart1}</span>{" "}
                <br className="hidden sm:inline" />
                <span className={highlightClass}>
                  {settings.mottoHighlight}
                </span>
              </h1>

              {/* Párrafo descriptivo */}
              <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed max-w-xl">
                {settings.description}
              </p>

              {/* Botones de acción */}
              <div
                className={`flex flex-col sm:flex-row items-center gap-3 pt-2 ${
                  settings.textAlignment === "center"
                    ? "justify-center"
                    : "justify-start"
                }`}
              >
                <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sky-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md text-xs">
                  <Heart className="w-4 h-4 fill-slate-950" />
                  <span>{settings.button1Text}</span>
                </div>
                <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-600/90 text-white font-semibold px-4 py-2.5 rounded-xl border border-rose-500/40 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{settings.button2Text}</span>
                </div>
              </div>

              <div
                className={`pt-2 flex items-center gap-5 text-[10px] text-sky-200/80 ${
                  settings.textAlignment === "center"
                    ? "justify-center"
                    : "justify-start"
                }`}
              >
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Fichas médicas al día
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Proceso transparente
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
