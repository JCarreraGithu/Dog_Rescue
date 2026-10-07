"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ImpactCarousel from "@/components/ImpactCarousel";
import {
  Dog,
  Heart,
  Shield,
  Calendar,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Users,
  ChevronRight,
  Sparkles,
  Phone,
  Send,
} from "lucide-react";

export default function HomePage() {
  // Estados para contadores de transparencia
  const [stats, setStats] = useState<any[]>([]);
  // Estados para perros destacados
  const [featuredDogs, setFeaturedDogs] = useState<any[]>([]);
  
  // Estado para el formulario de voluntariado
  const [volForm, setVolForm] = useState({
    name: "",
    email: "",
    phone: "",
    saturdayDate: "2026-09-12",
    assignedTask: "Paseo y Socialización",
  });
  const [volSubmitted, setVolSubmitted] = useState(false);

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
    try {
      const res = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(volForm),
      });
      if (res.ok) {
        setVolSubmitted(true);
        setVolForm({
          name: "",
          email: "",
          phone: "",
          saturdayDate: "2026-09-12",
          assignedTask: "Paseo y Socialización",
        });
      }
    } catch (err) {
      console.error(err);
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
              El Refugio DOG Rescue Guatemala está dedicado al rescate, rehabilitación y fomento de la adopción responsable de perros en situación de calle o maltrato en Amatitlán.
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

      {/* 4. VOLUNTARIADO SABATINO */}
      <section id="voluntariado" className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold px-3 py-1 rounded-full">
              <Calendar className="w-4 h-4" />
              <span>Jornadas Sabatinas • Amatitlán</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Únete como Voluntario los Fines de Semana
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              En las jornadas de los sábados realizamos actividades esenciales: paseo, baño, aplicación de medicina básica, desinfección de instalaciones y socialización. Tu tiempo salva vidas.
            </p>

            <div className="space-y-3 pt-2 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Horario: Sábados de 8:00 AM a 1:00 PM.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Dirección: 9a calle 7-27, Amatitlán, Guatemala.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Cupos limitados por jornada para garantizar organización.</span>
              </div>
            </div>
          </div>

          {/* Formulario Voluntariado */}
          <div className="lg:col-span-6">
            <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Registro de Voluntarios</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">Selecciona la fecha e inscribe tu cupo.</p>

              {volSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-lg">¡Inscripción Confirmada!</h4>
                  <p className="text-xs leading-relaxed">
                    Te esperamos este sábado en el albergue de Amatitlán. Nos pondremos en contacto contigo para los detalles.
                  </p>
                  <button
                    onClick={() => setVolSubmitted(false)}
                    className="mt-4 text-xs font-bold text-emerald-700 underline"
                  >
                    Inscribir a otra persona
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVolSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. María Fernanda López"
                      value={volForm.name}
                      onChange={(e) => setVolForm({ ...volForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        placeholder="tu@correo.com"
                        value={volForm.email}
                        onChange={(e) => setVolForm({ ...volForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                      <input
                        type="tel"
                        required
                        placeholder="5555-1234"
                        value={volForm.phone}
                        onChange={(e) => setVolForm({ ...volForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Jornada</label>
                      <select
                        value={volForm.saturdayDate}
                        onChange={(e) => setVolForm({ ...volForm, saturdayDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="2026-09-12">Sábado 12 de Septiembre</option>
                        <option value="2026-09-19">Sábado 19 de Septiembre</option>
                        <option value="2026-09-26">Sábado 26 de Septiembre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tarea Preferida</label>
                      <select
                        value={volForm.assignedTask}
                        onChange={(e) => setVolForm({ ...volForm, assignedTask: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="Paseo y Socialización">Paseo y Socialización</option>
                        <option value="Baño y Cepillado">Baño y Cepillado</option>
                        <option value="Limpieza de Caniles">Limpieza de Caniles</option>
                        <option value="Apoyo en Medicina">Apoyo en Medicina</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm mt-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Confirmar Reservación de Cupo</span>
                  </button>
                </form>
              )}
            </div>
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
    </div>
  );
}
