import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Endpoints que el público SÍ puede usar (formularios y datos del sitio).
// Todo lo demás bajo /api y todo /admin exige sesión del personal del refugio.
const PUBLIC_API: Record<string, string[]> = {
  "/api/dogs": ["GET"], // catálogo público
  "/api/transparency": ["GET"], // contadores públicos
  "/api/applications": ["POST"], // formulario de adopción
  "/api/volunteers": ["POST"], // formulario de voluntariado
  "/api/case-reports": ["POST"], // reporte de perrito en riesgo
  "/api/auth/login": ["POST"],
  "/api/auth/logout": ["POST"],
  "/api/auth/session": ["GET"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  // Endpoints públicos permitidos
  if (pathname.startsWith("/api/")) {
    const allowed = PUBLIC_API[pathname];
    if (allowed && allowed.includes(method)) return NextResponse.next();
  }

  const isLoggedIn = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (isLoggedIn) return NextResponse.next();

  // API sin sesión -> 401 (sin detalles)
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Páginas del panel sin sesión -> al login
  const loginUrl = new URL("/acceso", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
