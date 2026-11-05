"use client";
import { uploadSpecialCaseForm } from "@/lib/special-case-upload-client";

import { useEffect, useState } from "react";
import type { LocalDog } from "@/lib/local-records";
import type { AdoptionView, CaseReportView } from "@/lib/view-types";
import {
  X,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  Home,
  Upload,
  Plus,
  Trash2,
  Printer,
  FileText,
  AlertTriangle,
  MessageCircle,
  ShieldCheck,
  Calendar,
  MapPin,
  UserCheck,
} from "lucide-react";
import type {
  DogDocumentation,
  DogRehabAttachment,
  DogAdoptionFollowUp,
} from "@/lib/local-records";

type Props = {
  dogId: string;
  dogName: string;
  onClose: () => void;
  onSaved: () => void;
};

export function computeDocProgress(doc?: DogDocumentation) {
  if (!doc) {
    return {
      percent: 33,
      stage1: false,
      stage2: false,
      stage3: false,
    };
  }
  const s1 = Boolean(doc.arrival?.intakeCompleted);
  const s2 = Boolean(doc.rehabilitation?.rehabCompleted);
  const s3 = Boolean(doc.adoption?.adoptionCompleted);
  const count = (s1 ? 1 : 0) + (s2 ? 1 : 0) + (s3 ? 1 : 0);
  const percent = count === 3 ? 100 : count === 2 ? 67 : count === 1 ? 34 : 15;
  return {
    percent,
    stage1: s1,
    stage2: s2,
    stage3: s3,
  };
}

