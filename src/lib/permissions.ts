// Roles y permisos del panel (código puro, sin dependencias de Node).

export type Role = "superadmin" | "editor" | "voluntario";

export const ROLES: Role[] = ["superadmin", "editor", "voluntario"];

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Administrador total",
  editor: "Editor",
  voluntario: "Voluntario (solo lectura)",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  superadmin: "Todo el panel, además de gestionar el equipo y ver la bitácora.",
  editor: "Gestiona perritos, expedientes, adopciones, tienda y textos. No gestiona usuarios.",
  voluntario: "Puede consultar la información, pero no modificar nada.",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}

// Zonas solo para el administrador total
const SUPERADMIN_ONLY = [/^\/api\/team(\/|$)/, /^\/api\/audit(\/|$)/];

// Cualquier usuario con sesión puede usar estos endpoints, sea cual sea su rol
const ANY_STAFF = [/^\/api\/auth\/change-password$/];

/** ¿Este rol puede hacer esta petición a /api? */
export function canAccessApi(role: Role, method: string, pathname: string): boolean {
  if (ANY_STAFF.some((re) => re.test(pathname))) return true;
  if (SUPERADMIN_ONLY.some((re) => re.test(pathname))) return role === "superadmin";
  if (role === "voluntario") return method === "GET" || method === "HEAD";
  return true;
}

/** Contraseñas: mínimo 10 caracteres, con letras y números. */
export function validatePassword(password: string): string | null {
  if (password.length < 10) return "La contraseña debe tener al menos 10 caracteres.";
  if (password.length > 128) return "La contraseña es demasiado larga.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "La contraseña debe combinar letras y números.";
  }
  if (/^(tucontraseña|password|contraseña|12345)/i.test(password)) {
    return "Esa contraseña es demasiado común. Elige otra.";
  }
  return null;
}
