import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, getLoginPath, isAdminHost } from "@/lib/auth";
import { canAccessApi } from "@/lib/permissions";
import { getClientIp, getUserFromToken, writeAudit } from "@/lib/staff-store";

// Endpoints que el sitio público SÍ puede usar (lectura pública y formularios ciudadanos).
const PUBLIC_API: Record<string, string[]> = {
  "/api/dogs": ["GET"], // catálogo público
  "/api/transparency": ["GET"], // contadores públicos
  "/api/products": ["GET"], // tienda solidaria pública
  "/api/special-cases": ["GET"], // casos especiales públicos en /conocenos e inicio
  "/api/about-settings": ["GET"], // foto principal y textos de /conocenos
  "/api/home-settings": ["GET"], // lema y textos principales de la portada
  "/api/orders": ["POST"], // registro público de pedidos de la tienda
  "/api/applications": ["POST"], // formulario de adopción
  "/api/volunteers": ["POST"], // formulario de voluntariado
  "/api/case-reports": ["POST"], // reporte de perrito en riesgo
  "/api/case-reports/upload": ["POST"], // subida pública de fotos para reporte de perrito en riesgo
};

// Endpoints de autenticación: SOLO existen en el subdominio interno (ej. interno.localhost:3000)
const AUTH_API: Record<string, string[]> = {
  "/api/auth/login": ["POST"],
  "/api/auth/logout": ["POST"],
  "/api/auth/session": ["GET"],
};

function notFound(request: NextRequest) {
  return NextResponse.rewrite(new URL("/ruta-inexistente", request.url), { status: 404 });
}

function securityHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const loginPath = getLoginPath();
  const onAdminHost = isAdminHost(request.headers.get("host"));
  const isApi = pathname.startsWith("/api/");
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

  // =========================================================================
  // 1. DOMINIO PÚBLICO (ej. http://localhost:3000 o www.dogrescue.org)
  //    Aquí el panel, el login y las APIs administrativas NO EXISTEN (404).
  // =========================================================================
  if (!onAdminHost) {
    if (pathname === "/acceso" || pathname === loginPath || isAdminPage) {
      return notFound(request);
    }
    if (isApi) {
      const allowed = PUBLIC_API[pathname];
      if (allowed && allowed.includes(method)) {
        return NextResponse.next();
      }
      // En el dominio público, cualquier otra ruta /api (incluido /api/auth/*) devuelve 404
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.next();
  }

  // =========================================================================
  // 2. SUBDOMINIO INTERNO EXCLUSIVO (ej. http://interno.localhost:3000)
  // =========================================================================
  if (pathname === "/acceso") return notFound(request);

  // Ruta secreta de inicio de sesión dentro del subdominio interno
  if (pathname === loginPath) {
    const user = await getUserFromToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (user) return NextResponse.redirect(new URL("/admin", request.url));
    return securityHeaders(NextResponse.rewrite(new URL("/acceso", request.url)));
  }

  // APIs públicas o de login dentro del subdominio interno
  if (isApi) {
    const allowedPublic = PUBLIC_API[pathname];
    if (allowedPublic && allowedPublic.includes(method)) return NextResponse.next();
    const allowedAuth = AUTH_API[pathname];
    if (allowedAuth && allowedAuth.includes(method)) return NextResponse.next();
  }

  // Verificar sesión del personal
  const user = await getUserFromToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!user) {
    if (isApi) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    return notFound(request);
  }

  // Si ya tiene sesión en el subdominio interno y entra a "/", llevarlo directo a /admin
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isApi) {
    if (!canAccessApi(user.role, method, pathname)) {
      void writeAudit({
        actor: user.email,
        actorName: user.name,
        action: "Acceso denegado",
        detail: `${method} ${pathname} (rol ${user.role})`,
        ip: getClientIp(request),
      });
      return NextResponse.json({ error: "No tienes permiso para esta acción." }, { status: 403 });
    }

    if (user.mustChangePassword && pathname !== "/api/auth/change-password") {
      return NextResponse.json(
        { error: "Debes cambiar tu contraseña antes de continuar.", mustChangePassword: true },
        { status: 403 }
      );
    }

    if (method !== "GET" && method !== "HEAD" && pathname !== "/api/auth/change-password") {
      void writeAudit({
        actor: user.email,
        actorName: user.name,
        action: `${method} ${pathname}`,
        ip: getClientIp(request),
      });
    }
  }

  return securityHeaders(NextResponse.next());
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.[a-zA-Z0-9]+$).*)"],
};
