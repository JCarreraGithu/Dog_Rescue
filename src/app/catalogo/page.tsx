"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  HelpCircle,
  Phone,
  Home,
  Check,
  Scale,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";
import { DEFAULT_DOGS, type DemoDog } from "@/data/default-dogs";
import { SITE } from "@/config/site";

const FIVE_FREEDOMS = [
  {
    number: "1",
    title: "Libre de hambre, sed y desnutrición",
    detail: "Acceso permanente a agua limpia y fresca, y alimento balanceado acorde a su edad y tamaño.",
  },
  {
    number: "2",
    title: "Libre de incomodidad física o térmica",
    detail: "Un lugar seguro y techado donde dormir, protegido del sol, frío y lluvia (nunca en azoteas ni amarrado).",
  },
  {
    number: "3",
    title: "Libre de dolor, lesiones y enfermedades",
    detail: "Vacunación anual al día, desparasitación, esterilización y atención veterinaria oportuna.",
  },
  {
    number: "4",
    title: "Libre de expresar su comportamiento natural",
    detail: "Espacio suficiente para moverse, paseos diarios con correa, juego y convivencia con su familia.",
  },
  {
    number: "5",
    title: "Libre de miedo, angustia y estrés",
    detail: "Trato digno, paciente y amoroso; libre de maltrato físico, gritos o abandono.",
  },
];

const AGE_OPTIONS = ["Todos", "Cachorro", "Joven", "Adulto", "Senior"] as const;
const SIZE_OPTIONS = ["Todos", "Pequeño", "Mediano", "Grande"] as const;
const TEMPERAMENT_OPTIONS = ["Todos", "Sociable", "Juguetón", "Tranquilo", "Cariñoso", "Protector"] as const;