export default function DogDocumentationModal({
  dogId,
  dogName,
  onClose,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeStage, setActiveStage] = useState<
    "arrival" | "rehabilitation" | "adoption" | "print"
  >("arrival");
  const [dog, setDog] = useState<LocalDog | null>(null);
  const [doc, setDoc] = useState<DogDocumentation | null>(null);
  const [dogApplications, setDogApplications] = useState<AdoptionView[]>([]);
  const [caseReports, setCaseReports] = useState<CaseReportView[]>([]);
  const [feedback, setFeedback] = useState<string>("");

  // Formulario para nuevo adjunto clínico en Etapa 2
  const [newAttachment, setNewAttachment] = useState<{
    title: string;
    type: DogRehabAttachment["type"];
    url: string;
    date: string;
  }>({
    title: "",
    type: "Certificado",
    url: "",
    date: new Date().toISOString().slice(0, 10),
  });

  // Formulario para nuevo seguimiento post-adopción en Etapa 3
  const [newFollowUp, setNewFollowUp] = useState<{
    period: DogAdoptionFollowUp["period"];
    date: string;
    status: DogAdoptionFollowUp["status"];
    notes: string;
    photoUrl: string;
  }>({
    period: "Mes 1",
    date: new Date().toISOString().slice(0, 10),
    status: "Verificado Óptimo",
    notes: "",
    photoUrl: "",
  });

  useEffect(() => {
    const loadDoc = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dogs/${dogId}/documentation`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok && data.documentation) {
          setDog(data.dog);
          setDoc(data.documentation);
          setDogApplications(Array.isArray(data.dogApplications) ? data.dogApplications : []);
          setCaseReports(Array.isArray(data.caseReports) ? data.caseReports : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDoc();
  }, [dogId]);

  const uploadImageHelper = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadSpecialCaseForm(formData, "/api/dogs/upload", true);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir imagen");
      return data.url as string;
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Error al subir archivo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDocumentation = async () => {
    if (!doc || saving) return;
    setSaving(true);
    setFeedback("");
    try {
      const res = await fetch(`/api/dogs/${dogId}/documentation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentation: doc }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo guardar la documentación");
      }
      const updatedDog = await res.json();
      setDog(updatedDog);
      setDoc(updatedDog.documentation);
      setFeedback("¡Documentación del ciclo de vida guardada y sincronizada con éxito!");
      onSaved();
      setTimeout(() => setFeedback(""), 4000);
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Error al guardar la documentación"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !doc) {
    return (
      <div className="fixed inset-0 z-[85] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center space-y-3 shadow-2xl">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            Cargando expediente documental de {dogName}...
          </p>
        </div>
      </div>
    );
  }

  const progress = computeDocProgress(doc);

  return (
    <div className="fixed inset-0 z-[85] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER FIJO */}
        <div className="bg-slate-900 text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            {dog?.photoUrl && (
              <img
                src={dog.photoUrl}
                alt={dogName}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 shrink-0"
              />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Expediente Documental: {dog?.name || dogName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Avance {progress.percent}%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ciclo de Vida Documental • 1. Llegada ➔ 2. Rehabilitación ➔ 3. Adopción
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleSaveDocumentation}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar Documentación"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEPPER DE LAS 3 ETAPAS + FICHA IMPRIMIBLE */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveStage("arrival")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeStage === "arrival"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-amber-500" />
            <span>1. Llegada / Ingreso</span>
            {doc.arrival.intakeCompleted && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveStage("rehabilitation")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeStage === "rehabilitation"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <span>2. Rehabilitación</span>
            {doc.rehabilitation.rehabCompleted && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveStage("adoption")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeStage === "adoption"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Home className="w-4 h-4 text-emerald-500" />
            <span>3. Adopción y Seguimiento</span>
            {doc.adoption.adoptionCompleted && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveStage("print")}
            className={`ml-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeStage === "print"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Expediente Consolidado (Imprimir)</span>
          </button>
        </div>

        {feedback && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
            <span>{feedback}</span>
            <button
              type="button"
              onClick={() => setFeedback("")}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CONTENIDO DE CADA ETAPA */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* ========================================================= */}
          {/* ETAPA 1: LLEGADA E INGRESO AL ALBERGUE */}
          {/* ========================================================= */}
          {activeStage === "arrival" && (
            <div className="space-y-5">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-amber-600" />
                    <span>Etapa 1: Acta de Llegada, Rescate y Triaje Inicial</span>
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Documenta cómo, cuándo y en qué estado ingresó el perrito al refugio.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-amber-300 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={doc.arrival.intakeCompleted}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        arrival: {
                          ...doc.arrival,
                          intakeCompleted: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span className="font-extrabold text-slate-900">
                    Acta de Ingreso Completada
                  </span>
                </label>
              </div>

              {/* Vincular con un Reporte de Riesgo Ciudadano si existe */}
              {caseReports.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block font-extrabold text-slate-800">
                    ¿Proviene de un Reporte Ciudadano de Perrito en Riesgo? (Opcional)
                  </label>
                  <select
                    value={doc.arrival.linkedCaseReportId || ""}
                    onChange={(e) => {
                      const repId = e.target.value;
                      const found = caseReports.find((r) => r.id === repId);
                      if (found) {
                        setDoc({
                          ...doc,
                          arrival: {
                            ...doc.arrival,
                            linkedCaseReportId: repId,
                            rescueLocation: found.location || doc.arrival.rescueLocation,
                            rescuedBy: `Reporte ciudadano (${found.reporterPhone || "Vecino"})`,
                            triageNotes: found.description || doc.arrival.triageNotes,
                            beforePhotos:
                              Array.isArray(found.photos) && found.photos.length > 0
                                ? found.photos
                                : doc.arrival.beforePhotos,
                          },
                        });
                      } else {
                        setDoc({
                          ...doc,
                          arrival: { ...doc.arrival, linkedCaseReportId: "" },
                        });
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="">-- No vinculado / Ingreso directo por brigada --</option>
                    {caseReports.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        [{rep.urgency}] {rep.location} — {rep.description?.slice(0, 50)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fecha de Ingreso / Rescate
                  </label>
                  <input
                    type="date"
                    value={doc.arrival.intakeDate}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        arrival: { ...doc.arrival, intakeDate: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lugar Exacto del Rescate
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Barrio San Antonio, Amatitlán"
                    value={doc.arrival.rescueLocation}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        arrival: {
                          ...doc.arrival,
                          rescueLocation: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Rescatado / Entregado por
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Brigada DOG rescue / Vecino"
                    value={doc.arrival.rescuedBy}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        arrival: { ...doc.arrival, rescuedBy: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Condición Clínica al Ingresar
                  </label>
                  <select
                    value={doc.arrival.initialCondition}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        arrival: {
                          ...doc.arrival,
                          initialCondition: e.target.value as DogDocumentation["arrival"]["initialCondition"],
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold"
                  >
                    <option value="Estable">Estable</option>
                    <option value="Abandono">Abandono en vía pública</option>
                    <option value="Desnutrición">Desnutrición severa / moderada</option>
                    <option value="Herido / Politraumatismo">Herido / Politraumatismo</option>
                    <option value="Crítico">Estado Crítico / Emergencia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Peso Inicial de Ingreso (kg)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 11.5 kg"
                    value={doc.arrival.initialWeightKg}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        arrival: {
                          ...doc.arrival,
                          initialWeightKg: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observaciones de Triaje y Diagnóstico de Entrada
                </label>
                <textarea
                  rows={3}
                  value={doc.arrival.triageNotes}
                  onChange={(e) =>
                    setDoc({
                      ...doc,
                      arrival: { ...doc.arrival, triageNotes: e.target.value },
                    })
                  }
                  placeholder="Describe lesiones, estado del pelaje, hidratación, hallazgos veterinarios iniciales..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              {/* Fotos de evidencia de ingreso ("Antes") */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-800">
                      Fotografías de Evidencia de Ingreso (&ldquo;Antes&rdquo;)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Respaldo visual del estado en que llegó el perrito al albergue.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{uploading ? "Subiendo..." : "Agregar Foto de Ingreso"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImageHelper(file);
                        if (url) {
                          setDoc({
                            ...doc,
                            arrival: {
                              ...doc.arrival,
                              beforePhotos: [...doc.arrival.beforePhotos, url],
                            },
                          });
                        }
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {doc.arrival.beforePhotos.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {doc.arrival.beforePhotos.map((photo, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={photo}
                          alt={`Ingreso ${i + 1}`}
                          className="w-24 h-24 object-cover rounded-xl border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setDoc({
                              ...doc,
                              arrival: {
                                ...doc.arrival,
                                beforePhotos: doc.arrival.beforePhotos.filter(
                                  (_, idx) => idx !== i
                                ),
                              },
                            })
                          }
                          className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md cursor-pointer"
                          title="Quitar foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ETAPA 2: REHABILITACIÓN FÍSICA Y CONDUCTUAL */}
          {/* ========================================================= */}
          {activeStage === "rehabilitation" && (
            <div className="space-y-5">
              <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-rose-950 flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    <span>Etapa 2: Protocolo de Rehabilitación Médica y Conductual</span>
                  </h3>
                  <p className="text-xs text-rose-800 mt-0.5">
                    Control de vacunas, desparasitación, esterilización, recetas y alta para adopción.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-rose-300 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={doc.rehabilitation.rehabCompleted}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        rehabilitation: {
                          ...doc.rehabilitation,
                          rehabCompleted: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span className="font-extrabold text-slate-900">
                    Alta de Rehabilitación (Listo para Adopción)
                  </span>
                </label>
              </div>

              {/* Checklist Clínico */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    key: "dewormed",
                    label: "Desparasitación Interna y Externa",
                  },
                  {
                    key: "vaccinatedSextuple",
                    label: "Vacuna Séxtuple / Múltiple",
                  },
                  {
                    key: "vaccinatedRabies",
                    label: "Vacuna Antirrábica Vigente",
                  },
                  {
                    key: "sterilized",
                    label: "Esterilizado / Castrado",
                  },
                ].map((item) => {
                  const checked = Boolean(
                    doc.rehabilitation[item.key as keyof DogDocumentation["rehabilitation"]]
                  );
                  return (
                    <label
                      key={item.key}
                      className={`p-3.5 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition ${
                        checked
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setDoc({
                            ...doc,
                            rehabilitation: {
                              ...doc.rehabilitation,
                              [item.key]: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                      <span className="font-extrabold">{item.label}</span>
                    </label>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fecha de Esterilización (si aplica)
                  </label>
                  <input
                    type="date"
                    value={doc.rehabilitation.sterilizationDate}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        rehabilitation: {
                          ...doc.rehabilitation,
                          sterilizationDate: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Médico Veterinario Responsable
                  </label>
                  <input
                    type="text"
                    value={doc.rehabilitation.vetResponsible}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        rehabilitation: {
                          ...doc.rehabilitation,
                          vetResponsible: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Evaluación Conductual y Socialización
                </label>
                <textarea
                  rows={3}
                  value={doc.rehabilitation.behavioralAssessment}
                  onChange={(e) =>
                    setDoc({
                      ...doc,
                      rehabilitation: {
                        ...doc.rehabilitation,
                        behavioralAssessment: e.target.value,
                      },
                    })
                  }
                  placeholder="Describe cómo convive con otros perros, personas, niños, uso de correa y nivel de energía..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              {/* Subida de Recetas, Exámenes, Certificados o Fotos de Recuperación */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-800">
                    Documentos Clínicos, Certificados y Fotos de Recuperación (&ldquo;Después&rdquo;)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Adjunta fotos de recetas, exámenes de laboratorio, carné de vacunas o fotos de su recuperación.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end bg-white p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Título del Documento
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Carné de vacunación"
                      value={newAttachment.title}
                      onChange={(e) =>
                        setNewAttachment({
                          ...newAttachment,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={newAttachment.type}
                      onChange={(e) =>
                        setNewAttachment({
                          ...newAttachment,
                          type: e.target.value as DogRehabAttachment["type"],
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                    >
                      <option value="Certificado">Certificado / Carné</option>
                      <option value="Receta">Receta Médica</option>
                      <option value="Examen">Examen / Laboratorio</option>
                      <option value="Foto Recuperación">Foto Recuperación</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Imagen / Archivo
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="URL o sube archivo ->"
                        value={newAttachment.url}
                        onChange={(e) =>
                          setNewAttachment({
                            ...newAttachment,
                            url: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-slate-900"
                      />
                      <label className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-2 rounded-lg cursor-pointer flex items-center shrink-0">
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await uploadImageHelper(file);
                            if (url) {
                              setNewAttachment((prev) => ({
                                ...prev,
                                url,
                                title: prev.title || file.name.replace(/\.[^.]+$/, ""),
                              }));
                            }
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newAttachment.title.trim() || !newAttachment.url.trim()) return;
                      const item: DogRehabAttachment = {
                        id: `att-${Date.now()}`,
                        title: newAttachment.title.trim(),
                        type: newAttachment.type,
                        url: newAttachment.url.trim(),
                        date: newAttachment.date,
                      };
                      setDoc({
                        ...doc,
                        rehabilitation: {
                          ...doc.rehabilitation,
                          medicalAttachments: [
                            ...doc.rehabilitation.medicalAttachments,
                            item,
                          ],
                        },
                      });
                      setNewAttachment({
                        title: "",
                        type: "Certificado",
                        url: "",
                        date: new Date().toISOString().slice(0, 10),
                      });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adjuntar</span>
                  </button>
                </div>

                {doc.rehabilitation.medicalAttachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {doc.rehabilitation.medicalAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={att.url}
                            alt={att.title}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {att.type}
                            </span>
                            <p className="font-bold text-slate-900 mt-0.5">
                              {att.title}
                            </p>
                            <p className="text-[10px] text-slate-500">{att.date}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDoc({
                              ...doc,
                              rehabilitation: {
                                ...doc.rehabilitation,
                                medicalAttachments:
                                  doc.rehabilitation.medicalAttachments.filter(
                                    (x) => x.id !== att.id
                                  ),
                              },
                            })
                          }
                          className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ETAPA 3: ADOPCIÓN, CONTRATO LEGAL Y SEGUIMIENTO */}
          {/* ========================================================= */}
          {activeStage === "adoption" && (
            <div className="space-y-5">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-600" />
                    <span>Etapa 3: Expediente Legal de Adopción y Seguimiento</span>
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Vincula al adoptante aprobado, respalda el compromiso Ley 5-2017 y registra controles post-adopción.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-emerald-300 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={doc.adoption.adoptionCompleted}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        adoption: {
                          ...doc.adoption,
                          adoptionCompleted: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span className="font-extrabold text-slate-900">
                    Adopción Formalizada (Marcar como Adoptado)
                  </span>
                </label>
              </div>

              {/* Autocompletar desde Solicitudes de Adopción de este perrito */}
              {dogApplications.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block font-extrabold text-slate-800">
                    Vincular con Solicitud de Adopción Recibida para {dog?.name}
                  </label>
                  <select
                    value={doc.adoption.adoptionApplicationId || ""}
                    onChange={(e) => {
                      const appId = e.target.value;
                      const found = dogApplications.find((a) => a.id === appId);
                      if (found) {
                        setDoc({
                          ...doc,
                          adoption: {
                            ...doc.adoption,
                            adoptionApplicationId: appId,
                            adopterName: found.applicantName || "",
                            adopterPhone: found.applicantPhone || "",
                            signedContractAccepted: Boolean(found.commitsToWelfare),
                          },
                        });
                      } else {
                        setDoc({
                          ...doc,
                          adoption: {
                            ...doc.adoption,
                            adoptionApplicationId: "",
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="">-- Seleccionar solicitud para autocompletar datos --</option>
                    {dogApplications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.applicantName} ({app.applicantPhone}) — Estado: {app.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre Completo del Adoptante
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre y apellidos"
                    value={doc.adoption.adopterName}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        adoption: {
                          ...doc.adoption,
                          adopterName: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 5555-1234"
                    value={doc.adoption.adopterPhone}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        adoption: {
                          ...doc.adoption,
                          adopterPhone: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    No. de DPI / Identificación
                  </label>
                  <input
                    type="text"
                    placeholder="DPI del adoptante"
                    value={doc.adoption.adopterIdNumber}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        adoption: {
                          ...doc.adoption,
                          adopterIdNumber: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fecha de Entrega Oficial
                  </label>
                  <input
                    type="date"
                    value={doc.adoption.deliveryDate}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        adoption: {
                          ...doc.adoption,
                          deliveryDate: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              {/* Compromiso legal + Fotos de Contrato y Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800">
                      Foto de Contrato Firmado / DPI
                    </span>
                    <label className="inline-flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-xl cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Subir</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await uploadImageHelper(file);
                          if (url) {
                            setDoc({
                              ...doc,
                              adoption: {
                                ...doc.adoption,
                                contractPhotoUrl: url,
                                signedContractAccepted: true,
                              },
                            });
                          }
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="URL o sube foto del contrato firmado..."
                    value={doc.adoption.contractPhotoUrl}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        adoption: {
                          ...doc.adoption,
                          contractPhotoUrl: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                  {doc.adoption.contractPhotoUrl && (
                    <img
                      src={doc.adoption.contractPhotoUrl}
                      alt="Contrato firmado"
                      className="w-24 h-24 object-cover rounded-xl border border-slate-300"
                    />
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800">
                      Foto de Entrega con su Nueva Familia
                    </span>
                    <label className="inline-flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-xl cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Subir</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await uploadImageHelper(file);
                          if (url) {
                            setDoc({
                              ...doc,
                              adoption: {
                                ...doc.adoption,
                                deliveryPhotoUrl: url,
                              },
                            });
                          }
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="URL o sube foto del día de adopción..."
                    value={doc.adoption.deliveryPhotoUrl}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        adoption: {
                          ...doc.adoption,
                          deliveryPhotoUrl: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                  {doc.adoption.deliveryPhotoUrl && (
                    <img
                      src={doc.adoption.deliveryPhotoUrl}
                      alt="Entrega en adopción"
                      className="w-24 h-24 object-cover rounded-xl border border-slate-300"
                    />
                  )}
                </div>
              </div>

              {/* Bitácora de Seguimiento Post-Adopción */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-800">
                      Bitácora de Seguimiento Post-Adopción (Mes 1, Mes 3, Mes 6)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Registra las verificaciones periódicas de bienestar en su nuevo hogar.
                    </p>
                  </div>
                  {doc.adoption.adopterPhone && (
                    <a
                      href={`https://wa.me/502${doc.adoption.adopterPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Hola ${doc.adoption.adopterName}, te saludamos de DOG rescue Guatemala para el seguimiento de bienestar de ${dog?.name}. ¿Cómo ha estado?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Solicitar Seguimiento por WhatsApp</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end bg-white p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Periodo
                    </label>
                    <select
                      value={newFollowUp.period}
                      onChange={(e) =>
                        setNewFollowUp({
                          ...newFollowUp,
                          period: e.target.value as DogAdoptionFollowUp["period"],
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                    >
                      <option value="Mes 1">Control Mes 1</option>
                      <option value="Mes 3">Control Mes 3</option>
                      <option value="Mes 6">Control Mes 6</option>
                      <option value="Anual">Control Anual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Resultado
                    </label>
                    <select
                      value={newFollowUp.status}
                      onChange={(e) =>
                        setNewFollowUp({
                          ...newFollowUp,
                          status: e.target.value as DogAdoptionFollowUp["status"],
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                    >
                      <option value="Verificado Óptimo">Verificado Óptimo</option>
                      <option value="Pendiente">Pendiente de Revisión</option>
                      <option value="Requiere Visita">Requiere Visita Presencial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Observaciones del Control
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Excelente peso, envió fotos"
                      value={newFollowUp.notes}
                      onChange={(e) =>
                        setNewFollowUp({
                          ...newFollowUp,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newFollowUp.notes.trim()) return;
                      const item: DogAdoptionFollowUp = {
                        id: `fup-${Date.now()}`,
                        period: newFollowUp.period,
                        date: newFollowUp.date,
                        status: newFollowUp.status,
                        notes: newFollowUp.notes.trim(),
                      };
                      setDoc({
                        ...doc,
                        adoption: {
                          ...doc.adoption,
                          followUps: [...doc.adoption.followUps, item],
                        },
                      });
                      setNewFollowUp({
                        period: "Mes 3",
                        date: new Date().toISOString().slice(0, 10),
                        status: "Verificado Óptimo",
                        notes: "",
                        photoUrl: "",
                      });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Control</span>
                  </button>
                </div>

                {doc.adoption.followUps.length > 0 && (
                  <div className="space-y-2">
                    {doc.adoption.followUps.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200"
                      >
                        <div>
                          <span className="font-extrabold text-slate-900">
                            [{f.period}] {f.status}
                          </span>{" "}
                          <span className="text-slate-400">({f.date})</span>
                          <p className="text-slate-600 mt-0.5">{f.notes}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDoc({
                              ...doc,
                              adoption: {
                                ...doc.adoption,
                                followUps: doc.adoption.followUps.filter(
                                  (x) => x.id !== f.id
                                ),
                              },
                            })
                          }
                          className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ETAPA 4: VISTA OFICIAL CONSOLIDADA E IMPRIMIBLE */}
          {/* ========================================================= */}
          {activeStage === "print" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm font-black">
                    Certificado y Expediente Documental Consolidado
                  </h3>
                  <p className="text-xs text-slate-300">
                    Documento oficial con las 3 etapas del perrito (Ingreso, Rehabilitación y Adopción).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
              </div>

              <div className="border-2 border-slate-200 rounded-2xl p-6 space-y-5 bg-white">
                <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                      DOG rescue Guatemala • Amatitlán (9a calle 7-27)
                    </p>
                    <h4 className="text-xl font-black text-slate-900 mt-0.5">
                      Expediente Documental Único: {dog?.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Raza: {dog?.breed} • Sexo: {dog?.gender} • Edad: {dog?.ageCategory} ({dog?.ageYears} años) • Tamaño: {dog?.size}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-black text-xs">
                    Estado: {dog?.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Resumen Etapa 1 */}
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1.5">
                    <p className="font-black text-amber-950 uppercase text-[11px]">
                      1. Llegada e Ingreso ({doc.arrival.intakeCompleted ? "Completado" : "En curso"})
                    </p>
                    <p><strong>Fecha:</strong> {doc.arrival.intakeDate || "No registrada"}</p>
                    <p><strong>Lugar:</strong> {doc.arrival.rescueLocation || "No registrado"}</p>
                    <p><strong>Rescatado por:</strong> {doc.arrival.rescuedBy || "Brigada"}</p>
                    <p><strong>Condición:</strong> {doc.arrival.initialCondition} ({doc.arrival.initialWeightKg} kg)</p>
                    <p><strong>Triaje:</strong> {doc.arrival.triageNotes}</p>
                  </div>

                  {/* Resumen Etapa 2 */}
                  <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-1.5">
                    <p className="font-black text-rose-950 uppercase text-[11px]">
                      2. Rehabilitación ({doc.rehabilitation.rehabCompleted ? "Alta Médica" : "En Tratamiento"})
                    </p>
                    <p><strong>Desparasitado:</strong> {doc.rehabilitation.dewormed ? "Sí ✔" : "Pendiente"}</p>
                    <p><strong>Vacuna Séxtuple:</strong> {doc.rehabilitation.vaccinatedSextuple ? "Sí ✔" : "Pendiente"}</p>
                    <p><strong>Antirrábica:</strong> {doc.rehabilitation.vaccinatedRabies ? "Sí ✔" : "Pendiente"}</p>
                    <p><strong>Esterilizado:</strong> {doc.rehabilitation.sterilized ? `Sí ✔ (${doc.rehabilitation.sterilizationDate || "Realizada"})` : "Pendiente"}</p>
                    <p><strong>Veterinario:</strong> {doc.rehabilitation.vetResponsible}</p>
                    <p><strong>Conducta:</strong> {doc.rehabilitation.behavioralAssessment}</p>
                  </div>

                  {/* Resumen Etapa 3 */}
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                    <p className="font-black text-emerald-950 uppercase text-[11px]">
                      3. Adopción ({doc.adoption.adoptionCompleted ? "Formalizada" : "Disponible"})
                    </p>
                    <p><strong>Adoptante:</strong> {doc.adoption.adopterName || "Aún en espera de familia"}</p>
                    <p><strong>Teléfono:</strong> {doc.adoption.adopterPhone || "—"}</p>
                    <p><strong>DPI:</strong> {doc.adoption.adopterIdNumber || "—"}</p>
                    <p><strong>Fecha Entrega:</strong> {doc.adoption.deliveryDate || "—"}</p>
                    <p><strong>Compromiso Ley 5-2017:</strong> {doc.adoption.signedContractAccepted ? "Firmado y Aceptado ✔" : "Pendiente"}</p>
                    <p><strong>Controles Post-Adopción:</strong> {doc.adoption.followUps.length} registrados</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
