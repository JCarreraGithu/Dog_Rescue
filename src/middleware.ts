import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, getLoginPath } from "@/lib/auth";
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
  "/api/donation-needs": ["GET"], // proyección pública de necesidades, sin inventario interno
  "/api/orders": ["POST"], // registro público de pedidos de la tienda
  "/api/applications": ["POST"], // formulario de adopción
  "/api/volunteers": ["POST"], // formulario de voluntariado
  "/api/case-reports": ["POST"], // reporte de perrito en riesgo
  "/api/case-reports/upload": ["POST"], // subida pública de fotos para reporte de perrito en riesgo
};

// Operaciones de autenticación disponibles en el dominio compartido.
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

async function checkAccess(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const loginPath = getLoginPath();
  const isApi = pathname.startsWith("/api/");
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

  // El dominio compartido conserva todas las páginas públicas, incluso con sesión.
  if (!isApi && !isAdminPage && pathname !== loginPath && pathname !== "/acceso") {
    return NextResponse.next();
  }

  if (pathname === "/acceso") return notFound(request);

  // Alias del formulario; la protección depende de la sesión y los permisos.
  if (pathname === loginPath) {
    const user = await getUserFromToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (user) return securityHeaders(NextResponse.redirect(new URL("/admin", request.url)));
    return securityHeaders(NextResponse.next());
  }

  // Lista pública exacta de rutas y métodos.
  if (isApi) {
    const allowedPublic = PUBLIC_API[pathname];
    const privateDogsQuery = pathname === "/api/dogs" && request.nextUrl.searchParams.get("deletedOnly") === "true";
    if (allowedPublic && allowedPublic.includes(method) && !privateDogsQuery) return NextResponse.next();
    const allowedAuth = AUTH_API[pathname];
    if (allowedAuth && allowedAuth.includes(method)) return securityHeaders(NextResponse.next());
  }

  // Verificar sesión del personal
  const user = await getUserFromToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!user) {
    if (isApi) return securityHeaders(NextResponse.json({ error: "No autorizado" }, { status: 401 }));
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return securityHeaders(NextResponse.redirect(loginUrl));
  }

  if (isApi) {
    if (!canAccessApi(user.role, method, pathname)) {
      await writeAudit({
        actor: user.email,
        actorName: user.name,
        action: "Acceso denegado",
        detail: `${method} ${pathname} (rol ${user.role})`,
        ip: getClientIp(request),
      });
      return securityHeaders(NextResponse.json({ error: "No tienes permiso para esta acción." }, { status: 403 }));
    }

    if (user.mustChangePassword && pathname !== "/api/auth/change-password") {
      return securityHeaders(NextResponse.json(
        { error: "Debes cambiar tu contraseña antes de continuar.", mustChangePassword: true },
        { status: 403 }
      ));
    }

    if (method !== "GET" && method !== "HEAD" && pathname !== "/api/auth/change-password") {
      await writeAudit({
        actor: user.email,
        actorName: user.name,
        action: `${method} ${pathname}`,
        ip: getClientIp(request),
      });
    }
  }

  return securityHeaders(NextResponse.next());
}

export async function middleware(request: NextRequest) {
  try { return await checkAccess(request); }
  catch {
    return securityHeaders(NextResponse.json({ error: "El acceso administrativo no está disponible temporalmente." }, { status: 503 }));
  }
}

export const config = {
  runtime: "nodejs",
  matcher: ["/api/:path*", "/admin/:path*", "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
