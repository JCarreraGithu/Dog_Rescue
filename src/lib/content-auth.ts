import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/staff-store";
import { canAccessApi } from "@/lib/permissions";

// Defensa adicional en los handlers, con las mismas reglas del middleware.
export async function checkContentAccess(request: Request, pathname: string): Promise<NextResponse | null> {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!canAccessApi(user.role, request.method, pathname)) {
    return NextResponse.json({ error: "No tienes permiso para esta acción." }, { status: 403 });
  }
  if (user.mustChangePassword) {
    return NextResponse.json({ error: "Debes cambiar tu contraseña antes de continuar.", mustChangePassword: true }, { status: 403 });
  }
  return null;
}
