"use client";

import { useEffect, useState } from "react";
import {
  HeartHandshake,
  Plus,
  Search,
  Edit,
  Trash2,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  Star,
  Stethoscope,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { ImpactCase, SpecialCaseStatus } from "@/data/impact-cases";

const STATUS_OPTIONS: SpecialCaseStatus[] = [
  "Rehabilitado y Adoptado",
  "Caso Éxito",
  "En Rehabilitación",
  "En Adopción",
];

type CaseFormState = {
  name: string;
  title: string;
  subtitle: string;
  story: string;
  beforeText: string;
  afterText: string;
  location: string;
  date: string;
  status: SpecialCaseStatus;
  image: string;
  gallery: string[];
  featured: boolean;
  published: boolean;
};

const INITIAL_FORM: CaseFormState = {
  name: "",
  title: "",
  subtitle: "",
  story: "",
  beforeText: "",
  afterText: "",
  location: "Amatitlán, Guatemala",
  date: "",
  status: "Rehabilitado y Adoptado",
  image: "",
  gallery: [],
  featured: true,
  published: true,
};

export default function SpecialCasesManager() {
  const [cases, setCases] = useState<ImpactCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");

  const [showModal, setShowModal] = useState(false);
  const [editingCase, setEditingCase] = useState<ImpactCase | null>(null);
  const [form, setForm] = useState<CaseFormState>(INITIAL_FORM);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // Estado para la Foto Principal de la Portada de /conocenos
  const [aboutSettings, setAboutSettings] = useState({
    heroImage:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1000",
    heroBadgeText: "Amor animalista desde 2020",
    heroCaptionTitle: "DOG Rescue Guatemala",
    heroCaptionSubtitle: "Salvando vidas con amor y dignidad",
  });
  const [uploadingHeroPhoto, setUploadingHeroPhoto] = useState(false);
  const [savingHeroSettings, setSavingHeroSettings] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const loadAboutSettings = async () => {
    try {
      const res = await fetch("/api/about-settings");
      const data = await res.json();
      if (data && typeof data === "object" && data.heroImage) {
        setAboutSettings({
          heroImage: data.heroImage,
          heroBadgeText: data.heroBadgeText || "Amor animalista desde 2020",
          heroCaptionTitle: data.heroCaptionTitle || "DOG Rescue Guatemala",
          heroCaptionSubtitle:
            data.heroCaptionSubtitle || "Salvando vidas con amor y dignidad",
        });
      }
    } catch (error) {
      console.error("Error al cargar foto de Conócenos:", error);
    }
  };

  const handleHeroFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHeroPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const uploadRes = await fetch("/api/special-cases/upload", {
        method: "POST",
        body: fd,
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "No se pudo subir la foto");
      }

      const nextSettings = {
        ...aboutSettings,
        heroImage: uploadData.url,
      };
      setAboutSettings(nextSettings);

      // Guardar inmediatamente para que se refleje al instante en /conocenos
      const saveRes = await fetch("/api/about-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings),
      });
      if (saveRes.ok) {
        showToast("¡Foto principal de Conócenos subida y actualizada!");
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Error al subir la foto de Conócenos"
      );
    } finally {
      setUploadingHeroPhoto(false);
      e.target.value = "";
    }
  };

  const handleSaveHeroSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHeroSettings(true);
    try {
      const res = await fetch("/api/about-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aboutSettings),
      });
      if (res.ok) {
        showToast("Portada de Conócenos actualizada correctamente");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingHeroSettings(false);
    }
  };

  const loadCases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/special-cases?all=1");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCases(data);
      }
    } catch (error) {
      console.error("Error al cargar casos especiales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAboutSettings();
    loadCases();
  }, []);

  const openCreateModal = () => {
    setEditingCase(null);
    setForm(INITIAL_FORM);
    setNewGalleryUrl("");
    setErrorMsg("");
    setShowModal(true);
  };

  const openEditModal = (c: ImpactCase) => {
    setEditingCase(c);
    const galleryList =
      Array.isArray(c.gallery) && c.gallery.length > 0
        ? c.gallery
        : c.image
        ? [c.image]
        : [];
    setForm({
      name: c.name || "",
      title: c.title || "",
      subtitle: c.subtitle || "",
      story: c.story || "",
      beforeText: c.beforeText || "",
      afterText: c.afterText || "",
      location: c.location || "Amatitlán, Guatemala",
      date: c.date || "",
      status: (c.status as SpecialCaseStatus) || "Caso Éxito",
      image: c.image || "",
      gallery: galleryList,
      featured: c.featured !== false,
      published: c.published !== false,
    });
    setNewGalleryUrl("");
    setErrorMsg("");
    setShowModal(true);
  };

  // Subir 1 o varias imágenes desde la computadora
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    asMainPhoto: boolean
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    setErrorMsg("");

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/special-cases/upload", {
          method: "POST",
          body: fd,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          throw new Error(data.error || "Error al subir la fotografía");
        }
        uploadedUrls.push(data.url);
      }

      if (uploadedUrls.length > 0) {
        setForm((prev) => {
          const nextMain = asMainPhoto
            ? uploadedUrls[0]
            : prev.image || uploadedUrls[0];
          const combinedGallery = Array.from(
            new Set([nextMain, ...prev.gallery, ...uploadedUrls].filter(Boolean))
          );
          return {
            ...prev,
            image: nextMain,
            gallery: combinedGallery,
          };
        });
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "No se pudo subir la imagen"
      );
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleAddGalleryUrl = () => {
    const trimmed = newGalleryUrl.trim();
    if (!trimmed) return;
    setForm((prev) => {
      const nextMain = prev.image || trimmed;
      const combined = Array.from(
        new Set([nextMain, ...prev.gallery, trimmed].filter(Boolean))
      );
      return {
        ...prev,
        image: nextMain,
        gallery: combined,
      };
    });
    setNewGalleryUrl("");
  };

  const handleRemoveGalleryPhoto = (urlToRemove: string) => {
    setForm((prev) => {
      const remaining = prev.gallery.filter((u) => u !== urlToRemove);
      const nextMain =
        prev.image === urlToRemove ? remaining[0] || "" : prev.image;
      return {
        ...prev,
        image: nextMain,
        gallery: remaining,
      };
    });
  };

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    const mainImg =
      form.image.trim() ||
      form.gallery[0] ||
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000";

    const finalGallery = Array.from(
      new Set([mainImg, ...form.gallery].filter(Boolean))
    );

    const payload = {
      ...form,
      image: mainImg,
      gallery: finalGallery,
    };

    try {
      const url = editingCase
        ? `/api/special-cases/${editingCase.id}`
        : "/api/special-cases";
      const method = editingCase ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al guardar el caso especial");
      }

      await loadCases();
      setShowModal(false);
      showToast(
        editingCase
          ? `Caso "${form.name || form.title}" actualizado correctamente`
          : `Nuevo caso "${form.name || form.title}" publicado en Conócenos`
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Error inesperado al guardar"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (c: ImpactCase) => {
    try {
      const nextPub = c.published === false;
      const res = await fetch(`/api/special-cases/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: nextPub }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCases((prev) =>
          prev.map((item) => (item.id === c.id ? updated : item))
        );
        showToast(
          nextPub
            ? `Caso de ${c.name || c.title} visible en /conocenos`
            : `Caso de ${c.name || c.title} ocultado del público`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFeatured = async (c: ImpactCase) => {
    try {
      const nextFeat = c.featured === false;
      const res = await fetch(`/api/special-cases/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: nextFeat }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCases((prev) =>
          prev.map((item) => (item.id === c.id ? updated : item))
        );
        showToast(
          nextFeat
            ? `Destacado en el carrusel de Inicio`
            : `Removido del carrusel de Inicio`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCase = async (c: ImpactCase) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar el caso especial "${c.name ? `${c.name}: ` : ""}${c.title}"?\nEsta acción lo quitará de la sección Conócenos.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/special-cases/${c.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCases((prev) => prev.filter((item) => item.id !== c.id));
        showToast(`Caso eliminado correctamente`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesStatus =
      statusFilter === "Todos" ||
      (c.status || "Caso Éxito") === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (c.name || "").toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.story.toLowerCase().includes(q) ||
      (c.subtitle || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPublished = cases.filter((c) => c.published !== false).length;
  const totalFeatured = cases.filter((c) => c.featured !== false).length;
  const totalRehab = cases.filter(
    (c) => c.status === "En Rehabilitación"
  ).length;

  return (
    <div className="space-y-6">
      {/* NOTIFICACIÓN FLOTANTE */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-2.5 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SECCIÓN 1: FOTO PRINCIPAL DE LA PORTADA DE CONÓCENOS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider bg-sky-50 px-3 py-1 rounded-full mb-1.5 border border-sky-200">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Portada de Conócenos (/conocenos)</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Foto Principal de &ldquo;Nuestra Historia&rdquo;
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Esta es la fotografía principal que aparece al lado de &ldquo;Un propósito que nació del corazón&rdquo; en la pestaña Conócenos.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-sm transition shrink-0 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>
              {uploadingHeroPhoto
                ? "Subiendo foto..."
                : "Subir Foto desde mi Computadora"}
            </span>
            <input
              type="file"
              accept="image/*"
              disabled={uploadingHeroPhoto}
              onChange={handleHeroFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <form
          onSubmit={handleSaveHeroSettings}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
        >
          {/* Vista previa idéntica a como se ve en /conocenos */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md bg-slate-900 aspect-[4/3]">
              <img
                src={aboutSettings.heroImage}
                alt="Vista previa portada Conócenos"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 font-black text-[11px] px-3 py-1 rounded-xl shadow">
                {aboutSettings.heroBadgeText}
              </div>
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-white/15">
                <p className="text-[10px] uppercase tracking-wider text-sky-400 font-bold">
                  {aboutSettings.heroCaptionTitle}
                </p>
                <p className="text-xs font-semibold text-white mt-0.5">
                  {aboutSettings.heroCaptionSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Controles de URL y textos */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL o Ruta de la Foto Principal
              </label>
              <input
                type="text"
                value={aboutSettings.heroImage}
                onChange={(e) =>
                  setAboutSettings({
                    ...aboutSettings,
                    heroImage: e.target.value,
                  })
                }
                placeholder="Sube una foto con el botón azul de arriba o pega un enlace https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título sobre la foto
                </label>
                <input
                  type="text"
                  value={aboutSettings.heroCaptionTitle}
                  onChange={(e) =>
                    setAboutSettings({
                      ...aboutSettings,
                      heroCaptionTitle: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Insignia Amarilla Superior
                </label>
                <input
                  type="text"
                  value={aboutSettings.heroBadgeText}
                  onChange={(e) =>
                    setAboutSettings({
                      ...aboutSettings,
                      heroBadgeText: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Frase debajo del título en la foto
              </label>
              <input
                type="text"
                value={aboutSettings.heroCaptionSubtitle}
                onChange={(e) =>
                  setAboutSettings({
                    ...aboutSettings,
                    heroCaptionSubtitle: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={savingHeroSettings || uploadingHeroPhoto}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>
                  {savingHeroSettings
                    ? "Guardando..."
                    : "Guardar Cambios de Portada Conócenos"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* CABECERA Y KPIs DE CASOS ESPECIALES */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider bg-sky-50 px-3 py-1 rounded-full mb-2 border border-sky-200">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Módulo Conócenos • Historias de Transformación</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Administración de Casos Especiales
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Publica y edita los casos de rescate con fotografías (antes/después), diagnóstico médico e historia completa para la página Conócenos y el carrusel de Inicio.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-sm transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Caso Especial</span>
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs font-bold text-slate-500 uppercase">
              Total Registrados
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {cases.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Historias documentadas
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <p className="text-xs font-bold text-emerald-700 uppercase">
              Visibles en Conócenos
            </p>
            <p className="text-2xl font-black text-emerald-900 mt-1">
              {totalPublished}
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Casos públicos activos
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <p className="text-xs font-bold text-amber-800 uppercase">
              En Rehabilitación
            </p>
            <p className="text-2xl font-black text-amber-900 mt-1">
              {totalRehab}
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Tratamiento médico activo
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80">
            <p className="text-xs font-bold text-sky-700 uppercase">
              Carrusel de Inicio
            </p>
            <p className="text-2xl font-black text-sky-900 mt-1">
              {totalFeatured}
            </p>
            <p className="text-[11px] text-sky-700 mt-0.5">
              Casos destacados en portada
            </p>
          </div>
        </div>

        {/* FILTROS Y BUSCADOR */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            {["Todos", ...STATUS_OPTIONS].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por perrito o historia..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* LISTADO DE TARJETAS DE CASOS ESPECIALES */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 text-sm">
          Cargando casos especiales...
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <p className="text-base font-bold text-slate-800">
            No se encontraron casos especiales con ese filtro
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Crear Primer Caso Especial
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((c) => {
            const galleryPhotos =
              Array.isArray(c.gallery) && c.gallery.length > 0
                ? c.gallery
                : [c.image];
            const isPublished = c.published !== false;
            const isFeatured = c.featured !== false;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition flex flex-col ${
                  isPublished
                    ? "border-slate-200"
                    : "border-slate-300 opacity-75 bg-slate-50"
                }`}
              >
                {/* Imagen y etiquetas */}
                <div className="relative h-52 bg-slate-900">
                  <img
                    src={c.image}
                    alt={c.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/15">
                      {c.status || "Caso Éxito"}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                        isPublished
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {isPublished ? "Público" : "Oculto"}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      {c.name && (
                        <span className="inline-block bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-md">
                          🐾 {c.name}
                        </span>
                      )}
                    </div>

                    {galleryPhotos.length > 1 && (
                      <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-lg text-white text-[11px] font-bold">
                        <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                        <span>{galleryPhotos.length} fotos</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cuerpo */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                      {c.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-600" />
                          {c.location}
                        </span>
                      )}
                      {c.date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          {c.date}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {c.title}
                    </h3>

                    {c.subtitle && (
                      <p className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100">
                        {c.subtitle}
                      </p>
                    )}

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {c.story}
                    </p>

                    {/* Miniaturas de galería */}
                    {galleryPhotos.length > 1 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {galleryPhotos.slice(0, 5).map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Controles rápidos */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(c)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                          isPublished
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {isPublished ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Oculto</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(c)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                          isFeatured
                            ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            isFeatured ? "fill-amber-500 text-amber-500" : ""
                          }`}
                        />
                        <span>{isFeatured ? "En Inicio" : "Solo Conócenos"}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar Texto y Fotos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCase(c)}
                        aria-label="Eliminar caso"
                        className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR CASO ESPECIAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              editingCase ? "Editar Caso Especial" : "Nuevo Caso Especial"
            }
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 max-h-[92vh] overflow-y-auto space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                  Sección Conócenos • Casos Especiales
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  {editingCase
                    ? `Editar Caso: ${editingCase.name || editingCase.title}`
                    : "Registrar Nuevo Caso Especial"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveCase} className="space-y-6">
              {/* 1. DATOS PRINCIPALES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Perrito
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. Valentín, Esperanza..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado del Caso
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as SpecialCaseStatus,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha o Mes del Rescate
                  </label>
                  <input
                    type="text"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    placeholder="Ej. Marzo 2025"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título Principal del Caso *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Ej. De ser atropellado en carretera a correr feliz en sus 4 patas"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lugar del Rescate
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    placeholder="Ej. Amatitlán, Guatemala"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Diagnóstico Inicial / Subtítulo Médico
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm({ ...form, subtitle: e.target.value })
                  }
                  placeholder="Ej. Fractura doble en patas traseras y deshidratación severa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 2. NARRATIVA Y ANTES / DESPUÉS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Historia Completa del Caso *
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.story}
                  onChange={(e) => setForm({ ...form, story: e.target.value })}
                  placeholder="Escribe cómo fue encontrado el perrito, qué tratamientos o cirugías recibió y cómo se transformó su vida..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                    1. ¿Cómo llegó al rescate? (Antes)
                  </label>
                  <textarea
                    rows={2}
                    value={form.beforeText}
                    onChange={(e) =>
                      setForm({ ...form, beforeText: e.target.value })
                    }
                    placeholder="Resumen de su estado al ser rescatado..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-emerald-800">
                    2. ¿Cómo está hoy? (Después)
                  </label>
                  <textarea
                    rows={2}
                    value={form.afterText}
                    onChange={(e) =>
                      setForm({ ...form, afterText: e.target.value })
                    }
                    placeholder="Resumen de su recuperación y vida actual..."
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 3. GESTIÓN DE FOTOS (SUBIDA DESDE PC + GALERÍA) */}
              <div className="p-5 rounded-2xl bg-sky-50/50 border border-sky-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-sky-600" />
                      <span>Fotografías del Caso (Antes / Proceso / Después)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Sube fotos directamente desde tu computadora o pega un enlace de imagen.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingPhoto
                          ? "Subiendo..."
                          : "Subir Fotos desde mi PC"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingPhoto}
                        onChange={(e) => handleFileUpload(e, !form.image)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Campo foto principal o agregar por URL */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-9">
                    <input
                      type="text"
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      placeholder="O pega aquí la URL de una foto (https://... o /uploads/...) y pulsa Agregar"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddGalleryUrl}
                      className="w-full h-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      + Agregar URL
                    </button>
                  </div>
                </div>

                {/* Galería visual con selección de foto de portada */}
                {form.gallery.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-600">
                      Haz clic en &ldquo;Usar como Principal&rdquo; para elegir la portada del caso:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {form.gallery.map((photoUrl, idx) => {
                        const isMain = form.image === photoUrl;
                        return (
                          <div
                            key={idx}
                            className={`relative rounded-2xl overflow-hidden border-2 bg-white shadow-xs group ${
                              isMain
                                ? "border-emerald-500 ring-2 ring-emerald-200"
                                : "border-slate-200"
                            }`}
                          >
                            <img
                              src={photoUrl}
                              alt={`Foto ${idx + 1}`}
                              className="w-full h-28 object-cover"
                            />
                            <div className="p-2 flex items-center justify-between gap-1 bg-white">
                              <button
                                type="button"
                                onClick={() =>
                                  setForm({ ...form, image: photoUrl })
                                }
                                className={`text-[10px] font-extrabold px-2 py-1 rounded-lg transition cursor-pointer ${
                                  isMain
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {isMain ? "★ Portada" : "Usar como Principal"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveGalleryPhoto(photoUrl)
                                }
                                title="Quitar foto"
                                className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Aún no has subido fotos para este caso. Puedes subir una o varias imágenes desde tu computadora.
                  </p>
                )}
              </div>

              {/* 4. OPCIONES DE VISIBILIDAD */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) =>
                      setForm({ ...form, published: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Publicar inmediatamente en /conocenos</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm({ ...form, featured: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>Mostrar también en el carrusel de la página de Inicio</span>
                </label>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingPhoto}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {saving
                      ? "Guardando..."
                      : editingCase
                      ? "Guardar Cambios del Caso"
                      : "Publicar Caso Especial"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
