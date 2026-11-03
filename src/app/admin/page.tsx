"use client";

import { useEffect, useState } from "react";
import type { LocalDog } from "@/lib/local-records";
import type { AdoptionView, VolunteerView, InventoryView, CaseReportView, TransparencyView, AdminTab, MedicalRecordView } from "@/lib/view-types";
import type { AdminNotification } from "@/lib/notifications";
import type { LucideIcon } from "lucide-react";
type Appointment = MedicalRecordView & { dogId: string; dogName: string };
import Link from "next/link";
import {
  Dog,
  Heart,
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
  ShoppingBag,
  HeartHandshake,
  Bell,
  RotateCcw,
  Upload,
  FolderOpen,
  Sparkles,
  KeyRound,
  LogOut,
  UserCog,
  ScrollText,
} from "lucide-react";
import StoreManager from "@/components/admin/StoreManager";
import SpecialCasesManager from "@/components/admin/SpecialCasesManager";
import NotificationsCenter from "@/components/admin/NotificationsCenter";
import CaseReportsManager from "@/components/admin/CaseReportsManager";
import DogDocumentationModal, { computeDocProgress } from "@/components/admin/DogDocumentationModal";
import HeroSettingsManager from "@/components/admin/HeroSettingsManager";
import TeamManager from "@/components/admin/TeamManager";
import AuditLogViewer from "@/components/admin/AuditLogViewer";
import ChangePasswordModal from "@/components/admin/ChangePasswordModal";
import { ROLE_LABELS, Role } from "@/lib/permissions";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dogs");

  // Sesión del personal (rol, cambio de contraseña obligatorio)
  const [staffUser, setStaffUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: Role;
    mustChangePassword: boolean;
  } | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const isReadOnly = staffUser?.role === "voluntario";
  const isSuperadmin = staffUser?.role === "superadmin";

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setStaffUser(d.user ?? null))
      .catch(() => {});
  }, []);

  const handleStaffLogout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    window.location.href = data.loginPath || "/";
  };

  // Estados para contadores públicos de impacto / transparencia
  const [transparencyStats, setTransparencyStats] = useState({
    rescues_count: 510,
    adoptions_count: 260,
    sterilizations_count: 1020,
  });
  const [savingTransparency, setSavingTransparency] = useState(false);
  const [transparencySaved, setTransparencySaved] = useState(false);

  // Estados de datos
  const [dogs, setDogs] = useState<LocalDog[]>([]);
  const [deletedDogs, setDeletedDogs] = useState<LocalDog[]>([]);
  const [dogsSubView, setDogsSubView] = useState<"activos" | "documentacion" | "papelera">("activos");
  const [documentationDog, setDocumentationDog] = useState<{ id: string; name: string } | null>(null);
  const [editingFullDog, setEditingFullDog] = useState<LocalDog | null>(null);
  const [uploadingDogPhoto, setUploadingDogPhoto] = useState(false);
  const [busyDogId, setBusyDogId] = useState<string | null>(null);
  const [dogActionFeedback, setDogActionFeedback] = useState<{
    type: "deleted" | "restored" | "saved";
    dogId?: string;
    dogName: string;
    message: string;
  } | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [applications, setApplications] = useState<AdoptionView[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<AdoptionView | null>(null);
  const [downloadingApplicationId, setDownloadingApplicationId] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState("");

  const [inventory, setInventory] = useState<InventoryView[]>([]);
  const [deletingInventoryId, setDeletingInventoryId] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<VolunteerView[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerView | null>(null);
  const [volunteerError, setVolunteerError] = useState("");
  const [downloadingVolunteerId, setDownloadingVolunteerId] = useState<string | null>(null);
  const [volunteerBusy, setVolunteerBusy] = useState(false);
  const [caseReports, setCaseReports] = useState<CaseReportView[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationError, setNotificationError] = useState("");

  // Filtro y selecciones
  const [selectedDog, setSelectedDog] = useState<LocalDog | null>(null);
  // Estados para editar el expediente canino
const [isEditingDog, setIsEditingDog] = useState(false);
const [isSavingDog, setIsSavingDog] = useState(false);
const [dogEditError, setDogEditError] = useState("");

const [dogEditForm, setDogEditForm] = useState({
  name: "",
  breed: "Mestizo",
  ageCategory: "Adulto",
  ageYears: 1.5,
  gender: "Macho",
  size: "Mediano",
  temperament: "Sociable",
  status: "En Adopción",
  photoUrl: "",
  isSterilized: false,
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
    (dog.medicalRecords || []).map((record) => ({
      ...record,
      dogName: dog.name,
      dogId: dog.id,
    }))
  );
  const visibleAppointments = allAppointments
    .filter((record) =>
      agendaView === "pendientes"
        ? record.status === "Programado" || record.status === "Pendiente"
        : agendaView === "historial"
        ? record.status === "Completado"
        : record.status === "Cancelado"
    )
    .sort((a, b) =>
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

  const openEditAppointment = (record: Appointment) => {
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
      const [dogsRes, deletedDogsRes, appRes, invRes, volRes, caseRes, transRes, notifRes] = await Promise.all([
        fetch("/api/dogs", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/dogs?deletedOnly=true", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/applications").then((r) => r.json()).catch(() => null),
        fetch("/api/inventory").then((r) => r.json()).catch(() => null),
        fetch("/api/volunteers").then((r) => r.json()).catch(() => null),
        fetch("/api/case-reports").then((r) => r.json()).catch(() => null),
        fetch("/api/transparency").then((r) => r.json()).catch(() => null),
        fetch("/api/notifications", { cache: "no-store" }).then(async (r) => {
          if (!r.ok) throw new Error("No se pudieron cargar las notificaciones.");
          setNotificationError("");
          return r.json();
        }).catch(() => { setNotificationError("No se pudieron cargar las notificaciones. Inténtalo de nuevo."); return null; }),
      ]);

      if (Array.isArray(dogsRes)) setDogs(dogsRes);
      if (Array.isArray(deletedDogsRes)) setDeletedDogs(deletedDogsRes);
      if (Array.isArray(appRes)) setApplications(appRes);
      if (Array.isArray(invRes)) setInventory(invRes);
      if (Array.isArray(volRes)) setVolunteers(volRes);
      if (Array.isArray(caseRes)) setCaseReports(caseRes);
      if (Array.isArray(notifRes)) setNotifications(notifRes);
      if (Array.isArray(transRes)) {
        const rescues = transRes.find((s: TransparencyView) => s.key === "rescues_count")?.value;
        const adoptions = transRes.find((s: TransparencyView) => s.key === "adoptions_count")?.value;
        const sterilizations = transRes.find((s: TransparencyView) => s.key === "sterilizations_count")?.value;
        setTransparencyStats({
          rescues_count: rescues ?? 510,
          adoptions_count: adoptions ?? 260,
          sterilizations_count: sterilizations ?? 1020,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTransparency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTransparency(true);
    setTransparencySaved(false);
    try {
      const res = await fetch("/api/transparency", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transparencyStats),
      });
      if (res.ok) {
        setTransparencySaved(true);
        setTimeout(() => setTransparencySaved(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTransparency(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Subir fotografía desde dispositivo para nuevo perro o edición
  const handleDogPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "create" | "edit"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDogPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/dogs/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir la imagen.");
      if (target === "create") {
        setDogForm((prev) => ({ ...prev, photoUrl: data.url }));
      } else {
        setDogEditForm((prev) => ({ ...prev, photoUrl: data.url }));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al subir la fotografía.");
    } finally {
      setUploadingDogPhoto(false);
      e.target.value = "";
    }
  };

  // Abrir modal de edición completa de expediente canino
  const openFullDogEdit = (dog: LocalDog) => {
    setEditingFullDog(dog);
    setDogEditForm({
      name: dog.name || "",
      breed: dog.breed || "Mestizo",
      ageCategory: dog.ageCategory || "Adulto",
      ageYears: Number(dog.ageYears) || 1.5,
      gender: dog.gender || "Macho",
      size: dog.size || "Mediano",
      temperament: dog.temperament || "Sociable",
      status: dog.status || "En Adopción",
      photoUrl: dog.photoUrl || "",
      isSterilized: Boolean(dog.isSterilized),
      rescueHistory: dog.rescueHistory || "",
      healthNotes: dog.healthNotes || "",
    });
    setDogEditError("");
  };

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

  // Guardar cambios del expediente canino (tanto desde edición rápida como edición completa)
  const handleSaveDogEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetDog = editingFullDog || selectedDog;
    if (!targetDog || isSavingDog) return;

    setIsSavingDog(true);
    setDogEditError("");

    try {
      const res = await fetch(`/api/dogs/${targetDog.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dogEditForm),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || "No se pudieron guardar los cambios"
        );
      }

      const updatedDog = await res.json();

      if (selectedDog?.id === updatedDog.id) {
        setSelectedDog((previous) => ({
          ...previous,
          ...updatedDog,
        }));
      }

      setDogs((previous) =>
        previous.map((dog) =>
          dog.id === updatedDog.id ? { ...dog, ...updatedDog } : dog
        )
      );

      setIsEditingDog(false);
      setEditingFullDog(null);
      setDogActionFeedback({
        type: "saved",
        dogId: updatedDog.id,
        dogName: updatedDog.name,
        message: `Los cambios del expediente de "${updatedDog.name}" se guardaron correctamente.`,
      });
      await loadAllData();
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

  // Mover perrito a la Papelera de Expedientes (sin bloquear con window.confirm)
  const handleDeleteDog = async (id: string, name: string) => {
    if (busyDogId) return;
    setBusyDogId(id);

    try {
      const res = await fetch(`/api/dogs/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || "No se pudo mover el expediente a la papelera"
        );
      }

      if (selectedDog?.id === id) {
        setSelectedDog(null);
      }
      if (editingFullDog?.id === id) {
        setEditingFullDog(null);
      }

      // Actualizar estado inmediato y recargar desde servidor
      const movedDog = dogs.find((d) => d.id === id);
      setDogs((prev) => prev.filter((d) => d.id !== id));
      if (movedDog) {
        setDeletedDogs((prev) => [
          { ...movedDog, isDeleted: true, deletedAt: new Date().toISOString() },
          ...prev.filter((d) => d.id !== id),
        ]);
      }

      setDogActionFeedback({
        type: "deleted",
        dogId: id,
        dogName: name,
        message: `"${name}" fue enviado a la Papelera de Expedientes.`,
      });

      await loadAllData();
    } catch (error) {
      console.error("Error al eliminar perrito:", error);
      setDogActionFeedback({
        type: "deleted",
        dogName: name,
        message:
          error instanceof Error
            ? error.message
            : "Ocurrió un error al mover el perrito a la papelera",
      });
    } finally {
      setBusyDogId(null);
    }
  };

  // Restablecer expediente desde la Papelera
  const handleRestoreDog = async (id: string, name: string) => {
    if (busyDogId) return;
    setBusyDogId(id);
    try {
      const res = await fetch(`/api/dogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", isDeleted: false }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo restablecer el expediente");
      }

      setDeletedDogs((prev) => prev.filter((d) => d.id !== id));
      setDogActionFeedback({
        type: "restored",
        dogId: id,
        dogName: name,
        message: `¡El expediente de "${name}" fue restablecido a los Expedientes Activos!`,
      });

      await loadAllData();
    } catch (error) {
      setDogActionFeedback({
        type: "restored",
        dogName: name,
        message:
          error instanceof Error
            ? error.message
            : "Error al restablecer el expediente",
      });
    } finally {
      setBusyDogId(null);
    }
  };

  // Eliminar definitivamente de la Papelera (confirmado mediante modal React)
  const executePermanentDeleteDog = async () => {
    if (!confirmPermanentDelete || busyDogId) return;
    const { id, name } = confirmPermanentDelete;
    setBusyDogId(id);

    try {
      const res = await fetch(`/api/dogs/${id}?permanent=true`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo eliminar definitivamente");
      }

      if (selectedDog?.id === id) {
        setSelectedDog(null);
      }

      setDeletedDogs((prev) => prev.filter((d) => d.id !== id));
      setConfirmPermanentDelete(null);
      setDogActionFeedback({
        type: "deleted",
        dogName: name,
        message: `El expediente de "${name}" fue eliminado definitivamente de la Papelera.`,
      });

      await loadAllData();
    } catch (error) {
      setConfirmPermanentDelete(null);
      setDogActionFeedback({
        type: "deleted",
        dogName: name,
        message:
          error instanceof Error
            ? error.message
            : "Error al eliminar definitivamente el expediente",
      });
    } finally {
      setBusyDogId(null);
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
      setSelectedApplication((previous) => previous?.id === id ? { ...previous, ...result } : previous);
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
      setSelectedVolunteer((previous) => previous?.id === id ? { ...previous, ...result } : previous);
      await loadAllData();
    } catch (error) {
      setVolunteerError(error instanceof Error ? error.message : "Error al evaluar solicitud.");
    } finally {
      setVolunteerBusy(false);
    }
  };

  // Detectar items de bajo stock y notificaciones sin leer
  const lowStockItems = inventory.filter((item) => item.quantity <= item.minThreshold);
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

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

          <div className="flex flex-wrap items-center gap-3">
            {staffUser && (
              <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs">
                <div className="leading-tight">
                  <p className="font-bold text-white">{staffUser.name}</p>
                  <p className="text-[10px] text-emerald-300">{ROLE_LABELS[staffUser.role]}</p>
                </div>
                <button type="button" onClick={() => setShowChangePassword(true)} title="Cambiar mi contraseña"
                  className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer">
                  <KeyRound className="w-4 h-4" />
                </button>
                <button type="button" onClick={handleStaffLogout} title="Cerrar sesión"
                  className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* Botón de Notificaciones en Header */}
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className="relative bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Notificaciones</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-black">
                  {unreadNotificationsCount} nuevas
                </span>
              )}
            </button>

            {/* Alerta rápida en header si hay bajo stock */}
            {lowStockItems.length > 0 && (
              <div className="bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>¡Atención! {lowStockItems.length} insumos en Bajo Stock</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {isReadOnly && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-xl px-4 py-3">
            Tu rol es de solo lectura: puedes consultar la información, pero no modificarla.
          </div>
        )}

        {/* NAVEGACIÓN PESTAÑAS */}
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          {[
            { id: "notifications", label: "Notificaciones", icon: Bell, count: unreadNotificationsCount, alert: unreadNotificationsCount },
            { id: "dogs", label: "Expedientes Caninos", icon: Dog, count: dogs.length },
            { id: "dogs-trash", label: "Papelera", icon: Trash2, count: deletedDogs.length },
            { id: "case-reports", label: "Reportes de Riesgo", icon: AlertTriangle, count: caseReports.filter(r => r.status !== "Caso Cerrado").length, alert: caseReports.filter(r => r.status === "Recibido" && r.urgency === "Alta (Emergencia)").length },
            { id: "agenda", label: "Agenda Médica", icon: Calendar },
            { id: "applications", label: "Gestión Adoptantes", icon: FileText, count: applications.filter(a => ["Pendiente", "En Evaluación"].includes(a.status)).length },
            { id: "inventory", label: "Control Inventario", icon: Package, alert: lowStockItems.length },
            { id: "volunteers", label: "Gestión Voluntarios", icon: Users, count: volunteers.filter(v => v.status === "En Evaluación").length },
            { id: "store", label: "Gestión Tienda", icon: ShoppingBag },
            { id: "hero-settings", label: "Lema e Inicio", icon: Sparkles },
            { id: "special-cases", label: "Conócenos y Casos", icon: HeartHandshake },
            { id: "transparency", label: "Cifras de Impacto", icon: ShieldCheck },
            { id: "reports", label: "Reportes Estadísticos", icon: BarChart3 },
            ...(isSuperadmin
              ? [
                  { id: "team", label: "Equipo y Accesos", icon: UserCog },
                  { id: "audit", label: "Bitácora", icon: ScrollText },
                ]
              : []),
          ].map((tab: { id: string; label: string; icon: LucideIcon; count?: number; alert?: number }) => {
            const Icon = tab.icon;
            const isActive =
              tab.id === "dogs"
                ? activeTab === "dogs" && dogsSubView === "activos"
                : tab.id === "dogs-trash"
                ? activeTab === "dogs" && dogsSubView === "papelera"
                : activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === "dogs") {
                    setActiveTab("dogs");
                    setDogsSubView("activos");
                  } else if (tab.id === "dogs-trash") {
                    setActiveTab("dogs");
                    setDogsSubView("papelera");
                  } else {
                    setActiveTab(tab.id as AdminTab);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
                  isActive
                    ? tab.id === "dogs-trash"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? tab.id === "dogs-trash"
                        ? "bg-rose-800 text-rose-100"
                        : "bg-emerald-800 text-emerald-100"
                      : "bg-slate-200 text-slate-700"
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
        {/* 0. PESTAÑA CENTRO DE NOTIFICACIONES Y ACTIVIDAD */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "notifications" && (
          <NotificationsCenter
            loadError={notificationError}
            notifications={notifications}
            onRefresh={loadAllData}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* 1. PESTAÑA EXPEDIENTES CANINOS (ACTIVOS + PAPELERA) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "dogs" && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Expedientes Caninos del Albergue</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Gestiona la ficha individual, edita datos, sube fotos, consulta registros médicos o restablece perritos desde la papelera.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Selector Activos vs Archivo Documental vs Papelera */}
                <div className="inline-flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                  <button
                    type="button"
                    onClick={() => setDogsSubView("activos")}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      dogsSubView === "activos"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Dog className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Activos</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      {dogs.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDogsSubView("documentacion")}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      dogsSubView === "documentacion"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span>Archivo Documental (3 Etapas)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDogsSubView("papelera")}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      dogsSubView === "papelera"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Papelera</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        dogsSubView === "papelera"
                          ? "bg-rose-800 text-rose-100"
                          : deletedDogs.length > 0
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {deletedDogs.length}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddDogModal(true)}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Nuevo Perrito</span>
                </button>
              </div>
            </div>

            {/* Banner de confirmación / deshacer cuando se elimina, restaura o edita un perrito */}
            {dogActionFeedback && (
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  dogActionFeedback.type === "deleted"
                    ? "bg-amber-50 border-amber-300 text-amber-950"
                    : "bg-emerald-50 border-emerald-300 text-emerald-950"
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
                  {dogActionFeedback.type === "deleted" ? (
                    <Trash2 className="w-4 h-4 text-amber-700 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span>{dogActionFeedback.message}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {dogActionFeedback.type === "deleted" && dogActionFeedback.dogId && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleRestoreDog(
                            dogActionFeedback.dogId!,
                            dogActionFeedback.dogName
                          )
                        }
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl cursor-pointer transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restablecer ahora</span>
                      </button>

                      {dogsSubView !== "papelera" && (
                        <button
                          type="button"
                          onClick={() => setDogsSubView("papelera")}
                          className="inline-flex items-center gap-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold px-3 py-1.5 rounded-xl cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Ir a la Papelera ({deletedDogs.length})</span>
                        </button>
                      )}
                    </>
                  )}

                  {dogActionFeedback.type === "restored" && dogsSubView === "papelera" && (
                    <button
                      type="button"
                      onClick={() => setDogsSubView("activos")}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl cursor-pointer transition"
                    >
                      <Dog className="w-3.5 h-3.5" />
                      <span>Ver en Expedientes Activos</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDogActionFeedback(null)}
                    className="p-1.5 rounded-lg hover:bg-black/5 text-slate-500 cursor-pointer"
                    aria-label="Cerrar aviso"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {dogsSubView === "activos" ? (
              /* VISTA 1: EXPEDIENTES ACTIVOS */
              dogs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <Dog className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-base font-extrabold text-slate-800">
                    No hay expedientes activos registrados
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Registra un nuevo perrito o revisa la Papelera si deseas restablecer un expediente eliminado anteriormente.
                  </p>
                </div>
              ) : (
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
                        {dog.isSterilized && (
                          <span className="absolute top-3 right-3 text-[10px] font-black px-2 py-1 rounded-lg bg-slate-900/75 text-emerald-300 backdrop-blur-xs">
                            Esterilizado
                          </span>
                        )}
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

                          {/* Indicador de las 3 Etapas Documentales */}
                          {(() => {
                            const prog = computeDocProgress(dog.documentation);
                            return (
                              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span className="text-slate-600">Documentación (3 Etapas)</span>
                                  <span className="text-emerald-700 font-black">{prog.percent}%</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-[10px] font-extrabold text-center">
                                  <span
                                    className={`py-1 rounded-md border ${
                                      prog.stage1
                                        ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                                        : "bg-white border-slate-200 text-slate-400"
                                    }`}
                                  >
                                    1. Ingreso {prog.stage1 ? "✔" : ""}
                                  </span>
                                  <span
                                    className={`py-1 rounded-md border ${
                                      prog.stage2
                                        ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                                        : "bg-white border-slate-200 text-slate-400"
                                    }`}
                                  >
                                    2. Rehab {prog.stage2 ? "✔" : ""}
                                  </span>
                                  <span
                                    className={`py-1 rounded-md border ${
                                      prog.stage3
                                        ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                                        : "bg-white border-slate-200 text-slate-400"
                                    }`}
                                  >
                                    3. Adopción {prog.stage3 ? "✔" : ""}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setDocumentationDog({ id: dog.id, name: dog.name })}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <FolderOpen className="w-4 h-4" />
                            <span>Documentación (Llegada · Rehab · Adopción)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedDog(dog)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-emerald-400" />
                            <span>Ver Expediente y Salud ({dog.medicalRecords?.length || 0})</span>
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => openFullDogEdit(dog)}
                              className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              disabled={busyDogId === dog.id}
                              onClick={() => handleDeleteDog(dog.id, dog.name)}
                              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{busyDogId === dog.id ? "Moviendo..." : "Eliminar"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : dogsSubView === "documentacion" ? (
              /* VISTA 2: ARCHIVO DOCUMENTAL POR CICLO DE VIDA (3 ETAPAS) */
              <div className="space-y-4">
                <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black">
                        Archivo Documental por Ciclo de Vida (Llegada ➔ Rehabilitación ➔ Adopción)
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Control centralizado de actas de rescate, certificados veterinarios, contratos de adopción Ley 5-2017 y seguimiento post-adopción.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[11px]">
                          <th className="py-3.5 px-4">Perrito</th>
                          <th className="py-3.5 px-4">1. Llegada / Ingreso</th>
                          <th className="py-3.5 px-4">2. Rehabilitación</th>
                          <th className="py-3.5 px-4">3. Adopción y Seguimiento</th>
                          <th className="py-3.5 px-4">Avance</th>
                          <th className="py-3.5 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {dogs.map((dog) => {
                          const prog = computeDocProgress(dog.documentation);
                          const doc = dog.documentation;
                          return (
                            <tr key={dog.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={dog.photoUrl}
                                    alt={dog.name}
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                                  />
                                  <div>
                                    <p className="font-black text-slate-900 text-sm">{dog.name}</p>
                                    <p className="text-[11px] text-slate-500">
                                      {dog.breed} • {dog.status}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
                                    prog.stage1
                                      ? "bg-emerald-100 text-emerald-900"
                                      : "bg-amber-50 text-amber-800"
                                  }`}
                                >
                                  {prog.stage1 ? "Acta Completa ✔" : "En Registro"}
                                </span>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  {doc?.arrival?.rescueLocation || "Amatitlán"}
                                </p>
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
                                    prog.stage2
                                      ? "bg-emerald-100 text-emerald-900"
                                      : "bg-rose-50 text-rose-800"
                                  }`}
                                >
                                  {prog.stage2 ? "Alta Médica ✔" : "En Rehabilitación"}
                                </span>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  Esterilizado: {dog.isSterilized ? "Sí ✔" : "Pendiente"}
                                </p>
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
                                    prog.stage3
                                      ? "bg-blue-100 text-blue-900"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {prog.stage3 ? "Adoptado c/ Contrato ✔" : "En Espera de Hogar"}
                                </span>
                                {doc?.adoption?.adopterName && (
                                  <p className="text-[11px] text-slate-600 font-semibold mt-1">
                                    Familia: {doc.adoption.adopterName}
                                  </p>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-emerald-600 h-full rounded-full"
                                    style={{ width: `${prog.percent}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-black text-slate-700 mt-1 inline-block">
                                  {prog.percent}%
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setDocumentationDog({ id: dog.id, name: dog.name })}
                                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl cursor-pointer transition"
                                >
                                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Abrir Carpeta Documental</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* VISTA 3: PAPELERA DE EXPEDIENTES ELIMINADOS */
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Trash2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-extrabold text-amber-950">
                        Papelera de Expedientes Caninos ({deletedDogs.length})
                      </h3>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Los perritos en la papelera están ocultos del catálogo público. Puedes restablecerlos en cualquier momento con un clic o eliminarlos definitivamente.
                      </p>
                    </div>
                  </div>
                </div>

                {deletedDogs.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                    <Trash2 className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-base font-extrabold text-slate-800">
                      La papelera está vacía
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Ningún expediente canino ha sido enviado a la papelera recientemente.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {deletedDogs.map((dog) => (
                      <div
                        key={dog.id}
                        className="bg-white rounded-2xl border-2 border-dashed border-rose-200 overflow-hidden shadow-xs flex flex-col opacity-95"
                      >
                        <div className="relative h-48 bg-slate-100">
                          <img
                            src={dog.photoUrl}
                            alt={dog.name}
                            className="w-full h-full object-cover grayscale-[35%]"
                          />
                          <span className="absolute top-3 left-3 text-xs font-black px-2.5 py-1 rounded-lg bg-rose-600 text-white">
                            En Papelera
                          </span>
                          {dog.deletedAt && (
                            <span className="absolute bottom-2 left-2 right-2 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-900/80 text-slate-200 backdrop-blur-xs">
                              Eliminado el{" "}
                              {new Date(dog.deletedAt).toLocaleString("es-GT", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          )}
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
                              {dog.rescueHistory || dog.healthNotes || "Sin notas adicionales."}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => handleRestoreDog(dog.id, dog.name)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Restablecer Expediente</span>
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedDog(dog)}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver Ficha</span>
                              </button>

                              <button
                                type="button"
                                disabled={busyDogId === dog.id}
                                onClick={() => setConfirmPermanentDelete({ id: dog.id, name: dog.name })}
                                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Borrar Final</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                  {tab.label} ({allAppointments.filter((record) =>
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
                visibleAppointments.map((rec) => (
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
        {/* 6. PESTAÑA CIFRAS DE IMPACTO / TRANSPARENCIA */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "transparency" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      Cifras de Impacto y Transparencia
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Edita los contadores oficiales que se muestran al público en la página principal.
                    </p>
                  </div>
                </div>

                <Link
                  href="/#transparencia"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-4 py-2 rounded-xl border border-sky-200 transition"
                >
                  <span>Ver en el sitio web</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {transparencySaved && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>¡Cifras de impacto actualizadas con éxito! Los cambios ya se reflejan en la página de inicio.</span>
                </div>
              )}

              <form onSubmit={handleSaveTransparency} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Rescates */}
                  <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <Dog className="w-4 h-4 text-emerald-600" />
                      <span>Perros Rescatados</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        min={0}
                        required
                        value={transparencyStats.rescues_count}
                        onChange={(e) =>
                          setTransparencyStats({
                            ...transparencyStats,
                            rescues_count: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full text-3xl font-black text-emerald-800 bg-white px-3.5 py-2.5 rounded-xl border border-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Retirados de situaciones de maltrato o peligro en Amatitlán y Guatemala.
                    </p>
                  </div>

                  {/* Adopciones */}
                  <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                      <Heart className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span>Adopciones Integradas</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        min={0}
                        required
                        value={transparencyStats.adoptions_count}
                        onChange={(e) =>
                          setTransparencyStats({
                            ...transparencyStats,
                            adoptions_count: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full text-3xl font-black text-amber-800 bg-white px-3.5 py-2.5 rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Hogares amorosos verificados con seguimiento y contrato de adopción.
                    </p>
                  </div>

                  {/* Esterilizaciones */}
                  <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Esterilizaciones</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        min={0}
                        required
                        value={transparencyStats.sterilizations_count}
                        onChange={(e) =>
                          setTransparencyStats({
                            ...transparencyStats,
                            sterilizations_count: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full text-3xl font-black text-blue-800 bg-white px-3.5 py-2.5 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Frenando la sobrepoblación y el abandono en la comunidad.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingTransparency}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold px-7 py-3 rounded-xl shadow-md transition flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{savingTransparency ? "Guardando cambios..." : "Guardar Cifras de Impacto"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 6. PESTAÑA GESTIÓN DE TIENDA SOLIDARIA */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "store" && <StoreManager />}

        {/* ------------------------------------------------------------- */}
        {/* 6A. PESTAÑA PERSONALIZACIÓN DE LEMA Y PORTADA */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "hero-settings" && <HeroSettingsManager />}

        {/* ------------------------------------------------------------- */}
        {/* 6B. PESTAÑA CASOS ESPECIALES (CONÓCENOS E INICIO) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "special-cases" && <SpecialCasesManager />}

        {/* ------------------------------------------------------------- */}
        {/* 6C. PESTAÑA REPORTES DE RIESGO CIUDADANOS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "case-reports" && <CaseReportsManager />}

        {/* PESTAÑAS DE SEGURIDAD (solo administrador total) */}
        {activeTab === "team" && isSuperadmin && staffUser && <TeamManager currentUserId={staffUser.id} />}
        {activeTab === "audit" && isSuperadmin && <AuditLogViewer />}

        {(showChangePassword || staffUser?.mustChangePassword) && (
          <ChangePasswordModal
            forced={Boolean(staffUser?.mustChangePassword)}
            onClose={() => setShowChangePassword(false)}
            onDone={() => window.location.reload()}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* 7. PESTAÑA REPORTES ESTADÍSTICOS */}
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
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div id="printable-ficha" className="space-y-6">
              {/* Header Ficha */}
              <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-3 pr-8">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-900">Expediente Canino #{selectedDog.id.slice(0, 8)}</h2>
                    {selectedDog.isDeleted && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-black">
                        En Papelera
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Refugio DOG Rescue Guatemala • Amatitlán</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedDog.isDeleted ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleRestoreDog(selectedDog.id, selectedDog.name);
                        setSelectedDog(null);
                      }}
                      className="bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:bg-emerald-700 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" /> Restablecer Expediente
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openFullDogEdit(selectedDog)}
                        className="bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:bg-emerald-700 cursor-pointer"
                      >
                        <Edit className="w-4 h-4" /> Editar Expediente
                      </button>
                      <button
                        type="button"
                        disabled={busyDogId === selectedDog.id}
                        onClick={() => handleDeleteDog(selectedDog.id, selectedDog.name)}
                        className="bg-rose-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:bg-rose-700 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar (Papelera)
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:bg-slate-800 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Imprimir Ficha
                  </button>
                </div>
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
                  <p><span className="font-bold">Temperamento:</span> {selectedDog.temperament}</p>
                  <p><span className="font-bold">Esterilizado:</span> {selectedDog.isSterilized ? "Sí" : "No"}</p>
                  <p><span className="font-bold">Estado:</span> {selectedDog.status}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-3 border border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-bold text-slate-900">
                    Información del Rescate y Salud
                  </h4>

                  {!selectedDog.isDeleted && (
                    <button
                      type="button"
                      onClick={() => openFullDogEdit(selectedDog)}
                      className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Editar información
                    </button>
                  )}
                </div>

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
              </div>

              {/* Historial Médico */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-extrabold text-slate-900 text-sm">Historial de Tratamientos y Vacunas</h4>
                  {!selectedDog.isDeleted && (
                    <button
                      onClick={() => setShowAddMedicalModal(true)}
                      className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      + Agregar Tratamiento
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {selectedDog.medicalRecords?.filter((m) => m.status === "Completado").map((m) => (
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

      {/* MODAL CONFIRMAR ELIMINACIÓN DEFINITIVA DE LA PAPELERA */}
      {confirmPermanentDelete && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  ¿Eliminar definitivamente a {confirmPermanentDelete.name}?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Esta acción borrará permanentemente el expediente de la Papelera y no se podrá deshacer.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={busyDogId !== null}
                onClick={() => setConfirmPermanentDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busyDogId !== null}
                onClick={executePermanentDeleteDog}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
              >
                {busyDogId ? "Eliminando..." : "Sí, Eliminar Definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR EXPEDIENTE CANINO COMPLETO */}
      {editingFullDog && (
        <div className="fixed inset-0 z-[75] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Editar Expediente de {editingFullDog.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Modifica cualquier dato de la ficha, estado de adopción, foto o notas médicas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingFullDog(null)}
                className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDogEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Perrito</label>
                  <input
                    type="text"
                    required
                    value={dogEditForm.name}
                    onChange={(e) => setDogEditForm({ ...dogEditForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Raza</label>
                  <input
                    type="text"
                    required
                    value={dogEditForm.breed}
                    onChange={(e) => setDogEditForm({ ...dogEditForm, breed: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Etapa Edad</label>
                  <select
                    value={dogEditForm.ageCategory}
                    onChange={(e) => setDogEditForm({ ...dogEditForm, ageCategory: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="Cachorro">Cachorro</option>
                    <option value="Joven">Joven</option>
                    <option value="Adulto">Adulto</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Edad (Años)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={dogEditForm.ageYears}
                    onChange={(e) => setDogEditForm({ ...dogEditForm, ageYears: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sexo</label>
                  <select
                    value={dogEditForm.gender}
                    onChange={(e) => setDogEditForm({ ...dogEditForm, gender: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tamaño</label>
                  <select
                    value={dogEditForm.size}
                    onChange={(e) => setDogEditForm({ ...dogEditForm, size: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="Pequeño">Pequeño</option>
                    <option value="Mediano">Mediano</option>
                    <option value="Grande">Grande</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado del Expediente</label>
                  <select
                    value={dogEditForm.status}
                    onChange={(e) => setDogEditForm({ ...dogEditForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold"
                  >
                    <option value="En Adopción">En Adopción</option>
                    <option value="En Tratamiento">En Tratamiento</option>
                    <option value="Adoptado">Adoptado</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temperamento</label>
                  <input
                    type="text"
                    value={dogEditForm.temperament}
                    onChange={(e) => setDogEditForm({ ...dogEditForm, temperament: e.target.value })}
                    placeholder="Ej. Juguetón y Cariñoso"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 w-full">
                    <input
                      type="checkbox"
                      checked={dogEditForm.isSterilized}
                      onChange={(e) => setDogEditForm({ ...dogEditForm, isSterilized: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span className="font-bold text-slate-800">¿Está Esterilizado?</span>
                  </label>
                </div>
              </div>

              {/* Fotografía (Subir archivo o URL) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="font-bold text-slate-800">Fotografía del Perrito</label>
                  <label className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{uploadingDogPhoto ? "Subiendo..." : "Subir foto desde mi equipo"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={(e) => handleDogPhotoUpload(e, "edit")}
                      disabled={uploadingDogPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  required
                  placeholder="URL de la foto o sube una imagen arriba..."
                  value={dogEditForm.photoUrl}
                  onChange={(e) => setDogEditForm({ ...dogEditForm, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
                {dogEditForm.photoUrl && (
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={dogEditForm.photoUrl}
                      alt="Vista previa"
                      className="w-20 h-20 object-cover rounded-xl border border-slate-300"
                    />
                    <span className="text-[11px] text-slate-500">
                      Vista previa actual de la fotografía del expediente.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Historia de Rescate</label>
                <textarea
                  rows={3}
                  value={dogEditForm.rescueHistory}
                  onChange={(e) => setDogEditForm({ ...dogEditForm, rescueHistory: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas de Salud y Vacunación</label>
                <textarea
                  rows={3}
                  value={dogEditForm.healthNotes}
                  onChange={(e) => setDogEditForm({ ...dogEditForm, healthNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              {dogEditError && (
                <p role="alert" className="text-rose-600 font-bold text-xs">
                  {dogEditError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  disabled={isSavingDog}
                  onClick={() => setEditingFullDog(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingDog}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSavingDog ? "Guardando..." : "Guardar Cambios del Expediente"}
                </button>
              </div>
            </form>
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
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-black text-slate-900">Registrar Nuevo Perrito al Albergue</h3>
              <button
                type="button"
                onClick={() => setShowAddDogModal(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDog} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={dogForm.name}
                    onChange={(e) => setDogForm({ ...dogForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Raza</label>
                  <input
                    type="text"
                    required
                    value={dogForm.breed}
                    onChange={(e) => setDogForm({ ...dogForm, breed: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Edad Categoría</label>
                  <select
                    value={dogForm.ageCategory}
                    onChange={(e) => setDogForm({ ...dogForm, ageCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="Cachorro">Cachorro</option>
                    <option value="Joven">Joven</option>
                    <option value="Adulto">Adulto</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Edad (Años)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={dogForm.ageYears}
                    onChange={(e) => setDogForm({ ...dogForm, ageYears: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sexo</label>
                  <select
                    value={dogForm.gender}
                    onChange={(e) => setDogForm({ ...dogForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tamaño</label>
                  <select
                    value={dogForm.size}
                    onChange={(e) => setDogForm({ ...dogForm, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="Pequeño">Pequeño</option>
                    <option value="Mediano">Mediano</option>
                    <option value="Grande">Grande</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temperamento</label>
                  <input
                    type="text"
                    value={dogForm.temperament}
                    onChange={(e) => setDogForm({ ...dogForm, temperament: e.target.value })}
                    placeholder="Ej. Juguetón y Cariñoso"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 w-full">
                    <input
                      type="checkbox"
                      checked={dogForm.isSterilized}
                      onChange={(e) => setDogForm({ ...dogForm, isSterilized: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span className="font-bold text-slate-800">¿Está Esterilizado?</span>
                  </label>
                </div>
              </div>

              {/* Fotografía (subida local o URL) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="new-dog-photo" className="block font-bold text-slate-800">
                    Fotografía del Perrito
                  </label>
                  <label className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{uploadingDogPhoto ? "Subiendo..." : "Subir foto desde mi equipo"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={(e) => handleDogPhotoUpload(e, "create")}
                      disabled={uploadingDogPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  id="new-dog-photo"
                  type="text"
                  required
                  placeholder="Sube una imagen arriba o pega una URL..."
                  value={dogForm.photoUrl}
                  onChange={(e) => setDogForm({ ...dogForm, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
                {dogForm.photoUrl.trim() && (
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={dogForm.photoUrl.trim()}
                      alt="Vista previa del nuevo perrito"
                      className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                    />
                    <span className="text-[11px] text-slate-500">Vista previa de la foto</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Historia de Rescate</label>
                <textarea
                  rows={2}
                  value={dogForm.rescueHistory}
                  onChange={(e) => setDogForm({ ...dogForm, rescueHistory: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas de Salud</label>
                <textarea
                  rows={2}
                  value={dogForm.healthNotes}
                  onChange={(e) => setDogForm({ ...dogForm, healthNotes: e.target.value })}
                  placeholder="Ej. Vacunado, desparasitado..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDogModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer"
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

      {/* MODAL DE DOCUMENTACIÓN POR CICLO DE VIDA (3 ETAPAS: LLEGADA, REHABILITACIÓN Y ADOPCIÓN) */}
      {documentationDog && (
        <DogDocumentationModal
          dogId={documentationDog.id}
          dogName={documentationDog.name}
          onClose={() => setDocumentationDog(null)}
          onSaved={loadAllData}
        />
      )}
    </div>
  );
}
