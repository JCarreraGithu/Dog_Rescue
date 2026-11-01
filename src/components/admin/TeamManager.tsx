"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Power, Trash2, UserPlus, ShieldCheck } from "lucide-react";
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, Role } from "@/lib/permissions";

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt?: string;
};

export default function TeamManager({ currentUserId }: { currentUserId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", role: "editor" as Role, password: "" });
  const [creating, setCreating] = useState(false);
  const [resetFor, setResetFor] = useState<Member | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      if (res.ok) setMembers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (type: "ok" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return flash("error", data.error || "No se pudo crear el usuario.");
      flash("ok", `Usuario ${data.email} creado. Deberá cambiar su contraseña al entrar.`);
      setForm({ name: "", email: "", role: "editor", password: "" });
      load();
    } finally {
      setCreating(false);
    }
  };

  const patch = async (member: Member, body: Record<string, unknown>, okText: string) => {
    setBusyId(member.id);
    try {
      const res = await fetch(`/api/team/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return flash("error", data.error || "No se pudo actualizar.");
      flash("ok", okText);
      load();
      return true;
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (member: Member) => {
    if (!confirm(`¿Eliminar definitivamente a ${member.name}? Es mejor desactivarlo para conservar el historial.`)) return;
    setBusyId(member.id);
    try {
      const res = await fetch(`/api/team/${member.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return flash("error", data.error || "No se pudo eliminar.");
      flash("ok", "Usuario eliminado.");
      load();
    } finally {
      setBusyId(null);
    }
  };

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetFor) return;
    const ok = await patch(resetFor, { password: resetPassword }, "Contraseña restablecida. Deberá cambiarla al entrar.");
    if (ok) {
      setResetFor(null);
      setResetPassword("");
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" /> Equipo con acceso al panel
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Solo las personas que crees aquí pueden entrar. Cada una tiene su propio correo, contraseña y rol.
        </p>

        {feedback && (
          <p role="status" className={`mt-4 text-sm font-semibold rounded-lg px-3 py-2 border ${
            feedback.type === "ok"
              ? "text-emerald-800 bg-emerald-50 border-emerald-200"
              : "text-rose-700 bg-rose-50 border-rose-200"
          }`}>
            {feedback.text}
          </p>
        )}

        <form onSubmit={create} className="mt-5 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Correo</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rol</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className={inputCls}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña temporal</label>
            <input required type="text" autoComplete="off" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls}
              placeholder="10+ caracteres, letras y números" />
          </div>
          <button type="submit" disabled={creating}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm">
            <UserPlus className="w-4 h-4" /> {creating ? "Creando..." : "Agregar"}
          </button>
        </form>
        <p className="text-[11px] text-slate-500 mt-2">{ROLE_DESCRIPTIONS[form.role]}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Cargando equipo...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Persona</th>
                  <th className="text-left px-4 py-3">Rol</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Último ingreso</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => {
                  const isSelf = m.id === currentUserId;
                  const busy = busyId === m.id;
                  return (
                    <tr key={m.id} className={m.active ? "" : "bg-slate-50 text-slate-400"}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{m.name} {isSelf && <span className="text-[10px] text-sky-600">(tú)</span>}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select disabled={isSelf || busy} value={m.role}
                          onChange={(e) => patch(m, { role: e.target.value }, "Rol actualizado.")}
                          className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs disabled:opacity-60">
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold">
                        {m.active ? (
                          <span className="text-emerald-700">Activo{m.mustChangePassword ? " · pendiente de cambiar clave" : ""}</span>
                        ) : (
                          <span className="text-rose-600">Desactivado</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString("es-GT") : "Nunca"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button type="button" disabled={busy} onClick={() => { setResetFor(m); setResetPassword(""); }}
                            title="Restablecer contraseña"
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50">
                            <KeyRound className="w-4 h-4" />
                          </button>
                          {!isSelf && (
                            <>
                              <button type="button" disabled={busy}
                                onClick={() => patch(m, { active: !m.active }, m.active ? "Usuario desactivado y sesiones cerradas." : "Usuario reactivado.")}
                                title={m.active ? "Desactivar" : "Reactivar"}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50">
                                <Power className="w-4 h-4" />
                              </button>
                              <button type="button" disabled={busy} onClick={() => remove(m)} title="Eliminar"
                                className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resetFor && (
        <div className="fixed inset-0 z-[90] bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={doReset} className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-slate-900">Restablecer contraseña de {resetFor.name}</h3>
            <p className="text-xs text-slate-500">Se cerrarán sus sesiones y deberá crear una nueva contraseña al entrar.</p>
            <input required type="text" autoComplete="off" value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)} className={inputCls}
              placeholder="Contraseña temporal (10+ con letras y números)" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setResetFor(null)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white">Restablecer</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
