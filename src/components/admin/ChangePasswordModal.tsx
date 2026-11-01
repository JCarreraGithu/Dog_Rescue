"use client";

import { useState } from "react";
import { KeyRound, X } from "lucide-react";

type Props = {
  forced: boolean; // true = primer ingreso o restablecida por un admin: no se puede cerrar
  onClose: () => void;
  onDone: () => void;
};

export default function ChangePasswordModal({ forced, onClose, onDone }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError("La confirmación no coincide con la nueva contraseña.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No se pudo cambiar la contraseña.");
        return;
      }
      onDone();
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none";

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 leading-tight">
                {forced ? "Crea tu contraseña personal" : "Cambiar contraseña"}
              </h2>
              {forced && (
                <p className="text-xs text-slate-500">Por seguridad debes cambiarla antes de continuar.</p>
              )}
            </div>
          </div>
          {!forced && (
            <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="cp-current">
            Contraseña actual
          </label>
          <input id="cp-current" type="password" required autoComplete="current-password" value={current}
            onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="cp-new">
            Nueva contraseña
          </label>
          <input id="cp-new" type="password" required autoComplete="new-password" value={next}
            onChange={(e) => setNext(e.target.value)} className={inputCls} />
          <p className="text-[11px] text-slate-500 mt-1">Mínimo 10 caracteres, con letras y números.</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="cp-confirm">
            Repite la nueva contraseña
          </label>
          <input id="cp-confirm" type="password" required autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        </div>

        {error && (
          <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition text-sm">
          {loading ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