function CatalogoContent() {
  const searchParams = useSearchParams();
  const initialDogId = searchParams.get("dogId");

  const [dogs, setDogs] = useState<DemoDog[]>(DEFAULT_DOGS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtros activos
  const [ageFilter, setAgeFilter] = useState<string>("Todos");
  const [sizeFilter, setSizeFilter] = useState<string>("Todos");
  const [temperamentFilter, setTemperamentFilter] = useState<string>("Todos");

  // Modal de Detalle / Postulación
  const [selectedDog, setSelectedDog] = useState<DemoDog | null>(null);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [acceptedTermsDocument, setAcceptedTermsDocument] = useState<boolean>(false);

  // Formulario de postulación
  const initialForm = {
    applicantName: "",
    applicantAge: "",
    applicantPhone: "",
    petsAllowed: "true",
    safeHome: "true",
    enoughSpace: "true",
    petAccess: "Todos",
    knowsFiveFreedoms: "true",
    commitsToWelfare: "true",
    commitsToSterilize: "true",
  };
  const [appForm, setAppForm] = useState(initialForm);
  const [appSubmitted, setAppSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Cargar perritos del backend o usar respaldo seguro
  const fetchDogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (ageFilter !== "Todos") query.set("ageCategory", ageFilter);
      if (sizeFilter !== "Todos") query.set("size", sizeFilter);
      if (temperamentFilter !== "Todos") query.set("temperament", temperamentFilter);
      query.set("status", "En Adopción");

      const res = await fetch(`/api/dogs?${query.toString()}`);
      if (!res.ok) throw new Error("Error en servidor");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setDogs(data);
        if (initialDogId && !selectedDog) {
          const found = data.find((d: DemoDog) => d.id === initialDogId);
          if (found) setSelectedDog(found);
        }
      } else {
        // Filtrado local sobre los datos por defecto si la base está vacía o filtra
        setDogs(filterLocalDogs(DEFAULT_DOGS, ageFilter, sizeFilter, temperamentFilter));
      }
    } catch {
      // Si la API falla o no hay conexión, usamos los datos locales garantizados
      setDogs(filterLocalDogs(DEFAULT_DOGS, ageFilter, sizeFilter, temperamentFilter));
    } finally {
      setLoading(false);
    }
  };

  function filterLocalDogs(list: DemoDog[], age: string, size: string, tmp: string) {
    return list.filter((d) => {
      if (age !== "Todos" && d.ageCategory !== age) return false;
      if (size !== "Todos" && d.size !== size) return false;
      if (tmp !== "Todos" && !d.temperament.toLowerCase().includes(tmp.toLowerCase())) return false;
      return true;
    });
  }

  useEffect(() => {
    fetchDogs();
  }, [ageFilter, sizeFilter, temperamentFilter]);

  // Selección automática si viene en la URL
  useEffect(() => {
    if (initialDogId && !selectedDog) {
      const found = dogs.find((d) => d.id === initialDogId) || DEFAULT_DOGS.find((d) => d.id === initialDogId);
      if (found) setSelectedDog(found);
    }
  }, [initialDogId, dogs]);

  // Filtro adicional por término de búsqueda (nombre / raza)
  const filteredDogs = useMemo(() => {
    if (!searchTerm.trim()) return dogs;
    const term = searchTerm.toLowerCase();
    return dogs.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.breed.toLowerCase().includes(term) ||
        d.temperament.toLowerCase().includes(term)
    );
  }, [dogs, searchTerm]);

  const handleAppSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDog || submitting) return;

    if (!acceptedTermsDocument) {
      setShowTermsModal(true);
      setSubmitError("Por favor lee y acepta el Documento de Términos y Compromisos de Adopción antes de enviar tu solicitud.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const ageNum = parseInt(appForm.applicantAge, 10);
      if (isNaN(ageNum) || ageNum < 18) {
        throw new Error("Debes ser mayor de 18 años para postularte.");
      }

      const payload = {
        dogId: selectedDog.id,
        applicantName: appForm.applicantName.trim(),
        applicantAge: ageNum,
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
        throw new Error(data.error || "No se pudo enviar la solicitud. Intenta de nuevo.");
      }

      setAppSubmitted(true);
      setAppForm(initialForm);
      setAcceptedTermsDocument(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setAgeFilter("Todos");
    setSizeFilter("Todos");
    setTemperamentFilter("Todos");
    setSearchTerm("");
  };

  const hasActiveFilters =
    ageFilter !== "Todos" || sizeFilter !== "Todos" || temperamentFilter !== "Todos" || searchTerm.trim() !== "";

  return (
    <div className="bg-slate-50/50 min-h-screen pb-24">
      {/* 1. HERO BANNER */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Adopción Responsable • Amatitlán, Guatemala</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Catálogo Oficial de <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-amber-300">Perritos en Adopción</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
              Cada perrito aquí cuenta con una historia de superación. Han sido rescatados, curados, esterilizados y hoy esperan un hogar amoroso y digno. Explora sus expedientes y postúlate en línea.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Fichas médicas al día
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Compromiso de esterilización
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                <Heart className="w-3.5 h-3.5 text-rose-400" /> Adopción sin costo de venta
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PANEL DE FILTROS Y BÚSQUEDA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Filtros de Búsqueda</h2>
                <p className="text-xs text-slate-500">Encuentra al compañero ideal según tus preferencias</p>
              </div>
            </div>

            {/* Buscador por texto */}
            <div className="relative sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre o raza..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/70"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filtro Edad */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Edad
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AGE_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAgeFilter(cat)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition ${
                      ageFilter === cat
                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Tamaño
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SIZE_OPTIONS.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSizeFilter(sz)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition ${
                      sizeFilter === sz
                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Temperamento
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TEMPERAMENT_OPTIONS.map((tmp) => (
                  <button
                    key={tmp}
                    type="button"
                    onClick={() => setTemperamentFilter(tmp)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition ${
                      temperamentFilter === tmp
                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {tmp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen de resultados y reset */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              Mostrando <strong className="text-slate-900 font-bold">{filteredDogs.length}</strong> {filteredDogs.length === 1 ? "perrito disponible" : "perritos disponibles"}
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sky-600 hover:text-sky-800 font-bold underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. GRID DE PERRITOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <Dog className="w-12 h-12 mx-auto text-sky-500 animate-bounce mb-3" />
            <p className="font-bold text-slate-800 text-base">Cargando catálogo...</p>
            <p className="text-xs text-slate-500 mt-1">Obteniendo los expedientes caninos del refugio</p>
          </div>
        ) : filteredDogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-xl text-slate-900">No encontramos perritos con esos filtros</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Prueba cambiando o limpiando los criterios de edad, tamaño o temperamento para ver a los demás rescatados.
            </p>
            <button
              onClick={resetFilters}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              Ver todos los perritos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDogs.map((dog) => (
              <div
                key={dog.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Fotografía con etiquetas */}
                <div className="relative h-64 bg-slate-100 overflow-hidden">
                  <img
                    src={dog.photoUrl}
                    alt={dog.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback elegante si falla la imagen
                      (e.currentTarget as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

                  {/* Badges superiores */}
                  <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5">
                    <span className="bg-slate-900/85 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-xl shadow-xs">
                      {dog.size}
                    </span>
                    {dog.isSterilized && (
                      <span className="bg-emerald-600/95 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Esterilizado
                      </span>
                    )}
                  </div>

                  {/* Badge de estado */}
                  <span className="absolute bottom-3 right-3.5 bg-sky-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-xl shadow-xs">
                    {dog.status}
                  </span>
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-sky-600 transition-colors">
                        {dog.name}
                      </h3>
                      <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-3 py-1 rounded-full shrink-0">
                        {dog.ageCategory} ({dog.ageYears} {dog.ageYears === 1 ? "año" : "años"})
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {dog.breed} • {dog.gender}
                    </p>

                    {/* Ficha rápida */}
                    <div className="mt-3.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <p>
                        <strong className="text-slate-800 font-bold">Temperamento:</strong> {dog.temperament}
                      </p>
                      <p className="line-clamp-2">
                        <strong className="text-slate-800 font-bold">Historia:</strong> {dog.rescueHistory}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDog(dog);
                        setAppSubmitted(false);
                        setSubmitError("");
                        setAcceptedTermsDocument(false);
                        setShowTermsModal(false);
                      }}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold py-3.5 rounded-2xl shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                      <span>Conocer a {dog.name} y Postular</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. MODAL DETALLE Y FORMULARIO DE ADOPCIÓN */}
      {selectedDog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-9 shadow-2xl relative space-y-6 max-h-[92vh] overflow-y-auto my-6 border border-slate-200">
            {/* Botón cerrar */}
            <button
              type="button"
              onClick={() => setSelectedDog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Encabezado del perrito */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative w-full sm:w-44 h-48 sm:h-44 rounded-2xl overflow-hidden bg-slate-100 shrink-0 shadow-md">
                <img
                  src={selectedDog.photoUrl}
                  alt={selectedDog.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-3xl font-black text-slate-900">{selectedDog.name}</h2>
                  <span className="text-xs font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                    {selectedDog.status}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-500">
                  {selectedDog.breed} • {selectedDog.gender} • Tamaño {selectedDog.size} • {selectedDog.ageCategory} ({selectedDog.ageYears} {selectedDog.ageYears === 1 ? "año" : "años"})
                </p>

                <div className="text-xs text-slate-700 space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 mt-2">
                  <p><strong className="text-slate-900">Temperamento:</strong> {selectedDog.temperament}</p>
                  <p><strong className="text-slate-900">Salud:</strong> {selectedDog.healthNotes}</p>
                  <p><strong className="text-slate-900">Historia:</strong> {selectedDog.rescueHistory}</p>
                </div>
              </div>
            </div>

            {/* Alternativa Facebook */}
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-sky-950">¿Prefieres consultarnos directo por Facebook?</p>
                <a
                  href={SITE.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs"
                >
                  Facebook <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <p className="text-xs text-sky-900/80">
                Toma una captura de la ficha de {selectedDog.name} y mándanos un mensaje por redes.
              </p>
            </div>

            {/* Formulario de Postulación */}
            <div className="border-t border-slate-200 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-600" />
                  Postulación de Adopción Responsable
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Completa tus datos iniciales para evaluar la solicitud para {selectedDog.name}.
                </p>
              </div>

              {appSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-3xl text-center space-y-3">
                  <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
                  <h4 className="font-black text-xl text-emerald-950">¡Solicitud recibida con éxito!</h4>
                  <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed max-w-md mx-auto">
                    Hemos registrado tu interés en adoptar a <strong>{selectedDog.name}</strong>. El equipo del refugio DOG rescue evaluará tu información y se comunicará a tu teléfono.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedDog(null)}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition"
                  >
                    Volver al catálogo
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAppSubmit} className="space-y-5">
                  {/* Datos del solicitante */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nombre completo *
                      </label>
                      <input
                        required
                        type="text"
                        maxLength={150}
                        placeholder="Ej. María Morales"
                        value={appForm.applicantName}
                        onChange={(e) => setAppForm({ ...appForm, applicantName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Edad (18+) *
                      </label>
                      <input
                        required
                        type="number"
                        min={18}
                        max={120}
                        placeholder="Ej. 28"
                        value={appForm.applicantAge}
                        onChange={(e) => setAppForm({ ...appForm, applicantAge: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Teléfono / WhatsApp de contacto *
                      </label>
                      <input
                        required
                        type="tel"
                        maxLength={30}
                        placeholder="Ej. 5555-1234"
                        value={appForm.applicantPhone}
                        onChange={(e) => setAppForm({ ...appForm, applicantPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Acceso y vivienda */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Condiciones de Vivienda y Acceso
                    </p>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5 font-medium">
                        ¿A qué áreas de la casa tendrá acceso {selectedDog.name}?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Todos", "Algunos"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setAppForm({ ...appForm, petAccess: opt })}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                              appForm.petAccess === opt
                                ? "bg-sky-600 text-white border-sky-600"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {opt === "Todos" ? "Toda la casa (interior y patio)" : "Áreas delimitadas"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preguntas Si/No con botones tipo Pill */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {[
                        { key: "petsAllowed", label: "¿Tienes permiso de mascotas en la vivienda?" },
                        { key: "safeHome", label: "¿La vivienda tiene muros y cerco seguro?" },
                        { key: "enoughSpace", label: "¿Cuentas con espacio adecuado para su tamaño?" },
                        { key: "commitsToWelfare", label: "¿Te comprometes con su alimento y vacunas?" },
                        { key: "commitsToSterilize", label: "¿Aceptas el compromiso de esterilización?" },
                        { key: "knowsFiveFreedoms", label: "¿Conoces las 5 Libertades del Bienestar Animal?" },
                      ].map((q) => {
                        const val = appForm[q.key as keyof typeof appForm];
                        return (
                          <div key={q.key} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-800 leading-tight">
                              {q.label}
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setAppForm({ ...appForm, [q.key]: "true" })}
                                className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                                  val === "true"
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-white text-slate-700 border-slate-200"
                                }`}
                              >
                                Sí
                              </button>
                              <button
                                type="button"
                                onClick={() => setAppForm({ ...appForm, [q.key]: "false" })}
                                className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                                  val === "false"
                                    ? "bg-rose-600 text-white border-rose-600"
                                    : "bg-white text-slate-700 border-slate-200"
                                }`}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* BLOQUE DE ACEPTACIÓN DEL DOCUMENTO DE TÉRMINOS Y COMPROMISOS */}
                    <div
                      className={`p-4 rounded-2xl border-2 transition ${
                        acceptedTermsDocument
                          ? "bg-emerald-50/80 border-emerald-400"
                          : "bg-amber-50/70 border-amber-300"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (!acceptedTermsDocument) {
                                setShowTermsModal(true);
                              } else {
                                setAcceptedTermsDocument(false);
                              }
                            }}
                            aria-label="Aceptar términos y compromisos de adopción"
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition cursor-pointer ${
                              acceptedTermsDocument
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-white border-slate-400 hover:border-sky-600"
                            }`}
                          >
                            {acceptedTermsDocument && <Check className="w-4 h-4" />}
                          </button>

                          <div>
                            <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                              {acceptedTermsDocument
                                ? "Documento de Normas y Compromisos Aceptado"
                                : "Aceptación de Términos, Leyes y Compromiso de Adopción *"}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              Declaro haber leído y aceptado todas las normas de las{" "}
                              <strong>5 Libertades del Bienestar Animal</strong>, la{" "}
                              <strong>Ley Decreto 5-2017</strong> y el{" "}
                              <strong>Acta de Compromiso de DOG rescue Guatemala</strong>.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition shrink-0 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                          <span>
                            {acceptedTermsDocument
                              ? "Ver Documento Firmado"
                              : "Leer y Aceptar Documento"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>{submitting ? "Enviando postulación..." : `Enviar Solicitud para ${selectedDog.name}`}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL DOCUMENTO OFICIAL DE TÉRMINOS, NORMAS Y COMPROMISO DE ADOPCIÓN */}
      {showTermsModal && selectedDog && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Documento de Términos y Compromisos de Adopción Responsable"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col"
          >
            {/* Cabecera Institucional del Documento */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white px-6 py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                    DOG rescue Guatemala • Documento Oficial
                  </span>
                  <h3 className="text-base sm:text-lg font-black leading-snug">
                    Acta de Términos, Normas y Compromiso de Adopción
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                aria-label="Cerrar documento"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Documento (Scrollable) */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed bg-slate-50/50">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <p className="text-xs text-slate-600">
                  Por medio del presente documento, el solicitante interesado en la adopción de{" "}
                  <strong className="text-slate-950 font-black">
                    {selectedDog.name}
                  </strong>{" "}
                  declara conocer y aceptar íntegramente las normas internacionales de bienestar animal, la legislación vigente en la República de Guatemala y las cláusulas de protección del refugio{" "}
                  <strong className="text-slate-950">DOG rescue Guatemala</strong>:
                </p>
              </div>

              {/* CLÁUSULA I: LAS 5 LIBERTADES */}
              <div className="space-y-3">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-sky-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black">
                    I
                  </span>
                  <span>Las 5 Libertades del Bienestar Animal</span>
                </h4>

                <div className="space-y-2">
                  {FIVE_FREEDOMS.map((f) => (
                    <div
                      key={f.number}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200/90 flex items-start gap-3 shadow-2xs"
                    >
                      <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {f.number}
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {f.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {f.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CLÁUSULA II: LEY DECRETO 5-2017 */}
              <div className="space-y-3">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                    II
                  </span>
                  <span>
                    Ley de Protección y Bienestar Animal (Decreto 5-2017 de Guatemala)
                  </span>
                </h4>

                <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-2 text-xs text-slate-700">
                  <p className="font-bold text-slate-900">
                    De conformidad con el Decreto 5-2017 del Congreso de la República de Guatemala, todo responsable o tutor tiene prohibido:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>
                      Mantener a la mascota <strong>amarrada, encadenada</strong> o en espacios reducidos que impidan su movilidad natural.
                    </li>
                    <li>
                      Dejar al ejemplar en <strong>azoteas, terrazas, balcones o patios sin techo</strong> expuestos a la intemperie, sol extremo, frío o lluvia.
                    </li>
                    <li>
                      Causar dolor, maltrato físico, negligencia médica, desnutrición o <strong>abandono en la vía pública</strong> (infracciones sancionadas por la ley con multas de hasta 12 salarios mínimos).
                    </li>
                  </ul>
                </div>
              </div>

              {/* CLÁUSULA III: COMPROMISOS CON EL REFUGIO */}
              <div className="space-y-3">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                    III
                  </span>
                  <span>Compromisos con DOG rescue Guatemala</span>
                </h4>

                <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-2 text-xs text-slate-700">
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>
                      <strong>Esterilización y Salud:</strong> Cumplir puntualmente con el compromiso de esterilización, vacunación anual y desparasitación.
                    </li>
                    <li>
                      <strong>Seguimiento Post-Adopción:</strong> Permitir la comunicación de seguimiento con el refugio (envío periódico de fotografías/videos o visita acordada) para verificar el bienestar de {selectedDog.name}.
                    </li>
                    <li>
                      <strong>Prohibición de Abandono o Cesión a Terceros:</strong> El adoptado no podrá ser regalado, vendido ni abandonado bajo ninguna circunstancia. En caso de fuerza mayor comprobada, el adoptante se compromete a notificar inmediatamente a DOG rescue Guatemala.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pie del Documento con Botón de Aceptar Todo */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cerrar sin aceptar
              </button>

              <button
                type="button"
                onClick={() => {
                  setAcceptedTermsDocument(true);
                  setAppForm({
                    ...appForm,
                    knowsFiveFreedoms: "true",
                    commitsToWelfare: "true",
                    commitsToSterilize: "true",
                  });
                  setSubmitError("");
                  setShowTermsModal(false);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/25 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aceptar Todas las Normas y Compromisos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-slate-500">Cargando catálogo...</div>}>
      <CatalogoContent />
    </Suspense>
  );
}
