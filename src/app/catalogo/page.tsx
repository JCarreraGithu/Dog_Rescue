"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Dog,
  Heart,
  Filter,
  CheckCircle2,
  X,
  FileText,
  ShieldCheck,
  Search,
  ExternalLink,
} from "lucide-react";

function CatalogoContent() {
  const searchParams = useSearchParams();
  const initialDogId = searchParams.get("dogId");

  const [dogs, setDogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [ageFilter, setAgeFilter] = useState("Todos");
  const [sizeFilter, setSizeFilter] = useState("Todos");
  const [temperamentFilter, setTemperamentFilter] = useState("Todos");

  // Modal de Detalle / Postulación
  const [selectedDog, setSelectedDog] = useState<any | null>(null);
  const initialForm = {
    applicantName: "",
    applicantAge: "",
    applicantPhone: "",
    petsAllowed: "",
    safeHome: "",
    enoughSpace: "",
    petAccess: "",
    knowsFiveFreedoms: "",
    commitsToWelfare: "",
    commitsToSterilize: "",
  };
  const [appForm, setAppForm] = useState(initialForm);
  const [appSubmitted, setAppSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const facebookUrl = "https://www.facebook.com/people/DOG-rescue-Guatemala/100079476368990/";
  const yesNoFields = [
    { key: "petsAllowed", label: "¿Tienes permiso para tener mascotas en tu vivienda?" },
    { key: "safeHome", label: "¿Tu vivienda es segura para la mascota?" },
    { key: "enoughSpace", label: "¿Cuentas con espacio suficiente para la mascota?" },
    { key: "knowsFiveFreedoms", label: "¿Conoces las 5 libertades del bienestar animal?" },
    { key: "commitsToWelfare", label: "¿Te comprometes a cumplir las 5 libertades del bienestar animal?" },
    { key: "commitsToSterilize", label: "¿Te comprometes a esterilizar a la mascota cuando corresponda?" },
  ] as const;

  const fetchDogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (ageFilter !== "Todos") query.set("ageCategory", ageFilter);
      if (sizeFilter !== "Todos") query.set("size", sizeFilter);
      if (temperamentFilter !== "Todos") query.set("temperament", temperamentFilter);
      query.set("status", "En Adopción");

      const res = await fetch(`/api/dogs?${query.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDogs(data);
        if (initialDogId && !selectedDog) {
          const found = data.find((d) => d.id === initialDogId);
          if (found) setSelectedDog(found);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDogs();
  }, [ageFilter, sizeFilter, temperamentFilter]);

  const handleAppSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDog || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        dogId: selectedDog.id,
        applicantName: appForm.applicantName.trim(),
        applicantAge: Number(appForm.applicantAge),
        applicantPhone: appForm.applicantPhone.trim(),
        petAccess: appForm.petAccess,
        petsAllowed: appForm.petsAllowed === "true",
        safeHome: appForm.safeHome === "true",
        enoughSpace: appForm.enoughSpace === "true",
        knowsFiveFreedoms: appForm.knowsFiveFreedoms === "true",
        commitsToWelfare: appForm.commitsToWelfare === "true",
        commitsToSterilize: appForm.commitsToSterilize === "true",
      };
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo enviar la solicitud. Inténtalo de nuevo.");
      }
      setAppSubmitted(true);
      setAppForm(initialForm);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-8 shadow-xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-700/60 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full">
            <Dog className="w-4 h-4 text-emerald-400" />
            <span>Adopción Responsable 24/7</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Catálogo Digital de Adopciones
          </h1>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            Encuentra al nuevo integrante de tu familia. Utiliza los filtros instantáneos por edad, tamaño y temperamento para conocer la ficha de cada perrito rescatado en Amatitlán.
          </p>
        </div>
      </div>

      {/* Bar de Filtros */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filtros de Búsqueda Instantánea</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Filtro Edad */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Edad</label>
            <div className="flex flex-wrap gap-1.5">
              {["Todos", "Cachorro", "Adulto", "Senior"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAgeFilter(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                    ageFilter === cat
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro Tamaño */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Tamaño</label>
            <div className="flex flex-wrap gap-1.5">
              {["Todos", "Pequeño", "Mediano", "Grande"].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSizeFilter(sz)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                    sizeFilter === sz
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro Temperamento */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Temperamento</label>
            <div className="flex flex-wrap gap-1.5">
              {["Todos", "Sociable", "Tranquilo", "Activo", "Protector"].map((tmp) => (
                <button
                  key={tmp}
                  onClick={() => setTemperamentFilter(tmp)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                    temperamentFilter === tmp
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {tmp}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Perritos */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Dog className="w-10 h-10 mx-auto text-emerald-600 animate-bounce mb-2" />
          <p className="text-sm font-semibold text-slate-600">Cargando catálogo filtrado...</p>
        </div>
      ) : dogs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
          <Search className="w-10 h-10 mx-auto text-slate-400" />
          <p className="font-bold text-slate-700">No encontramos perritos con esos filtros</p>
          <p className="text-xs text-slate-500">Prueba cambiando los criterios de edad, tamaño o temperamento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dogs.map((dog) => (
            <div
              key={dog.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition flex flex-col group"
            >
              <div className="relative h-60 bg-slate-100 overflow-hidden">
                <img
                  src={dog.photoUrl}
                  alt={dog.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                    {dog.size}
                  </span>
                  {dog.isSterilized && (
                    <span className="bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Esterilizado
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-extrabold text-slate-800">{dog.name}</h3>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                      {dog.ageCategory} ({dog.ageYears} yrs)
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-700 mt-1">
                    {dog.breed} • {dog.gender}
                  </p>
                  <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <p><span className="font-bold text-slate-700">Temperamento:</span> {dog.temperament}</p>
                    <p className="line-clamp-2"><span className="font-bold text-slate-700">Historia:</span> {dog.rescueHistory}</p>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedDog(dog);
                      setAppSubmitted(false);
                      setSubmitError("");
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Conocer y Postular</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DETALLE Y FORMULARIO DE ADOPCIÓN */}
      {selectedDog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto my-8">
            <button
              onClick={() => setSelectedDog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Modal */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img
                src={selectedDog.photoUrl}
                alt={selectedDog.name}
                className="w-full sm:w-44 h-44 object-cover rounded-2xl shadow-md border border-slate-200"
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-black text-slate-900">{selectedDog.name}</h2>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                    {selectedDog.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold">
                  {selectedDog.breed} • {selectedDog.gender} • {selectedDog.size} • {selectedDog.ageCategory} ({selectedDog.ageYears} años)
                </p>

                <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p><span className="font-bold text-slate-900">Temperamento:</span> {selectedDog.temperament}</p>
                  <p><span className="font-bold text-slate-900">Salud:</span> {selectedDog.healthNotes}</p>
                  <p><span className="font-bold text-slate-900">Historia de Rescate:</span> {selectedDog.rescueHistory}</p>
                </div>
              </div>
            </div>

            {/* Consulta por Facebook: no envía datos a la plataforma */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
              <p className="text-sm font-bold text-blue-950">¿Prefieres consultarnos por Facebook?</p>
              <p className="text-sm text-blue-900">
                📸 Toma una captura de la información de {selectedDog.name} y escríbenos por Facebook.
                ¡Con gusto te atenderemos!
              </p>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition"
              >
                Consultar por Facebook <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Formulario de solicitud inicial */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Formulario de Postulación de Adopción
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Completa estos datos iniciales para solicitar la adopción de {selectedDog.name}.
                El refugio te contactará para continuar la evaluación.
              </p>
              {appSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-lg text-emerald-900">¡Solicitud enviada con éxito!</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Recibimos tu solicitud para adoptar a <strong>{selectedDog.name}</strong>.
                    El equipo del refugio revisará la información y te contactará.
                  </p>
                  <button onClick={() => setSelectedDog(null)} className="mt-4 bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl">
                    Cerrar y seguir navegando
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAppSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-3">
                      <label htmlFor="applicantName" className="block text-xs font-bold text-slate-700 mb-1">Nombre completo</label>
                      <input id="applicantName" required maxLength={150} type="text" value={appForm.applicantName}
                        onChange={(e) => setAppForm({ ...appForm, applicantName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                    <div>
                      <label htmlFor="applicantAge" className="block text-xs font-bold text-slate-700 mb-1">Edad</label>
                      <input id="applicantAge" required type="number" min={18} max={120} value={appForm.applicantAge}
                        onChange={(e) => setAppForm({ ...appForm, applicantAge: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="applicantPhone" className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                      <input id="applicantPhone" required type="tel" maxLength={30} value={appForm.applicantPhone}
                        onChange={(e) => setAppForm({ ...appForm, applicantPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {yesNoFields.slice(0, 3).map(({ key, label }) => (
                      <div key={key} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                        <label htmlFor={key} className="block text-xs font-bold text-slate-700 mb-2">{label}</label>
                        <select id={key} required value={appForm[key]}
                          onChange={(e) => setAppForm({ ...appForm, [key]: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                          <option value="">Selecciona una respuesta</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    ))}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <label htmlFor="petAccess" className="block text-xs font-bold text-slate-700 mb-2">
                        ¿A qué ambientes de la vivienda tendrá acceso la mascota?
                      </label>
                      <select id="petAccess" required value={appForm.petAccess}
                        onChange={(e) => setAppForm({ ...appForm, petAccess: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                        <option value="">Selecciona una respuesta</option>
                        <option value="Todos">Todos</option>
                        <option value="Algunos">Algunos</option>
                      </select>
                    </div>
                    {yesNoFields.slice(3).map(({ key, label }) => (
                      <div key={key} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                        <label htmlFor={key} className="block text-xs font-bold text-slate-700 mb-2">{label}</label>
                        <select id={key} required value={appForm[key]}
                          onChange={(e) => setAppForm({ ...appForm, [key]: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                          <option value="">Selecciona una respuesta</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Tus respuestas serán utilizadas por DOG Rescue Guatemala para evaluar tu solicitud y contactarte.
                    Los datos personales se compartirán únicamente con el equipo autorizado del refugio.
                  </p>
                  {submitError && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{submitError}</p>}
                  <button type="submit" disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm">
                    <Heart className="w-4 h-4" />
                    {submitting ? "Enviando solicitud..." : `Enviar solicitud de adopción para ${selectedDog.name}`}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando catálogo...</div>}>
      <CatalogoContent />
    </Suspense>
  );
}
