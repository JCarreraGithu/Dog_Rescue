import { NextResponse } from "next/server";
import { isRole, validatePassword } from "@/lib/permissions";
import {
  countActiveSuperadmins,
  getClientIp,
  getUserFromRequest,
  hashPassword,
  mutateUsers,
  toPublicUser,
  writeAudit,
} from "@/lib/staff-store";

async function requireSuperadmin(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "superadmin" || user.mustChangePassword) return null;
  return user;
}

type Ctx = { params: Promise<{ id: string }> };

// Editar nombre, rol, activar/desactivar o restablecer contraseña de un integrante.
export async function PATCH(request: Request, { params }: Ctx) {
  const actor = await requireSuperadmin(request);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  let newPasswordHash: string | null = null;
  if (typeof body.password === "string") {
    const problem = validatePassword(body.password);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    newPasswordHash = await hashPassword(body.password);
  }

  const isSelf = id === actor.id;
  const outcome = await mutateUsers((users) => {
    const target = users.find((u) => u.id === id);
    if (!target) return { error: "Usuario no encontrado.", status: 404 as const };

    const changes: string[] = [];
    const nextRole = isRole(body.role) ? body.role : target.role;
    const nextActive = typeof body.active === "boolean" ? body.active : target.active;

    // Protecciones: no quitarse el acceso a sí mismo ni dejar el sistema sin administrador
    if (isSelf && (nextRole !== target.role || nextActive !== target.active)) {
      return { error: "No puedes cambiar tu propio rol ni desactivarte.", status: 400 as const };
    }
    const losesSuperadmin =
      target.role === "superadmin" && target.active && (nextRole !== "superadmin" || !nextActive);
    if (losesSuperadmin && countActiveSuperadmins(users) <= 1) {
      return { error: "Debe quedar al menos un administrador total activo.", status: 400 as const };
    }

    if (typeof body.name === "string" && body.name.trim() && body.name.trim() !== target.name) {
      target.name = body.name.trim().slice(0, 80);
      changes.push("nombre");
    }
    if (nextRole !== target.role) {
      target.role = nextRole;
      changes.push(`rol → ${nextRole}`);
    }
    if (nextActive !== target.active) {
      target.active = nextActive;
      target.sessionVersion += 1; // cierra sus sesiones abiertas
      changes.push(nextActive ? "reactivado" : "desactivado");
    }
    if (newPasswordHash) {
      target.passwordHash = newPasswordHash;
      target.mustChangePassword = true;
      target.sessionVersion += 1;
      changes.push("contraseña restablecida");
    }
    return { user: target, changes };
  });

  if ("error" in outcome) return NextResponse.json({ error: outcome.error }, { status: outcome.status });

  if (outcome.changes.length > 0) {
    await writeAudit({
      actor: actor.email,
      actorName: actor.name,
      action: "Usuario modificado",
      detail: `${outcome.user.email}: ${outcome.changes.join(", ")}`,
      ip: getClientIp(request),
    });
  }
  return NextResponse.json(toPublicUser(outcome.user));
}

// Eliminar definitivamente (recomendado: mejor desactivar para conservar el historial).
export async function DELETE(request: Request, { params }: Ctx) {
  const actor = await requireSuperadmin(request);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  if (id === actor.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
  }

  const outcome = await mutateUsers((users) => {
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return { error: "Usuario no encontrado.", status: 404 as const };
    const target = users[index];
    if (target.role === "superadmin" && target.active && countActiveSuperadmins(users) <= 1) {
      return { error: "Debe quedar al menos un administrador total activo.", status: 400 as const };
    }
    users.splice(index, 1);
    return { email: target.email };
  });

  if ("error" in outcome) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  await writeAudit({
    actor: actor.email,
    actorName: actor.name,
    action: "Usuario eliminado",
    detail: outcome.email,
    ip: getClientIp(request),
  });
  return NextResponse.json({ ok: true });
}
