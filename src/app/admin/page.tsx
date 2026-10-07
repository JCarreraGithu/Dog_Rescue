"use client";

import { useEffect, useState } from "react";
import {
  Dog,
  Calendar,
  Package,
  Users,
  BarChart3,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  FileText,
  Search,
  Check,
  X,
  Edit,
  Trash2,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "dogs" | "agenda" | "applications" | "inventory" | "volunteers" | "reports"
  >("dogs");

  // Estados de datos
  const [dogs, setDogs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [caseReports, setCaseReports] = useState<any[]>([]);

  // Filtro y selecciones
  const [selectedDog, setSelectedDog] = useState<any | null>(null);
  const [showAddDogModal, setShowAddDogModal] = useState(false);
  const [showAddMedicalModal, setShowAddMedicalModal] = useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);

  // Formulario nuevo perro
  const [dogForm, setDogForm] = useState({
    name: "",
    breed: "Mestizo",
    ageCategory: "Adulto",
    ageYears: 1.5,
    gender: "Macho",
    size: "Mediano",
    temperament: "Sociable",
    rescueHistory: "",
    healthNotes: "",
    photoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800",
    isSterilized: false,
  });

  // Formulario nuevo registro médico
  const [medForm, setMedForm] = useState({
    type: "Vacuna",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    nextDueDate: "",
    vetName: "Dra. María Morales",
    status: "Completado",
  });

  // Formulario nuevo inventario
  const [invForm, setInvForm] = useState({
    category: "Concentrado",
    name: "",
    quantity: 10,
    unit: "costales",
    minThreshold: 5,
  });

  // Cargar datos al montar
  const loadAllData = async () => {
    try {
      const [dogsRes, appRes, invRes, volRes, caseRes] = await Promise.all([
        fetch("/api/dogs").then((r) => r.json()),
        fetch("/api/applications").then((r) => r.json()),
        fetch("/api/inventory").then((r) => r.json()),
        fetch("/api/volunteers").then((r) => r.json()),
        fetch("/api/case-reports").then((r) => r.json()),
      ]);

      if (Array.isArray(dogsRes)) setDogs(dogsRes);
      if (Array.isArray(appRes)) setApplications(appRes);
      if (Array.isArray(invRes)) setInventory(invRes);
      if (Array.isArray(volRes)) setVolunteers(volRes);
      if (Array.isArray(caseRes)) setCaseReports(caseRes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handler crear perro
  const handleCreateDog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/dogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dogForm),
      });
      if (res.ok) {
        setShowAddDogModal(false);
        setDogForm({
          name: "",
          breed: "Mestizo",
          ageCategory: "Adulto",
          ageYears: 1.5,
          gender: "Macho",
          size: "Mediano",
          temperament: "Sociable",
          rescueHistory: "",
          healthNotes: "",
          photoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800",
          isSterilized: false,
        });
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler agregar registro médico
  const handleAddMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDog) return;
    try {
      const res = await fetch(`/api/dogs/${selectedDog.id}/medical`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medForm),
      });
      if (res.ok) {
        setShowAddMedicalModal(false);
        loadAllData();
        // Recargar perro seleccionado
        const updatedDog = await fetch(`/api/dogs/${selectedDog.id}`).then((r) => r.json());
        setSelectedDog(updatedDog);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler actualizar stock inventario
  const handleUpdateStock = async (id: string, change: number) => {
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantityChange: change }),
      });
      if (res.ok) loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handler crear item inventario
  const handleCreateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invForm),
      });
      if (res.ok) {
        setShowAddInventoryModal(false);
        setInvForm({
          category: "Concentrado",
          name: "",
          quantity: 10,
          unit: "costales",
          minThreshold: 5,
        });
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler actualizar solicitud de adopción
  const handleUpdateApplicationStatus = async (id: string, status: string, notes?: string) => {
    try {
      const res = await fetch("/api/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, evaluatorNotes: notes || "Evaluado por administrador" }),
      });
      if (res.ok) loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Detectar items de bajo stock
  const lowStockItems = inventory.filter((item) => item.quantity <= item.minThreshold);

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Header Panel */}
      <header className="bg-slate-900 text-white py-6 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Dog className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-black tracking-tight">Panel Administrativo</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Refugio DOG Rescue Guatemala • Amatitlán (9a calle 7-27)
            </p>
          </div>

          {/* Alerta rápida en header si hay bajo stock */}
          {lowStockItems.length > 0 && (
            <div className="bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>¡Atención! {lowStockItems.length} insumos en Bajo Stock</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* NAVEGACIÓN PESTAÑAS */}
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          {[
            { id: "dogs", label: "Expedientes Caninos", icon: Dog, count: dogs.length },
            { id: "agenda", label: "Agenda Médica", icon: Calendar },
            { id: "applications", label: "Gestión Adoptantes", icon: FileText, count: applications.filter(a => a.status === "Pendiente").length },
            { id: "inventory", label: "Control Inventario", icon: Package, alert: lowStockItems.length },
            { id: "volunteers", label: "Voluntarios Sabatinos", icon: Users, count: volunteers.length },
            { id: "reports", label: "Reportes Estadísticos", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-700"
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.alert !== undefined && tab.alert > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                    !
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 1. PESTAÑA EXPEDIENTES CANINOS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "dogs" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Expedientes Caninos del Albergue</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Gestiona la ficha individual, historial de rescate, fotos y registros médicos de cada perrito.
                </p>
              </div>

              <button
                onClick={() => setShowAddDogModal(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Nuevo Perrito</span>
              </button>
            </div>

            {/* Listado de Perros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dogs.map((dog) => (
                <div
                  key={dog.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
                >
                  <div className="relative h-48 bg-slate-100">
                    <img src={dog.photoUrl} alt={dog.name} className="w-full h-full object-cover" />
                    <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-lg ${
                      dog.status === "En Adopción" ? "bg-emerald-600 text-white" :
                      dog.status === "Adoptado" ? "bg-blue-600 text-white" : "bg-amber-600 text-white"
                    }`}>
                      {dog.status}
                    </span>
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-800">{dog.name}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {dog.size}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {dog.breed} • {dog.gender} • {dog.ageCategory} ({dog.ageYears} años)
                      </p>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {dog.healthNotes || "Sin notas de salud registradas."}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedDog(dog)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Ver Expediente y Salud ({dog.medicalRecords?.length || 0})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 2. PESTAÑA AGENDA MÉDICA */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "agenda" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Agenda Médica y Tratamientos Diarios</h2>
              <p className="text-xs text-slate-500 mt-1">
                Calendario de citas veterinarias, fechas de esterilización y refuerzos de vacunas.
              </p>
            </div>

            <div className="space-y-4">
              {dogs.flatMap(d => (d.medicalRecords || []).map((m: any) => ({ ...m, dogName: d.name }))).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No hay registros médicos programados.</p>
              ) : (
                dogs.flatMap(d => (d.medicalRecords || []).map((m: any) => ({ ...m, dogName: d.name }))).map((rec: any) => (
                  <div
                    key={rec.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold ${
                        rec.type === "Vacuna" ? "bg-blue-600" :
                        rec.type === "Esterilización" ? "bg-purple-600" :
                        rec.type === "Desparasitación" ? "bg-amber-600" : "bg-emerald-600"
                      }`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-sm">{rec.title}</span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {rec.dogName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{rec.description}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Atendido por: {rec.vetName} • Fecha: {new Date(rec.date).toLocaleDateString("es-GT")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        rec.status === "Completado" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. PESTAÑA GESTIÓN ADOPTANTES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "applications" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Gestión y Precalificación de Adoptantes</h2>
              <p className="text-xs text-slate-500 mt-1">
                Evalúa, aprueba o rechaza solicitudes de adopción para evitar papeleo físico.
              </p>
            </div>

            <div className="space-y-4">
              {applications.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No hay solicitudes de adopción recibidas.</p>
              ) : (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-base">{app.applicantName}</h3>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            app.status === "Pendiente" ? "bg-amber-100 text-amber-800" :
                            app.status === "Aprobado" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {app.applicantPhone} • {app.applicantEmail} • {app.applicantAddress}
                        </p>
                      </div>

                      {app.dog && (
                        <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
                          <Dog className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-emerald-900">Perrito: {app.dog.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                      <p><span className="font-bold">Vivienda:</span> {app.homeType}</p>
                      <p><span className="font-bold">Patio Cercado:</span> {app.hasYard ? "Sí" : "No"}</p>
                      <p><span className="font-bold">Otras Mascotas:</span> {app.hasOtherPets ? "Sí" : "No"}</p>
                    </div>

                    {app.evaluatorNotes && (
                      <p className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 italic">
                        Notas del Evaluador: {app.evaluatorNotes}
                      </p>
                    )}

                    {app.status === "Pendiente" && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleUpdateApplicationStatus(app.id, "Aprobado", "Solicitud aprobada tras precalificación.")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Aprobar Adopción</span>
                        </button>
                        <button
                          onClick={() => handleUpdateApplicationStatus(app.id, "Rechazado", "Solicitud descartada por requisitos incompletos.")}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4. PESTAÑA CONTROL INVENTARIO */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            {/* Banner Alerta Bajo Stock */}
            {lowStockItems.length > 0 && (
              <div className="bg-rose-600 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-lg">ALERTA DE DESABASTECIMIENTO DETECTADA</h3>
                    <p className="text-xs text-rose-100 mt-0.5">
                      {lowStockItems.map(i => `${i.name} (Quedan ${i.quantity} ${i.unit})`).join(" • ")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Campaña de Recaudación sugerida:\n"¡Nos quedan solo 2 costales de comida en el Refugio DOG Rescue Amatitlán! Necesitamos tu apoyo para comprar concentrado y medicinas. Donaciones al WhatsApp: 5555-DOGS."`)}
                  className="bg-white text-rose-700 font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-rose-50 transition shrink-0 flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Generar Campaña Redes</span>
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Control de Inventario de Insumos</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Registro de concentrado (alimento), medicamentos e insumos de limpieza para evitar desabastecimiento.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddInventoryModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Insumo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventory.map((item) => {
                  const isLow = item.quantity <= item.minThreshold;
                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border ${
                        isLow ? "bg-rose-50/50 border-rose-300" : "bg-slate-50/50 border-slate-200"
                      } space-y-3 flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                            {item.category}
                          </span>
                          {isLow && (
                            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Bajo Stock
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-base mt-2">{item.name}</h3>
                        <p className="text-3xl font-black text-slate-900 mt-1">
                          {item.quantity} <span className="text-sm font-semibold text-slate-500">{item.unit}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Mínimo sugerido: {item.minThreshold} {item.unit}</p>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                        <button
                          onClick={() => handleUpdateStock(item.id, -1)}
                          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs py-2 rounded-xl transition"
                        >
                          - 1 {item.unit}
                        </button>
                        <button
                          onClick={() => handleUpdateStock(item.id, 1)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition"
                        >
                          + 1 {item.unit}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 5. PESTAÑA VOLUNTARIOS SABATINOS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "volunteers" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Base de Datos de Voluntarios Sabatinos</h2>
              <p className="text-xs text-slate-500 mt-1">
                Inscritos para las jornadas del fin de semana en el albergue de Amatitlán.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Contacto</th>
                    <th className="p-3">Fecha Jornada</th>
                    <th className="p-3">Tarea Asignada</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {volunteers.map((vol) => (
                    <tr key={vol.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{vol.name}</td>
                      <td className="p-3">
                        <p>{vol.phone}</p>
                        <p className="text-slate-400">{vol.email}</p>
                      </td>
                      <td className="p-3 font-semibold text-emerald-700">{vol.saturdayDate}</td>
                      <td className="p-3 font-medium bg-slate-50 rounded-lg">{vol.assignedTask}</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-md text-[11px]">
                          {vol.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 6. PESTAÑA REPORTES ESTADÍSTICOS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Generador de Reportes Estadísticos Internos</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Métricas clave sobre gastos veterinarios, consumo de alimento y tasa de adopciones en Amatitlán.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-700 uppercase">Tasa de Adopción</p>
                  <p className="text-3xl font-black text-emerald-900 mt-1">79.3%</p>
                  <p className="text-xs text-emerald-700 mt-1">146 de 184 perros rescatados han sido adoptados con éxito</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl">
                  <p className="text-xs font-bold text-amber-700 uppercase">Consumo Estimado de Alimento</p>
                  <p className="text-3xl font-black text-amber-900 mt-1">18 Costales / mes</p>
                  <p className="text-xs text-amber-700 mt-1">Consumo promedio diario: 15 kg de concentrado</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-5 rounded-2xl">
                  <p className="text-xs font-bold text-purple-700 uppercase">Gasto Veterinario Promedio</p>
                  <p className="text-3xl font-black text-purple-900 mt-1">Q4,200.00 / mes</p>
                  <p className="text-xs text-purple-700 mt-1">Incluye esterilizaciones, vacunas y emergencias</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FICHA IMPRIMIBLE EXPEDIENTE CANINO */}
      {selectedDog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedDog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div id="printable-ficha" className="space-y-6">
              {/* Header Ficha */}
              <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Expediente Canino #{selectedDog.id.slice(0, 8)}</h2>
                  <p className="text-xs text-slate-500 font-medium">Refugio DOG Rescue Guatemala • Amatitlán</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:bg-slate-800"
                >
                  <Printer className="w-4 h-4" /> Imprimir Ficha
                </button>
              </div>

              {/* Info perro */}
              <div className="flex flex-col sm:flex-row gap-6">
                <img
                  src={selectedDog.photoUrl}
                  alt={selectedDog.name}
                  className="w-36 h-36 object-cover rounded-2xl border border-slate-200"
                />
                <div className="space-y-1 text-xs text-slate-700">
                  <h3 className="text-2xl font-black text-slate-900">{selectedDog.name}</h3>
                  <p><span className="font-bold">Raza:</span> {selectedDog.breed}</p>
                  <p><span className="font-bold">Edad:</span> {selectedDog.ageCategory} ({selectedDog.ageYears} años)</p>
                  <p><span className="font-bold">Sexo / Tamaño:</span> {selectedDog.gender} • {selectedDog.size}</p>
                  <p><span className="font-bold">Esterilizado:</span> {selectedDog.isSterilized ? "Sí" : "No"}</p>
                  <p><span className="font-bold">Estado:</span> {selectedDog.status}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 border border-slate-200">
                <p><span className="font-bold text-slate-900">Historia de Rescate:</span> {selectedDog.rescueHistory}</p>
                <p><span className="font-bold text-slate-900">Notas de Salud:</span> {selectedDog.healthNotes}</p>
              </div>

              {/* Historial Médico */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-extrabold text-slate-900 text-sm">Historial de Tratamientos y Vacunas</h4>
                  <button
                    onClick={() => setShowAddMedicalModal(true)}
                    className="text-xs text-emerald-700 font-bold hover:underline"
                  >
                    + Agregar Tratamiento
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedDog.medicalRecords?.map((m: any) => (
                    <div key={m.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>[{m.type}] {m.title}</span>
                        <span className="text-slate-500">{new Date(m.date).toLocaleDateString("es-GT")}</span>
                      </div>
                      <p className="text-slate-600">{m.description}</p>
                      <p className="text-[10px] text-slate-400">Veterinario: {m.vetName}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR NUEVO PERRO */}
      {showAddDogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Registrar Nuevo Perrito al Albergue</h3>
            <form onSubmit={handleCreateDog} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={dogForm.name}
                  onChange={(e) => setDogForm({ ...dogForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Edad Categoría</label>
                  <select
                    value={dogForm.ageCategory}
                    onChange={(e) => setDogForm({ ...dogForm, ageCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Cachorro">Cachorro</option>
                    <option value="Adulto">Adulto</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tamaño</label>
                  <select
                    value={dogForm.size}
                    onChange={(e) => setDogForm({ ...dogForm, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Pequeño">Pequeño</option>
                    <option value="Mediano">Mediano</option>
                    <option value="Grande">Grande</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Historia de Rescate</label>
                <textarea
                  rows={2}
                  value={dogForm.rescueHistory}
                  onChange={(e) => setDogForm({ ...dogForm, rescueHistory: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDogModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  Guardar Perrito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR CONSUMO/INVENTARIO */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Agregar Insumo a Inventario</h3>
            <form onSubmit={handleCreateInventory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Insumo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Concentrado Cachorro 15kg"
                  value={invForm.name}
                  onChange={(e) => setInvForm({ ...invForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={invForm.category}
                    onChange={(e) => setInvForm({ ...invForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Concentrado">Concentrado</option>
                    <option value="Medicamento">Medicamento</option>
                    <option value="Insumo de Limpieza">Insumo de Limpieza</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cantidad Inicial</label>
                  <input
                    type="number"
                    value={invForm.quantity}
                    onChange={(e) => setInvForm({ ...invForm, quantity: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddInventoryModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  Guardar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR TRATAMIENTO MÉDICO */}
      {showAddMedicalModal && selectedDog && (
        <div className="fixed inset-0 z-55 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Agregar Registro Médico a {selectedDog.name}</h3>
            <form onSubmit={handleAddMedicalRecord} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Registro</label>
                <select
                  value={medForm.type}
                  onChange={(e) => setMedForm({ ...medForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Vacuna">Vacuna</option>
                  <option value="Desparasitación">Desparasitación</option>
                  <option value="Esterilización">Esterilización</option>
                  <option value="Consulta">Consulta</option>
                  <option value="Tratamiento">Tratamiento</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título del Tratamiento</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Vacuna Quíntuple Refuerzo Anual"
                  value={medForm.title}
                  onChange={(e) => setMedForm({ ...medForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción / Notas</label>
                <textarea
                  rows={2}
                  value={medForm.description}
                  onChange={(e) => setMedForm({ ...medForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedicalModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  Guardar en Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
