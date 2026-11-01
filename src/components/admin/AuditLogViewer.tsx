"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ScrollText } from "lucide-react";

type Entry = {
  id: string;
  at: string;
  actor: string;
  actorName?: string;
  action: string;
  detail?: string;
  ip?: string;
};

export default function AuditLogViewer() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit?limit=500");
      if (res.ok) setEntries(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = filter.trim().toLowerCase();
  const shown = q
    ? entries.filter((e) => `${e.actor} ${e.actorName ?? ""} ${e.action} ${e.detail ?? ""}`.toLowerCase().includes(q))
    : entries;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
      <div className="p-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-sky-600" /> Bitácora de seguridad
          </h2>
          <p className="text-sm text-slate-500">Quién entró, qué cambió y los intentos fallidos o bloqueados.</p>
        </div>
        <div className="flex gap-2">
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrar por persona o acción"
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm w-60" />
          <button type="button" onClick={load} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100" title="Actualizar">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase sticky top-0">
            <tr>
              <th className="text-left px-4 py-2.5">Fecha</th>
              <th className="text-left px-4 py-2.5">Persona</th>
              <th className="text-left px-4 py-2.5">Acción</th>
              <th className="text-left px-4 py-2.5">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((e) => {
              const bad = /fallido|bloqueado|denegado|rechazado/i.test(e.action);
              return (
                <tr key={e.id} className={bad ? "bg-rose-50/60" : ""}>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-500">{new Date(e.at).toLocaleString("es-GT")}</td>
                  <td className="px-4 py-2">
                    <span className="font-bold text-slate-800">{e.actorName || e.actor}</span>
                    {e.actorName && <span className="block text-slate-400">{e.actor}</span>}
                  </td>
                  <td className="px-4 py-2">
                    <span className={bad ? "font-bold text-rose-700" : "text-slate-800"}>{e.action}</span>
                    {e.detail && <span className="block text-slate-500">{e.detail}</span>}
                  </td>
                  <td className="px-4 py-2 text-slate-400">{e.ip}</td>
                </tr>
              );
            })}
            {!loading && shown.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Sin registros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
