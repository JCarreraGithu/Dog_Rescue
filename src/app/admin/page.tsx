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
  Download,
  Eye,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "dogs" | "agenda" | "applications" | "inventory" | "volunteers" | "reports"
  >("dogs");

  // Estados de datos
  const [dogs, setDogs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [downloadingApplicationId, setDownloadingApplicationId] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState("");

  const [inventory, setInventory] = useState<any[]>([]);
  const [deletingInventoryId, setDeletingInventoryId] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any | null>(null);
  const [volunteerError, setVolunteerError] = useState("");
  const [downloadingVolunteerId, setDownloadingVolunteerId] = useState<string | null>(null);
  const [volunteerBusy, setVolunteerBusy] = useState(false);
  const [caseReports, setCaseReports] = useState<any[]>([]);

  // Filtro y selecciones
  const [selectedDog, setSelectedDog] = useState<any | null>(null);
  // Estados para editar el expediente canino
const [isEditingDog, setIsEditingDog] = useState(false);
const [isSavingDog, setIsSavingDog] = useState(false);
const [dogEditError, setDogEditError] = useState("");

const [dogEditForm, setDogEditForm] = useState({
  rescueHistory: "",
  healthNotes: "",
});
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
    photoUrl: "",
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

  // Agenda médica: formulario independiente del expediente canino
  const [agendaView, setAgendaView] = useState<"pendientes" | "historial" | "canceladas">("pendientes");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [appointmentDogId, setAppointmentDogId] = useState("");
  const [appointmentSaving, setAppointmentSaving] = useState(false);
  const [appointmentBusyId, setAppointmentBusyId] = useState<string | null>(null);
  const [appointmentError, setAppointmentError] = useState("");
  const emptyAppointment = () => ({
    type: "Consulta",
    title: "",
    description: "",
    date: "",
    vetName: "",
  });
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointment);

  const allAppointments = dogs.flatMap((dog) =>
    (dog.medicalRecords || []).map((record: any) => ({
      ...record,
      dogName: dog.name,
      dogId: dog.id,
    }))
  );
  const visibleAppointments = allAppointments
    .filter((record: any) =>
      agendaView === "pendientes"
        ? record.status === "Programado" || record.status === "Pendiente"
        : agendaView === "historial"
        ? record.status === "Completado"
        : record.status === "Cancelado"
    )
    .sort((a: any, b: any) =>
      agendaView === "pendientes"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  const openNewAppointment = () => {
    setEditingAppointmentId(null);
    setAppointmentDogId(dogs[0]?.id || "");
    setAppointmentForm(emptyAppointment());
    setAppointmentError("");
    setShowAppointmentModal(true);
  };

  const openEditAppointment = (record: any) => {
    const date = new Date(record.date);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEditingAppointmentId(record.id);
    setAppointmentDogId(record.dogId);
    setAppointmentForm({
      type: record.type,
      title: record.title,
      description: record.description || "",
      date: localDate,
      vetName: record.vetName || "",
    });
    setAppointmentError("");
    setShowAppointmentModal(true);
  };

  const saveAppointment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (appointmentSaving) return;
    setAppointmentError("");
    if (!appointmentDogId || !appointmentForm.date || !appointmentForm.title.trim()) {
      setAppointmentError("Selecciona un perrito, una fecha y un título.");
      return;
    }
    setAppointmentSaving(true);
    try {
      const url = editingAppointmentId
        ? `/api/medical-records/${editingAppointmentId}`
        : `/api/dogs/${appointmentDogId}/medical`;
      const response = await fetch(url, {
        method: editingAppointmentId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...appointmentForm,
          vetName: appointmentForm.vetName.trim() || "Dr. Veterinario Amatitlán",
          date: new Date(appointmentForm.date).toISOString(),
          status: editingAppointmentId ? undefined : "Programado",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo guardar la cita.");
      await loadAllData();
      setShowAppointmentModal(false);
    } catch (error) {
      setAppointmentError(error instanceof Error ? error.message : "Error inesperado.");
    } finally {
      setAppointmentSaving(false);
    }
  };

  const changeAppointmentStatus = async (id: string, status: "Completado" | "Cancelado") => {
    if (appointmentBusyId) return;
    const confirmed = window.confirm(
      status === "Completado"
        ? "¿Confirmas que esta atención veterinaria ya se realizó?"
        : "¿Deseas cancelar esta cita? El registro se conservará."
    );
    if (!confirmed) return;
    setAppointmentBusyId(id);
    try {
      const response = await fetch(`/api/medical-records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo actualizar la cita.");
      await loadAllData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al actualizar la cita.");
    } finally {
      setAppointmentBusyId(null);
    }
  };

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
          photoUrl: "",
          isSterilized: false,
        });
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };



  // Guardar cambios del expediente canino
  const handleSaveDogEdit = async () => {
    if (!selectedDog || isSavingDog) return;

    setIsSavingDog(true);
    setDogEditError("");

    try {
      const res = await fetch(`/api/dogs/${selectedDog.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rescueHistory: dogEditForm.rescueHistory,
          healthNotes: dogEditForm.healthNotes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || "No se pudieron guardar los cambios"
        );
      }

      const updatedDog = await res.json();

      // Actualizar el expediente que está abierto
      setSelectedDog((previous: any) => ({
        ...previous,
        rescueHistory: updatedDog.rescueHistory,
        healthNotes: updatedDog.healthNotes,
      }));

      // Actualizar también la lista de perros
      setDogs((previous) =>
        previous.map((dog) =>
          dog.id === updatedDog.id
            ? { ...dog, ...updatedDog }
            : dog
        )
      );

      setIsEditingDog(false);
    } catch (error) {
      console.error("Error al guardar expediente:", error);
      setDogEditError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar los cambios"
      );
    } finally {
      setIsSavingDog(false);
    }
  };


  // Eliminar perrito sin borrar su expediente de Neon
  const handleDeleteDog = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar a ${name}?\n\n` +
      "Desaparecerá del catálogo y de los expedientes activos, " +
      "pero su información permanecerá guardada."
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dogs/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || "No se pudo eliminar el perrito"
        );
      }

      // Quitar al perrito de la lista
      setDogs((previous) =>
        previous.filter((dog) => dog.id !== id)
      );

      // Cerrar su expediente si estaba abierto
      if (selectedDog?.id === id) {
        setSelectedDog(null);
      }

      alert(`${name} fue eliminado de los expedientes activos.`);
    } catch (error) {
      console.error("Error al eliminar perrito:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al eliminar el perrito"
      );
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

  // Eliminación definitiva del inventario (con confirmación)
  const handleDeleteInventory = async (id: string, name: string) => {
    if (deletingInventoryId) return;
    if (!window.confirm(`¿Eliminar definitivamente "${name}" del inventario?\n\nEsta acción no se puede deshacer.`)) return;
    setDeletingInventoryId(id);
    try {
      const response = await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo eliminar el producto.");
      setInventory((previous) => previous.filter((item) => item.id !== id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar el producto.");
    } finally {
      setDeletingInventoryId(null);
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

  // Actualizar la evaluación de una solicitud.
  const handleUpdateApplicationStatus = async (id: string, status: string, notes?: string) => {
    setApplicationError("");
    try {
      const res = await fetch("/api/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, evaluatorNotes: notes || "Evaluado por administrador" }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "No se pudo actualizar la solicitud.");
      setSelectedApplication((previous: any) => previous?.id === id ? { ...previous, ...result } : previous);
      await loadAllData();
    } catch (error) {
      setApplicationError(error instanceof Error ? error.message : "Error al actualizar la solicitud.");
    }
  };

  const downloadVolunteerWord = async (id: string, name: string) => {
    if (downloadingVolunteerId) return;
    setVolunteerError("");
    setDownloadingVolunteerId(id);
    try {
      const response = await fetch(`/api/volunteers/${encodeURIComponent(id)}/word`, { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "No se pudo generar el Word.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Voluntariado_${name.replace(/[^a-zA-Z0-9_-]/g, "_")}_${id.slice(0, 8)}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setVolunteerError(error instanceof Error ? error.message : "Error al descargar el Word.");
    } finally {
      setDownloadingVolunteerId(null);
    }
  };

  // Descarga privada: el documento no se guarda en la base de datos.
  const downloadAdoptionWord = async (id: string, name: string) => {
    if (downloadingApplicationId) return;
    setApplicationError("");
    setDownloadingApplicationId(id);
    try {
      const response = await fetch(`/api/applications/${encodeURIComponent(id)}/word`, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo generar el documento Word.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Adopcion_${name.replace(/[^a-zA-Z0-9_-]/g, "_")}_${id.slice(0, 8)}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setApplicationError(error instanceof Error ? error.message : "Error al descargar el Word.");
    } finally {
      setDownloadingApplicationId(null);
    }
  };

  const applicationAnswer = (value: boolean | null | undefined) =>
    value === true ? "Sí" : value === false ? "No" : "Sin respuesta";

  const handleUpdateVolunteerStatus = async (id: string, status: "Aprobado" | "Rechazado") => {
    if (volunteerBusy) return;
    setVolunteerError("");
    setVolunteerBusy(true);
    try {
      const response = await fetch("/api/volunteers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, evaluatorNotes: `Solicitud ${status.toLowerCase()} tras evaluación.` }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo actualizar la solicitud.");
      setSelectedVolunteer((previous: any) => previous?.id === id ? { ...previous, ...result } : previous);
      await loadAllData();
    } catch (error) {
      setVolunteerError(error instanceof Error ? error.message : "Error al evaluar solicitud.");
    } finally {
      setVolunteerBusy(false);
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
            { id: "applications", label: "Gestión Adoptantes", icon: FileText, count: applications.filter(a => ["Pendiente", "En Evaluación"].includes(a.status)).length },
            { id: "inventory", label: "Control Inventario", icon: Package, alert: lowStockItems.length },
            { id: "volunteers", label: "Gestión Voluntarios", icon: Users, count: volunteers.filter(v => v.status === "En Evaluación").length },
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

<button
  type="button"
  onClick={() => handleDeleteDog(dog.id, dog.name)}
  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
>
  <Trash2 className="w-4 h-4" />
  <span>Eliminar perrito</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Agenda Médica y Tratamientos</h2>
                <p className="text-xs text-slate-500 mt-1">Programa citas, registra atenciones realizadas y consulta el historial.</p>
              </div>
              <button
                type="button"
                onClick={openNewAppointment}
                disabled={dogs.length === 0}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Nueva cita
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
              {([
                { id: "pendientes", label: "Pendientes y programadas" },
                { id: "historial", label: "Historial completado" },
                { id: "canceladas", label: "Canceladas" },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAgendaView(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    agendaView === tab.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label} ({allAppointments.filter((record: any) =>
                    tab.id === "pendientes"
                      ? ["Pendiente", "Programado"].includes(record.status)
                      : tab.id === "historial"
                      ? record.status === "Completado"
                      : record.status === "Cancelado"
                  ).length})
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {visibleAppointments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No hay citas en esta sección.</p>
              ) : (
                visibleAppointments.map((rec: any) => (
                  <div key={rec.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 text-white">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-sm">{rec.title}</span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">{rec.dogName}</span>
                          <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">{rec.status}</span>
                        </div>
                        <p className="text-xs text-slate-600">{rec.type} · {rec.description}</p>
                        <p className="text-xs text-slate-500">
                          Veterinario: {rec.vetName} · {new Date(rec.date).toLocaleString("es-GT", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                    </div>
                    {agendaView === "pendientes" && (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button type="button" disabled={appointmentBusyId !== null} onClick={() => changeAppointmentStatus(rec.id, "Completado")} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50">
                          Completar
                        </button>
                        <button type="button" disabled={appointmentBusyId !== null} onClick={() => openEditAppointment(rec)} className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold disabled:opacity-50">
                          Editar
                        </button>
                        <button type="button" disabled={appointmentBusyId !== null} onClick={() => changeAppointmentStatus(rec.id, "Cancelado")} className="px-3 py-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold disabled:opacity-50">
                          Cancelar cita
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
        {/* 3. PESTAÑA GESTIÓN ADOPTANTES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "applications" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Gestión de Adoptantes</h2>
              <p className="text-xs text-slate-500 mt-1">Consulta las solicitudes, evalúa a los interesados y descarga el formulario oficial editable.</p>
            </div>
            {applicationError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">{applicationError}</p>}
            {applications.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No hay solicitudes de adopción recibidas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Solicitante</th>
                      <th className="p-3">Perrito</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{app.applicantName}</td>
                        <td className="p-3 text-slate-700">{app.dog?.name || "Perrito no disponible"}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            app.status === "Aprobado" ? "bg-emerald-100 text-emerald-800" :
                            app.status === "Rechazado" ? "bg-rose-100 text-rose-800" :
                            "bg-amber-100 text-amber-800"
                          }`}>{app.status === "Pendiente" ? "En evaluación" : app.status}</span>
                        </td>
                        <td className="p-3">
                          <button type="button" onClick={() => { setApplicationError(""); setSelectedApplication(app); }}
                            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl">
                            <Eye className="w-4 h-4" /> Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4. PESTAÑA CONTROL INVENTARIO */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
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

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3">Categoría</th>
                      <th className="px-4 py-3">Existencias</th>
                      <th className="px-4 py-3">Mínimo</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inventory.map((item) => {
                      const isLow = item.quantity <= item.minThreshold;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                          <td className="px-4 py-3 text-slate-600">{item.category}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-3 text-slate-600">{item.minThreshold} {item.unit}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${isLow ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {isLow ? "Bajo stock" : "Disponible"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" onClick={() => handleUpdateStock(item.id, -1)} disabled={deletingInventoryId !== null} className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-300 disabled:opacity-50" aria-label={`Restar una unidad de ${item.name}`}>−1</button>
                              <button type="button" onClick={() => handleUpdateStock(item.id, 1)} disabled={deletingInventoryId !== null} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50" aria-label={`Sumar una unidad a ${item.name}`}>+1</button>
                              <button type="button" onClick={() => handleDeleteInventory(item.id, item.name)} disabled={deletingInventoryId !== null} className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50" aria-label={`Eliminar ${item.name}`}>
                                <Trash2 className="h-4 w-4" /> {deletingInventoryId === item.id ? "Eliminando..." : "Eliminar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {inventory.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No hay productos registrados.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 5. PESTAÑA GESTIÓN VOLUNTARIOS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "volunteers" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Gestión de Voluntarios</h2>
              <p className="text-xs text-slate-500 mt-1">Consulta las postulaciones y evalúa a cada candidato. Los voluntarios de jornadas anteriores se conservan.</p>
            </div>
            {volunteerError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 p-3 rounded-xl">{volunteerError}</p>}
            {volunteers.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No hay voluntarios registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <tr><th className="p-3">Solicitante</th><th className="p-3">Teléfono</th><th className="p-3">Estado</th><th className="p-3">Acción</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {volunteers.map((vol) => (
                      <tr key={vol.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{vol.name}</td>
                        <td className="p-3 text-slate-700">{vol.phone}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            ["Aprobado", "Confirmado", "Asistió"].includes(vol.status) ? "bg-emerald-100 text-emerald-800" :
                            vol.status === "Rechazado" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                          }`}>{vol.status}</span>
                        </td>
                        <td className="p-3">
                          <button type="button" onClick={() => { setVolunteerError(""); setSelectedVolunteer(vol); }}
                            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl">
                            <Eye className="w-4 h-4" /> Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

      {/* MODAL DETALLE DE SOLICITUD DE VOLUNTARIADO */}
      {selectedVolunteer && (
        <div className="fixed inset-0 z-[85] bg-slate-900/60 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-label="Detalle de solicitud de voluntariado" className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Solicitud de {selectedVolunteer.name}</h2>
                <p className="text-sm text-slate-500">Estado: {selectedVolunteer.status}</p>
              </div>
              <button type="button" aria-label="Cerrar detalle" onClick={() => setSelectedVolunteer(null)} className="p-2 rounded-full bg-slate-100 text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {([
                ["Nombre completo", selectedVolunteer.name],
                ["Edad", selectedVolunteer.age == null ? "No registrada" : `${selectedVolunteer.age} años`],
                ["Teléfono / WhatsApp", selectedVolunteer.phone],
                ["Días disponibles", selectedVolunteer.availableDays?.length ? selectedVolunteer.availableDays.join(", ") : "No registrados"],
                ["Tiempo de compromiso", selectedVolunteer.commitmentDuration || "No registrado"],
                ["Áreas de interés", selectedVolunteer.interestAreas?.length ? selectedVolunteer.interestAreas.join(", ") : "No registradas"],
                ["Experiencia con animales", selectedVolunteer.animalExperience || "Sin respuesta"],
                ["Motivación", selectedVolunteer.motivation || "Sin respuesta"],
                ["Acepta reglas de seguridad", applicationAnswer(selectedVolunteer.acceptsSafetyRules)],
                ["Autoriza uso de datos", applicationAnswer(selectedVolunteer.authorizesDataUse)],
                ...(selectedVolunteer.saturdayDate ? [["Jornada anterior", selectedVolunteer.saturdayDate]] : []),
                ...(selectedVolunteer.saturdayDate ? [["Tarea asignada", selectedVolunteer.assignedTask]] : []),
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-bold text-slate-700 text-xs">{label}</p>
                  <p className="text-slate-900 mt-1 whitespace-pre-wrap break-words">{value || "Sin respuesta"}</p>
                </div>
              ))}
            </div>
            {selectedVolunteer.evaluatorNotes && <p className="text-xs bg-amber-50 p-3 rounded-xl text-amber-900">Notas del evaluador: {selectedVolunteer.evaluatorNotes}</p>}
            {volunteerError && <p role="alert" className="text-sm text-rose-700">{volunteerError}</p>}
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <button type="button" disabled={downloadingVolunteerId !== null}
                onClick={() => downloadVolunteerWord(selectedVolunteer.id, selectedVolunteer.name)}
                className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl disabled:opacity-50">
                <Download className="w-4 h-4" /> {downloadingVolunteerId === selectedVolunteer.id ? "Generando Word..." : "Descargar Word editable"}
              </button>
            </div>
            {selectedVolunteer.status === "En Evaluación" && (
              <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                <button type="button" disabled={volunteerBusy} onClick={() => handleUpdateVolunteerStatus(selectedVolunteer.id, "Aprobado")}
                  className="inline-flex items-center gap-1 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl disabled:opacity-50"><Check className="w-4 h-4" /> Aprobar</button>
                <button type="button" disabled={volunteerBusy} onClick={() => handleUpdateVolunteerStatus(selectedVolunteer.id, "Rechazado")}
                  className="inline-flex items-center gap-1 bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl disabled:opacity-50"><X className="w-4 h-4" /> Rechazar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE SOLICITUD DE ADOPCIÓN */}
      {selectedApplication && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-label="Detalle de solicitud de adopción" className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Solicitud de {selectedApplication.applicantName}</h2>
                <p className="text-sm text-slate-500">Perrito: {selectedApplication.dog?.name || "No disponible"} · Estado: {selectedApplication.status}</p>
              </div>
              <button type="button" aria-label="Cerrar detalle" onClick={() => setSelectedApplication(null)} className="p-2 rounded-full bg-slate-100 text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {([
                ["Nombre completo", selectedApplication.applicantName],
                ["Edad", selectedApplication.applicantAge == null ? "No registrada" : `${selectedApplication.applicantAge} años`],
                ["Teléfono / WhatsApp", selectedApplication.applicantPhone],
                ["Permiso para tener mascotas", applicationAnswer(selectedApplication.petsAllowed)],
                ["Vivienda segura", applicationAnswer(selectedApplication.safeHome)],
                ["Espacio suficiente", applicationAnswer(selectedApplication.enoughSpace)],
                ["Acceso a ambientes", selectedApplication.petAccess || "Sin respuesta"],
                ["Conoce las 5 libertades", applicationAnswer(selectedApplication.knowsFiveFreedoms)],
                ["Se compromete a cumplirlas", applicationAnswer(selectedApplication.commitsToWelfare)],
                ["Compromiso de esterilización", applicationAnswer(selectedApplication.commitsToSterilize)],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-bold text-slate-700 text-xs">{label}</p>
                  <p className="text-slate-900 mt-1">{value || "Sin respuesta"}</p>
                </div>
              ))}
            </div>
            {selectedApplication.evaluatorNotes && <p className="text-xs bg-amber-50 p-3 rounded-xl text-amber-900">Notas del evaluador: {selectedApplication.evaluatorNotes}</p>}
            {applicationError && <p role="alert" className="text-sm text-rose-700">{applicationError}</p>}
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <button type="button" disabled={downloadingApplicationId !== null}
                onClick={() => downloadAdoptionWord(selectedApplication.id, selectedApplication.applicantName)}
                className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl disabled:opacity-50">
                <Download className="w-4 h-4" /> {downloadingApplicationId === selectedApplication.id ? "Generando Word..." : "Descargar Word editable"}
              </button>
              {["Pendiente", "En Evaluación"].includes(selectedApplication.status) && (
                <>
                  <button type="button" onClick={() => handleUpdateApplicationStatus(selectedApplication.id, "Aprobado", "Solicitud aprobada tras evaluación.")}
                    className="inline-flex items-center gap-1 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl"><Check className="w-4 h-4" /> Aprobar</button>
                  <button type="button" onClick={() => handleUpdateApplicationStatus(selectedApplication.id, "Rechazado", "Solicitud rechazada tras evaluación.")}
                    className="inline-flex items-center gap-1 bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl"><X className="w-4 h-4" /> Rechazar</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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


<div className="bg-slate-50 p-4 rounded-xl text-xs space-y-3 border border-slate-200">

  <div className="flex items-center justify-between gap-3">
    <h4 className="font-bold text-slate-900">
      Información del Rescate y Salud
    </h4>

    {!isEditingDog && (
      <button
        type="button"
        onClick={() => {
          setDogEditForm({
            rescueHistory: selectedDog.rescueHistory || "",
            healthNotes: selectedDog.healthNotes || "",
          });
          setDogEditError("");
          setIsEditingDog(true);
        }}
        className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-emerald-700"
      >
        <Edit className="w-3.5 h-3.5" />
        Editar información
      </button>
    )}
  </div>

  {isEditingDog ? (
    <div className="space-y-3">

      <div>
        <label className="block font-bold text-slate-900 mb-1">
          Historia de Rescate
        </label>
        <textarea
          rows={4}
          value={dogEditForm.rescueHistory}
          onChange={(e) =>
            setDogEditForm((previous) => ({
              ...previous,
              rescueHistory: e.target.value,
            }))
          }
          className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-900"
        />
      </div>

      <div>
        <label className="block font-bold text-slate-900 mb-1">
          Notas de Salud
        </label>
        <textarea
          rows={4}
          value={dogEditForm.healthNotes}
          onChange={(e) =>
            setDogEditForm((previous) => ({
              ...previous,
              healthNotes: e.target.value,
            }))
          }
          className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-900"
        />
      </div>

      {dogEditError && (
        <p role="alert" className="text-red-600 font-semibold">
          {dogEditError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={isSavingDog}
          onClick={() => {
            setIsEditingDog(false);
            setDogEditError("");
          }}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={isSavingDog}
          onClick={handleSaveDogEdit}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSavingDog ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  ) : (
    <div className="space-y-2">
      <p>
        <span className="font-bold text-slate-900">
          Historia de Rescate:
        </span>{" "}
        {selectedDog.rescueHistory || "Sin información registrada"}
      </p>

      <p>
        <span className="font-bold text-slate-900">
          Notas de Salud:
        </span>{" "}
        {selectedDog.healthNotes || "Sin información registrada"}
      </p>
    </div>
  )}
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
                  {selectedDog.medicalRecords?.filter((m: any) => m.status === "Completado").map((m: any) => (
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

      {/* MODAL CREAR / EDITAR CITA VETERINARIA */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingAppointmentId ? "Editar cita veterinaria" : "Programar nueva cita"}
              </h3>
              <button type="button" onClick={() => setShowAppointmentModal(false)} className="text-slate-500 hover:text-slate-800" aria-label="Cerrar formulario">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveAppointment} className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Perrito</label>
                <select required disabled={!!editingAppointmentId} value={appointmentDogId} onChange={(e) => setAppointmentDogId(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 disabled:opacity-60">
                  <option value="">Selecciona un perrito</option>
                  {dogs.map((dog) => <option key={dog.id} value={dog.id}>{dog.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de atención</label>
                  <select value={appointmentForm.type} onChange={(e) => setAppointmentForm({ ...appointmentForm, type: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900">
                    {["Consulta", "Vacuna", "Desparasitación", "Esterilización", "Tratamiento"].map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha y hora</label>
                  <input required type="datetime-local" value={appointmentForm.date} onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título de la cita</label>
                <input required type="text" value={appointmentForm.title} onChange={(e) => setAppointmentForm({ ...appointmentForm, title: e.target.value })} placeholder="Ej. Control de vacunación" className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Veterinario</label>
                <input type="text" value={appointmentForm.vetName} onChange={(e) => setAppointmentForm({ ...appointmentForm, vetName: e.target.value })} placeholder="Nombre del veterinario" className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción / indicaciones</label>
                <textarea rows={3} value={appointmentForm.description} onChange={(e) => setAppointmentForm({ ...appointmentForm, description: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900" />
              </div>
              {appointmentError && <p role="alert" className="text-rose-700 text-xs font-semibold">{appointmentError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" disabled={appointmentSaving} onClick={() => setShowAppointmentModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold disabled:opacity-50">Cerrar</button>
                <button type="submit" disabled={appointmentSaving} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50">
                  {appointmentSaving ? "Guardando..." : editingAppointmentId ? "Guardar cambios" : "Programar cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR NUEVO PERRO */}
      {showAddDogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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

              {/* Fotografía alojada en Cloudinary */}
              <div className="space-y-2">
                <label htmlFor="new-dog-photo" className="block font-bold text-slate-700">
                  URL de la fotografía
                </label>
                <input
                  id="new-dog-photo"
                  type="url"
                  required
                  placeholder="https://res.cloudinary.com/..."
                  value={dogForm.photoUrl}
                  onChange={(e) => setDogForm({ ...dogForm, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
                <p className="text-xs text-slate-500">
                  Sube la foto a Cloudinary y pega aquí el enlace de la imagen.
                </p>
                {dogForm.photoUrl.trim() && (
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-700">Vista previa:</p>
                    <img
                      src={dogForm.photoUrl.trim()}
                      alt="Vista previa del nuevo perrito"
                      className="w-40 h-40 object-cover rounded-xl border border-slate-200"
                    />
                  </div>
                )}
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
