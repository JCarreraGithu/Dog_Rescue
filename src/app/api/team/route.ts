import { NextResponse } from "next/server";
import { isRole, validatePassword } from "@/lib/permissions";
import {
  getClientIp,
  getUserFromRequest,
  hashPassword,
  isValidEmail,
  listUsers,
  mutateUsers,
  newUserId,
  normalizeEmail,
  toPublicUser,
  writeAudit,
} from "@/lib/staff-store";

// Gestión del equipo: SOLO administrador total (se valida aquí y en el middleware).
async function requireSuperadmin(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "superadmin" || user.mustChangePassword) return null;
  return user;
}

export async function GET(request: Request) {
  if (!(await requireSuperadmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const users = await listUsers();
  return NextResponse.json(users.map(toPublicUser));
}

export async function POST(request: Request) {
  const actor = await requireSuperadmin(request);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ error: "Correo no válido." }, { status: 400 });
  if (!isRole(body.role)) return NextResponse.json({ error: "Rol no válido." }, { status: 400 });
  const role = body.role;
  const problem = validatePassword(password);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const passwordHash = await hashPassword(password);
  const result = await mutateUsers((users) => {
    if (users.some((u) => u.email === email)) return null;
    const user = {
      id: newUserId(),
      name,
      email,
      role,
      passwordHash,
      active: true,
      mustChangePassword: true, // la persona elige su propia contraseña al entrar
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    return user;
  });

  if (!result) return NextResponse.json({ error: "Ya existe un usuario con ese correo." }, { status: 409 });
  await writeAudit({
    actor: actor.email,
    actorName: actor.name,
    action: "Usuario creado",
    detail: `${email} (${role})`,
    ip: getClientIp(request),
  });
  return NextResponse.json(toPublicUser(result), { status: 201 });
}
