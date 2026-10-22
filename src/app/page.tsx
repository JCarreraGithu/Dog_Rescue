"use client";

import RefugeMap from "@/components/RefugeMap";
import { useEffect, useState } from "react";
import Link from "next/link";
import ImpactCarousel from "@/components/ImpactCarousel";
import {
  Dog,
  Heart,
  Shield,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Users,
  ChevronRight,
  Sparkles,
  Send,
} from "lucide-react";

export default function HomePage() {
  // Estados para contadores de transparencia
  const [stats, setStats] = useState<any[]>([]);
  // Estados para perros destacados
  const [featuredDogs, setFeaturedDogs] = useState<any[]>([]);
  
  // Solicitud pública de voluntariado
  const initialVolForm = {
    name: "", phone: "", age: "",
    availableDays: [] as string[], commitmentDuration: "",
    interestAreas: [] as string[], animalExperience: "", motivation: "",
    acceptsSafetyRules: false, authorizesDataUse: false,
  };
  const [volForm, setVolForm] = useState(initialVolForm);
  const [volSubmitted, setVolSubmitted] = useState(false);
  const [volLoading, setVolLoading] = useState(false);
  const [volError, setVolError] = useState("");
  const [showVolForm, setShowVolForm] = useState(false);
  const availableDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const interestAreas = [
    "Rescate y Logística en Campo", "Cuidados en Refugio",
    "Venta de Paletas y Productos Solidarios", "Venta de Playeras y Merch Oficial",
    "Redes Sociales y Difusión", "Casas Cuna / Hogar Temporal",
  ];
  const commitments = ["Fines de semana", "Al menos 3 meses", "6 meses o más"];

  // Estado para el formulario de reporte de casos
  const [caseForm, setCaseForm] = useState({
    reporterName: "",
    reporterPhone: "",
    locationAddress: "",
    description: "",
    urgencyLevel: "Media",
  });
  const [caseSubmitted, setCaseSubmitted] = useState(false);

  useEffect(() => {
    // Cargar datos iniciales
    fetch("/api/transparency")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});

    fetch("/api/dogs?status=En Adopción")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFeaturedDogs(data.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  const handleVolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVolError("");
    setVolLoading(true);
    try {
      const res = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...volForm, age: Number(volForm.age) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo enviar la solicitud.");
      }
      setVolSubmitted(true);
      setVolForm(initialVolForm);
    } catch (err) {
      setVolError(err instanceof Error ? err.message : "Error de conexión. Intenta nuevamente.");
    } finally {
      setVolLoading(false);
    }
  };

  const handleCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/case-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseForm),
      });
      if (res.ok) {
        setCaseSubmitted(true);
        setCaseForm({
          reporterName: "",
          reporterPhone: "",
          locationAddress: "",
          description: "",
          urgencyLevel: "Media",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-emerald-900 via-emerald-800 to-slate-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 backdrop-blur-md border border-emerald-500/30 text-emerald-200 text-xs font-semibold px-3.5 py-1.5 rounded-full">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Amatitlán, Guatemala • Iniciativa Comunitaria 100% Local</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Transformando vidas, <br />
              <span className="text-emerald-400">un rescate a la vez.</span>
            </h1>

            <p className="text-lg text-emerald-100/90 leading-relaxed max-w-2xl">
              DOG Rescue Guatemala es un refugio dirigido de manera independiente y sin fines de lucro, centrado en el cuidado, bienestar y protección de los animales. Trabajamos por el rescate, rehabilitación y adopción responsable de perritos en Amatitlán.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/catalogo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-950/30 transition transform hover:-translate-y-0.5"
              >
                <Heart className="w-5 h-5 fill-slate-950" />
                <span>Ver Catálogo de Adopciones</span>
              </Link>
              <Link
                href="#reportar-caso"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-600/90 hover:bg-rose-600 text-white font-semibold px-6 py-3.5 rounded-xl border border-rose-500/40 transition"
              >
                <AlertTriangle className="w-5 h-5" />
                <span>Reportar Perrito en Riesgo</span>
              </Link>
            </div>

            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-emerald-200/80">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Fichas médicas al día
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Proceso transparente
              </span>
            </div>
          </div>

          {/* Carrusel de casos de impacto */}
          <div className="lg:col-span-5 flex justify-center">
            <ImpactCarousel />
          </div>
        </div>
      </section>

      {/* 2. SECCIÓN DE TRANSPARENCIA (CONTADORES PÚBLICOS) */}
      <section id="transparencia" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full mb-2">
              <Shield className="w-4 h-4" />
              <span>Cuentas Claras • Impacto Real</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Sección de Transparencia del Refugio
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto mt-1">
              Demostramos con datos auditables el impacto directo de cada donación y esfuerzo ciudadano en Amatitlán.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {/* Stat 1 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <Dog className="w-6 h-6" />
              </div>
              <p className="text-4xl font-black text-emerald-700">
                {stats.find((s) => s.key === "rescues_count")?.value || 184}
              </p>
              <p className="font-bold text-slate-800 mt-1">Perros Rescatados</p>
              <p className="text-xs text-slate-500 mt-1">Retirados de situaciones de maltrato o peligro</p>
            </div>

            {/* Stat 2 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <p className="text-4xl font-black text-amber-600">
                {stats.find((s) => s.key === "adoptions_count")?.value || 146}
              </p>
              <p className="font-bold text-slate-800 mt-1">Adopciones Integradas</p>
              <p className="text-xs text-slate-500 mt-1">Hogares amorosos verificados con seguimiento</p>
            </div>

            {/* Stat 3 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-4xl font-black text-blue-700">
                {stats.find((s) => s.key === "sterilizations_count")?.value || 310}
              </p>
              <p className="font-bold text-slate-800 mt-1">Esterilizaciones</p>
              <p className="text-xs text-slate-500 mt-1">Frenando la sobrepoblación en la comunidad</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATÁLOGO DESTACADO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">
              Buscan un hogar amoroso
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              Perritos Listos para Adopción
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Todos nuestros perritos cuentan con expediente canino, vacunas al día y tratamiento de salud verificado.
            </p>
          </div>

          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 transition"
          >
            <span>Ver Catálogo Completo</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredDogs.length > 0 ? (
            featuredDogs.map((dog) => (
              <div
                key={dog.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col"
              >
                <div className="relative h-56 bg-slate-100">
                  <img
                    src={dog.photoUrl}
                    alt={dog.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                    {dog.size}
                  </span>
                </div>
                <div className="p-5 flex-grow flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-800">{dog.name}</h3>
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                        {dog.ageCategory} ({dog.ageYears} yrs)
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      {dog.gender} • Temperamento: {dog.temperament}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {dog.rescueHistory}
                    </p>
                  </div>

                  <Link
                    href={`/catalogo?dogId=${dog.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 text-sm rounded-xl transition"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Postular a Adopción</span>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200">
              <Dog className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p>Cargando perritos en adopción...</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. SOLICITUD DE VOLUNTARIADO */}
      <section id="voluntariado" className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold px-3 py-1 rounded-full">
              <Users className="w-4 h-4" /> <span>Voluntariado • Amatitlán</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Forma parte de DOG Rescue Guatemala</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Puedes apoyar en el cuidado de los perritos, rescates, logística, actividades solidarias o difusión en redes sociales.
              Envíanos tu postulación y el equipo del refugio evaluará tu solicitud.
            </p>
            <div className="space-y-3 pt-2 text-sm text-slate-300">
              <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /><span>Indica los días en los que puedes colaborar.</span></div>
              <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /><span>El refugio se comunicará contigo después de evaluar tu perfil.</span></div>
              <div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-emerald-400 shrink-0" /><span>Amatitlán, Guatemala.</span></div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Quiero ser voluntario</h3>
            <p className="text-sm text-slate-600 mb-5">Elige cómo deseas comunicarte con nosotros.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button type="button" onClick={() => { setShowVolForm(true); setVolSubmitted(false); }}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-3 text-sm">
                Enviar solicitud en línea
              </button>
              <a href="https://www.facebook.com/people/DOG-rescue-Guatemala/100079476368990/"
                target="_blank" rel="noopener noreferrer"
                className="rounded-xl border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 font-semibold px-4 py-3 text-sm text-center">
                Consultar por Facebook
              </a>
            </div>

            {volSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 mx-auto" />
                <h4 className="font-bold text-lg">¡Solicitud recibida!</h4>
                <p className="text-sm">Tu postulación está En Evaluación. El refugio se comunicará contigo si necesitas continuar el proceso.</p>
                <button type="button" onClick={() => { setVolSubmitted(false); setShowVolForm(false); }} className="text-sm font-semibold underline">Volver</button>
              </div>
            ) : showVolForm ? (
              <form onSubmit={handleVolSubmit} className="space-y-4">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Nombre completo *</label>
                  <input required maxLength={120} value={volForm.name} onChange={(e) => setVolForm({ ...volForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-xs font-bold text-slate-700 mb-1">Edad (18+) *</label>
                    <input required type="number" min={18} max={120} value={volForm.age} onChange={(e) => setVolForm({ ...volForm, age: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" /></div>
                  <div><label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp *</label>
                    <input required type="tel" maxLength={30} value={volForm.phone} onChange={(e) => setVolForm({ ...volForm, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" /></div>
                </div>
                <fieldset><legend className="text-xs font-bold text-slate-700 mb-2">Días disponibles * (elige al menos uno)</legend>
                  <div className="grid grid-cols-2 gap-2">{availableDays.map((day) => (
                    <label key={day} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={volForm.availableDays.includes(day)} onChange={(e) => setVolForm({ ...volForm, availableDays: e.target.checked ? [...volForm.availableDays, day] : volForm.availableDays.filter((d) => d !== day) })} />{day}
                    </label>
                  ))}</div></fieldset>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Compromiso de tiempo *</label>
                  <select required value={volForm.commitmentDuration} onChange={(e) => setVolForm({ ...volForm, commitmentDuration: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">
                    <option value="">Selecciona una opción</option>{commitments.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select></div>
                <fieldset><legend className="text-xs font-bold text-slate-700 mb-2">Áreas en las que te gustaría apoyar *</legend>
                  <div className="space-y-2">{interestAreas.map((area) => (
                    <label key={area} className="flex items-start gap-2 text-sm text-slate-700">
                      <input type="checkbox" className="mt-1" checked={volForm.interestAreas.includes(area)} onChange={(e) => setVolForm({ ...volForm, interestAreas: e.target.checked ? [...volForm.interestAreas, area] : volForm.interestAreas.filter((item) => item !== area) })} />{area}
                    </label>
                  ))}</div></fieldset>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">¿Tienes experiencia con animales o voluntariado?</label>
                  <textarea rows={2} maxLength={1000} value={volForm.animalExperience} onChange={(e) => setVolForm({ ...volForm, animalExperience: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">¿Por qué deseas ser voluntario?</label>
                  <textarea rows={3} maxLength={1500} value={volForm.motivation} onChange={(e) => setVolForm({ ...volForm, motivation: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" /></div>
                <label className="flex items-start gap-2 text-xs text-slate-700"><input required type="checkbox" className="mt-0.5" checked={volForm.acceptsSafetyRules} onChange={(e) => setVolForm({ ...volForm, acceptsSafetyRules: e.target.checked })} />Acepto respetar las normas de seguridad y convivencia del refugio. *</label>
                <label className="flex items-start gap-2 text-xs text-slate-700"><input required type="checkbox" className="mt-0.5" checked={volForm.authorizesDataUse} onChange={(e) => setVolForm({ ...volForm, authorizesDataUse: e.target.checked })} />Autorizo al refugio a utilizar mis datos para evaluar esta solicitud y contactarme. *</label>
                {volError && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{volError}</p>}
                <button type="submit" disabled={volLoading || volForm.availableDays.length === 0 || volForm.interestAreas.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                  <Send className="w-4 h-4" />{volLoading ? "Enviando..." : "Enviar solicitud de voluntariado"}
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-500">Tu solicitud será revisada antes de confirmar tu participación.</p>
            )}
          </div>
        </div>
      </section>

      {/* 5. REPORTE DE CASOS EN RIESGO */}
      <section id="reportar-caso" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-rose-50 rounded-3xl p-6 sm:p-10 border border-rose-200 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Reportar Caso de Perrito en Riesgo
              </h2>
              <p className="text-xs text-slate-600">
                Notifica a nuestro equipo sobre perritos abandonados, heridos o en peligro en Amatitlán.
              </p>
            </div>
          </div>

          {caseSubmitted ? (
            <div className="bg-white border border-rose-200 p-6 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-lg text-slate-800">¡Reporte Enviado!</h4>
              <p className="text-xs text-slate-600">
                Nuestro equipo de rescate verificará el caso y la dirección proporcionada a la brevedad posible.
              </p>
              <button
                onClick={() => setCaseSubmitted(false)}
                className="mt-4 text-xs font-bold text-rose-700 underline"
              >
                Enviar otro reporte
              </button>
            </div>
          ) : (
            <form onSubmit={handleCaseSubmit} className="space-y-4 bg-white p-6 rounded-2xl border border-rose-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tu Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={caseForm.reporterName}
                    onChange={(e) => setCaseForm({ ...caseForm, reporterName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 4433-2211"
                    value={caseForm.reporterPhone}
                    onChange={(e) => setCaseForm({ ...caseForm, reporterPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ubicación / Dirección Exacta en Amatitlán</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Barrio El Rosario, frente a la tienda La Bendición"
                  value={caseForm.locationAddress}
                  onChange={(e) => setCaseForm({ ...caseForm, locationAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descripción del Caso y Estado del Perrito</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe la condición (ej. herido, cachorro sin mamá, desnutrido)..."
                    value={caseForm.description}
                    onChange={(e) => setCaseForm({ ...caseForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nivel de Urgencia</label>
                  <select
                    value={caseForm.urgencyLevel}
                    onChange={(e) => setCaseForm({ ...caseForm, urgencyLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                  >
                    <option value="Baja">Baja (Abandono habitual)</option>
                    <option value="Media">Media (Desnutrido / Enfermo)</option>
                    <option value="Alta">Alta (Herido / Atropellado)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Reporte a Rescate DOG Rescue</span>
              </button>
            </form>
          )}
        </div>
      </section>
      <RefugeMap />
    </div>
  );
}
