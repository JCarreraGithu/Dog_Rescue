"use client";

import { useEffect, useState } from "react";
import type { CaseReportView } from "@/lib/view-types";
import {
  AlertTriangle,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Trash2,
  MessageCircle,
  Camera,
  X,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

const STATUS_LIST = [
  "Recibido",
  "En Camino / Verificando",
  "Rescatado",
  "Caso Cerrado",
];

export default function CaseReportsManager() {
  const [requestError, setRequestError] = useState("");
  const [reports, setReports] = useState<CaseReportView[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("Todas");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  // Modal de detalle / fotos y notas de rescate
  const [selectedReport, setSelectedReport] = useState<CaseReportView | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [notesDraft, setNotesDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState("Recibido");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/case-reports", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron cargar los reportes.");
      const data = await res.json();
      if (Array.isArray(data)) {
        setRequestError("");
        setReports(data);
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleUpdateReport = async (
    reportId: string,
    patch: Partial<CaseReportView>
  ) => {
    try {
      const res = await fetch("/api/case-reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reportId, ...patch }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "No se pudo actualizar el reporte."); }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.reports)) {
          setReports(data.reports);
          if (selectedReport?.id === reportId) {
            const updated = data.reports.find((r: CaseReportView) => r.id === reportId);
            if (updated) setSelectedReport(updated);
          }
        } else {
          await loadReports();
        }
        setRequestError("");
        showToast("Reporte actualizado correctamente");
        return true;
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "No se pudo actualizar el reporte.");
    }
    return false;
  };

  const handleDeleteReport = async (reportId: string) => {
    if (
      !window.confirm(
        "¿Estás seguro de eliminar este reporte de caso en riesgo?"
      )
    )
      return;
    try {
      const res = await fetch(
        `/api/case-reports?id=${encodeURIComponent(reportId)}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "No se pudo eliminar el reporte."); }
      if (res.ok) {
        setRequestError("");
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        if (selectedReport?.id === reportId) setSelectedReport(null);
        showToast("Reporte eliminado");
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "No se pudo eliminar el reporte.");
    }
  };

  const openReportModal = (report: CaseReportView) => {
    setSelectedReport(report);
    setPhotoIndex(0);
    setNotesDraft(report.adminNotes || "");
    setStatusDraft(report.status || "Recibido");
  };

  const buildReporterWhatsApp = (report: CaseReportView) => {
    const cleanPhone = String(report.reporterPhone || "").replace(
      /[^0-9]/g,
      ""
    );
    const gtPhone =
      cleanPhone.length === 8 ? `502${cleanPhone}` : cleanPhone;
    const msg = `Hola ${report.reporterName} 🐾, te escribimos del equipo de rescate de DOG rescue Guatemala respecto al reporte que enviaste sobre el perrito en "${report.locationAddress}".\n\nEstado de tu reporte: *${
      report.status || "Recibido"
    }*\n\n¿Nos podrías compartir la ubicación en tiempo real o referencias adicionales para apoyar? ¡Gracias por no ser indiferente!`;
    return `https://wa.me/${gtPhone}?text=${encodeURIComponent(msg)}`;
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter !== "Todos" && (r.status || "Recibido") !== statusFilter)
      return false;
    if (urgencyFilter !== "Todas" && r.urgencyLevel !== urgencyFilter)
      return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (r.reporterName || "").toLowerCase().includes(q) ||
        (r.locationAddress || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const highUrgencyCount = reports.filter(
    (r) => r.urgencyLevel === "Alta" && r.status !== "Caso Cerrado"
  ).length;
  const inProgressCount = reports.filter(
    (r) => r.status === "En Camino / Verificando"
  ).length;
  const rescuedCount = reports.filter((r) => r.status === "Rescatado").length;

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case "Alta":
        return "bg-rose-600 text-white border-rose-500 animate-pulse";
      case "Media":
        return "bg-amber-500 text-slate-950 border-amber-400";
      default:
        return "bg-sky-600 text-white border-sky-500";
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "Rescatado":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "En Camino / Verificando":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "Caso Cerrado":
        return "bg-slate-200 text-slate-700 border-slate-300";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="space-y-6">
      {requestError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-700">{requestError}</p>}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-2.5 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* CABECERA Y KPIs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider bg-rose-50 px-3 py-1 rounded-full mb-1.5 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Alertas Ciudadanas • Amatitlán y Guatemala</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Gestión de Reportes de Perritos en Riesgo
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Revisa las fotografías de evidencia, ubicación exacta, nivel de urgencia y contacta al ciudadano que reportó el caso.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs font-bold text-slate-500 uppercase">
              Total Reportes
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {reports.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Recibidos desde la web
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200">
            <p className="text-xs font-bold text-rose-800 uppercase">
              Urgencia Alta (Heridos)
            </p>
            <p className="text-3xl font-black text-rose-900 mt-1">
              {highUrgencyCount}
            </p>
            <p className="text-[11px] text-rose-700 mt-0.5">
              Prioridad inmediata
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200">
            <p className="text-xs font-bold text-sky-800 uppercase">
              En Verificación
            </p>
            <p className="text-3xl font-black text-sky-900 mt-1">
              {inProgressCount}
            </p>
            <p className="text-[11px] text-sky-700 mt-0.5">
              Equipo en camino / evaluando
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
            <p className="text-xs font-bold text-emerald-800 uppercase">
              Casos Rescatados
            </p>
            <p className="text-3xl font-black text-emerald-900 mt-1">
              {rescuedCount}
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Puestos a salvo con éxito
            </p>
          </div>
        </div>

        {/* FILTROS Y BUSCADOR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            {["Todos", ...STATUS_LIST].map((st) => (
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

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700"
            >
              <option value="Todas">Urgencia: Todas</option>
              <option value="Alta">Urgencia: Alta</option>
              <option value="Media">Urgencia: Media</option>
              <option value="Baja">Urgencia: Baja</option>
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por dirección o nombre..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* LISTADO DE REPORTES */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 text-sm">
          Cargando reportes de casos en riesgo...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">
            No hay reportes registrados con este filtro
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cuando alguien llene el formulario &ldquo;Reportar Caso de Perrito en Riesgo&rdquo; en la página de Inicio (con o sin fotografías), aparecerá aquí al instante.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReports.map((report) => {
            const photos: string[] =
              Array.isArray(report.photos) && report.photos.length > 0
                ? report.photos
                : report.photoUrl
                ? [report.photoUrl]
                : [];

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
              >
                {/* Fotografía(s) de evidencia si subieron */}
                {photos.length > 0 ? (
                  <div
                    onClick={() => openReportModal(report)}
                    className="relative h-56 bg-slate-900 cursor-pointer group overflow-hidden"
                  >
                    <img
                      src={photos[0]}
                      alt="Evidencia del reporte"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span
                        className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${getUrgencyBadge(
                          report.urgencyLevel
                        )}`}
                      >
                        Urgencia {report.urgencyLevel}
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-slate-900/85 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/15">
                        <Camera className="w-3.5 h-3.5 text-amber-300" />
                        <span>
                          {photos.length}{" "}
                          {photos.length === 1 ? "Foto" : "Fotos"} (Click para ampliar)
                        </span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                    <span
                      className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${getUrgencyBadge(
                        report.urgencyLevel
                      )}`}
                    >
                      Urgencia {report.urgencyLevel}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      Sin fotografía adjunta
                    </span>
                  </div>
                )}

                {/* Cuerpo del reporte */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg border ${getStatusBadge(
                          report.status || "Recibido"
                        )}`}
                      >
                        {report.status || "Recibido"}
                      </span>
                      <span className="text-xs text-slate-400 font-medium inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleString("es-GT", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Reciente"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80">
                      <p className="text-[11px] font-black uppercase text-rose-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Ubicación Reportada</span>
                      </p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {report.locationAddress}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase text-slate-400">
                        Descripción del Caso
                      </p>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-0.5">
                        {report.description}
                      </p>
                    </div>

                    {photos.length > 1 && (
                      <div className="flex items-center gap-2 pt-1">
                        {photos.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              openReportModal(report);
                              setPhotoIndex(idx);
                            }}
                            className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-rose-500 transition cursor-pointer"
                          >
                            <img
                              src={url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium">
                          Reportado por:{" "}
                        </span>
                        <strong className="text-slate-900">
                          {report.reporterName}
                        </strong>
                      </div>
                      {report.reporterPhone && (
                        <span className="inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                          <Phone className="w-3 h-3" />
                          {report.reporterPhone}
                        </span>
                      )}
                    </div>

                    {report.adminNotes && (
                      <p className="text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl">
                        <strong>Nota del Refugio:</strong> {report.adminNotes}
                      </p>
                    )}
                  </div>

                  {/* Controles de Estado y WhatsApp */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_LIST.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() =>
                            handleUpdateReport(report.id, { status: st })
                          }
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                            (report.status || "Recibido") === st
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openReportModal(report)}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-300" />
                        <span>Ver Fotos y Gestionar Caso</span>
                      </button>

                      {report.reporterPhone && (
                        <a
                          href={buildReporterWhatsApp(report)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition"
                          title="Contactar por WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                        title="Eliminar reporte"
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

      {/* MODAL DE DETALLE, FOTOS EN GRANDE Y SEGUIMIENTO DE RESCATE */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedReport(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Detalle del reporte de perrito en riesgo"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span
                  className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${getUrgencyBadge(
                    selectedReport.urgencyLevel
                  )}`}
                >
                  Urgencia {selectedReport.urgencyLevel}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Reporte en: {selectedReport.locationAddress}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const modalPhotos: string[] =
                Array.isArray(selectedReport.photos) &&
                selectedReport.photos.length > 0
                  ? selectedReport.photos
                  : selectedReport.photoUrl
                  ? [selectedReport.photoUrl]
                  : [];
              const safeIdx =
                photoIndex < modalPhotos.length ? photoIndex : 0;

              if (modalPhotos.length === 0) return null;

              return (
                <div className="space-y-3">
                  <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-950">
                    <img
                      src={modalPhotos[safeIdx]}
                      alt="Foto del reporte"
                      className="w-full h-full object-contain"
                    />
                    {modalPhotos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setPhotoIndex(
                              (safeIdx - 1 + modalPhotos.length) %
                                modalPhotos.length
                            )
                          }
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center cursor-pointer"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPhotoIndex((safeIdx + 1) % modalPhotos.length)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center cursor-pointer"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {modalPhotos.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {modalPhotos.map((u, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPhotoIndex(i)}
                          className={`w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer ${
                            safeIdx === i
                              ? "border-rose-600"
                              : "border-slate-200 opacity-70"
                          }`}
                        >
                          <img
                            src={u}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-black uppercase text-slate-400 text-[10px]">
                  Ciudadano que Reporta
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {selectedReport.reporterName}
                </p>
                <p className="text-slate-600">
                  Teléfono:{" "}
                  <strong>{selectedReport.reporterPhone || "No indicado"}</strong>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                <span className="font-black uppercase text-rose-700 text-[10px]">
                  Dirección / Punto de Referencia
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {selectedReport.locationAddress}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="font-black uppercase text-slate-400 text-[10px] block mb-1">
                Descripción del Estado del Perrito
              </span>
              <p className="text-sm text-slate-800 leading-relaxed">
                {selectedReport.description}
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const saved = await handleUpdateReport(selectedReport.id, {
                  status: statusDraft,
                  adminNotes: notesDraft,
                });
                if (saved) setSelectedReport(null);
              }}
              className="space-y-4 pt-2 border-t border-slate-200"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado del Caso
                  </label>
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-bold"
                  >
                    {STATUS_LIST.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas del Equipo de Rescate / Seguimiento Interno
                </label>
                <textarea
                  rows={3}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Ej. Unidad de rescate acudió a las 14:30, el perrito fue trasladado a clínica veterinaria..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {selectedReport.reporterPhone && (
                  <a
                    href={buildReporterWhatsApp({
                      ...selectedReport,
                      status: statusDraft,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contactar Ciudadano por WhatsApp</span>
                  </a>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    Guardar Seguimiento
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
