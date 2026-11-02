# Acceso administrativo en dominio compartido

> Informe de la tarea anterior. La implementación actual de persistencia, el alias de login y sus verificaciones se describen en `MIGRACION_ADMIN_NEON.md`; los resultados y pendientes de abajo corresponden al estado previo a esa migración local.

## Causa

El middleware aplicaba dos modos excluyentes al dominio entero: el público rechazaba login, panel y APIs privadas con 404; el administrativo exigía sesión incluso para páginas públicas y redirigía `/` a `/admin`. Incluir el dominio público en `ADMIN_ALLOWED_HOSTS` activaba el segundo comportamiento.

## Solución local

- Se eliminó `isAdminHost()` y su dependencia de `ADMIN_ALLOWED_HOSTS` y `ADMIN_SUBDOMAIN`. El acceso se decide por ruta y método en todos los hosts del despliegue.
- `/portal-interno` reescribe internamente a `/acceso`; acceder directamente a `/acceso` sigue devolviendo 404.
- `/admin` y sus descendientes exigen sesión válida. Sin sesión redirigen al formulario con `next`; las APIs privadas devuelven 401. Los permisos y el cambio obligatorio de contraseña siguen devolviendo 403.
- Se conservan firma, expiración, usuario activo, versión de sesión, roles, cookies HttpOnly/Secure/SameSite y auditoría. No se modificaron contraseñas, cuentas ni almacenamiento real.
- `/` y las páginas públicas no consultan la sesión ni redirigen al panel. La presentación pública tampoco depende del host.
- Se restringió el destino `next` al segmento `/admin` y sus descendientes, sin barras inversas ni saltos de línea.
- La papelera (`GET /api/dogs?deletedOnly=true`) requiere sesión; el catálogo normal sigue siendo público.
- Los matchers cubren APIs y panel incluso si una ruta contiene una extensión de archivo.
- La revisión de fetch públicos encontró `/apoyanos` consultando `/api/inventory`, que es privado. Ahora usa `/api/donation-needs`, una proyección GET con selección explícita de id, nombre, categoría, cantidad y umbral. El inventario administrativo conserva sus permisos. No se añadieron métodos públicos de modificación.
- La ruta real del catálogo era `/catalogo`. Se añadió `/adopciones` como redirección a esa página.
- Se añadió configuración ESLint no interactiva y script `npm test`; no había suite automatizada ni configuración ESLint en el repositorio.

## Archivos modificados o nuevos

- `src/middleware.ts`
- `src/lib/auth.ts`
- `src/components/PublicShell.tsx`
- `src/app/layout.tsx`
- `src/app/acceso/page.tsx`
- `src/app/apoyanos/page.tsx`
- `src/app/adopciones/page.tsx` (nuevo)
- `src/app/api/donation-needs/route.ts` (nuevo)
- `.env.example`
- `package.json`
- `eslint.config.mjs` (nuevo)
- `tests/admin-access.test.cjs` (nuevo)
- `INFORME_ACCESO_ADMIN.md` (nuevo)

Se revisaron `permissions.ts`, `staff-store.ts`, las cuatro rutas de autenticación, el panel y sus peticiones, sin cambiar modelos Prisma, migraciones, datos ni credenciales. `getLoginPath()` continúa usándose en middleware, layout y logout. Las antiguas variables de host ya no se consultan.

## Verificaciones ejecutadas

| Verificación | Resultado y alcance |
| --- | --- |
| `npm test` | 7 pruebas aprobadas (una prueba principal y seis subpruebas). Ejecuta middleware, firma de sesiones, almacén de personal y handlers de login/session/logout reales con archivos en memoria y credenciales ficticias. No conecta a Neon ni modifica `src/data`. |
| Páginas públicas anónimas y con sesión | Middleware permite `/`, `/catalogo`, `/adopciones`, `/conocenos` y `/tienda`, con variable de host vacía o con el antiguo dominio configurado. No valida renderizado de página. |
| Formulario y panel | Reescritura del alias correcta, `/acceso` directo 404, panel anónimo 307 al login, panel con sesión permitido, login con sesión redirige al panel sin ciclo en la lógica probada. |
| Catálogo y formularios públicos | Middleware permite GET del catálogo y productos, POST de pedidos, adopciones, voluntariado y carga de reportes. No se enviaron formularios reales. |
| APIs administrativas anónimas | 401 en creación de perros, papelera, inventario, equipo, cambio de contraseña y ruta con extensión. |
| Roles y contraseña obligatoria | 403 para escritura del voluntario y equipo/auditoría sin rol suficiente; contraseña pendiente impide inventario y permite el endpoint de cambio. |
| Integridad de sesión | Token alterado, vencido, versión revocada y usuario inactivo rechazados con 401. |
| Login y logout | Login con contraseña ficticia correcta emite cookie HttpOnly/SameSite; sesión devuelve el usuario; logout emite Max-Age=0 y registra auditoría. Cookie Secure comprobada con configuración de producción. Tras quitar cookie, panel redirige al login. No se prueba el borrado de cookies en un navegador real. |
| Público después de login | Middleware permite `/` sin Location usando la cookie emitida por el login de prueba. |
| `npx tsc --noEmit` | Aprobado, incluida repetición después de los cambios finales. |
| ESLint de los archivos fuente modificados y configuración | Aprobado sin salida, código 0. |
| `npm run lint` | Falló: primera ejecución reportó 86 errores y 82 advertencias. Predominan `any` existentes en panel, APIs y componentes; también un `require` en seed. Se corrigió la advertencia nueva de exportación anónima de configuración. No se relajaron reglas para ocultar errores existentes. |
| `npm run build` | Primer intento: EPERM en `.next/types`. Segundo intento con permisos ampliados: compilación webpack aprobada; build completo falló por los errores globales de ESLint. También hay advertencia CSS por posición de `@import`. No hay build de producción aprobado. |
| Navegación HTTP local | Se inició Next dev en puerto 3100. Las peticiones fallaron por conexión, incluidas pruebas a 127.0.0.1 con ETIMEDOUT. No se verificaron respuestas HTTP de páginas, catálogo real ni Neon. Servidor de prueba detenido. |
| `git diff --check` | Aprobado; solo advertencias de conversión LF/CRLF. |

## Variables para Vercel

- Conservar el `AUTH_SECRET` existente, largo y aleatorio de al menos 32 caracteres. Cambiarlo invalidaría sesiones.
- `ADMIN_LOGIN_PATH=/portal-interno` o dejarla ausente para usar ese valor por defecto. Un valor personalizado cambia la ruta del formulario.
- `ADMIN_ALLOWED_HOSTS` y `ADMIN_SUBDOMAIN`: no son necesarias y este código ya no las utiliza. No se modificaron en Vercel.
- Conservar `DATABASE_URL` y las demás variables existentes de PostgreSQL/Neon. No se cambiaron ni se mostraron secretos.
- `ADMIN_EMAIL` y `ADMIN_PASSWORD` siguen siendo exclusivamente configuración inicial si no existen usuarios; no sustituyen las cuentas guardadas ni deben usarse para restablecerlas.
- `NODE_ENV=production` lo administra Next/Vercel y activa Secure en cookies.

## Pendientes y riesgos

1. **Persistencia de personal en Vercel:** `staff-store.ts` usa archivos `src/data/admin-users.json` y `audit-log.json`, no Prisma/Neon. Login actualiza `lastLoginAt` mediante escritura de archivo; cambio de contraseña y gestión de equipo también escriben allí. El filesystem del despliegue de Vercel no ofrece persistencia escribible adecuada para estas cuentas. El cambio de rutas no resuelve esta dependencia: no se puede garantizar login operativo en Vercel sin resolverla. Se dejó intacta para respetar modelos, migraciones, cuentas y credenciales; requiere una decisión separada de almacenamiento persistente y preservación de cuentas.
2. El bloqueo de intentos de login existente es en memoria por instancia; no es distribuido entre funciones de Vercel.
3. Es necesario corregir los errores globales de lint antes de obtener un build completo aprobado con la configuración añadida.
4. Pendiente validación HTTP/navegador y con datos reales en un entorno autorizado. No se certifica funcionamiento de producción ni login con credenciales existentes.
5. El nuevo endpoint de necesidades publica los campos que ya intentaba mostrar `/apoyanos`; no expone el resto del inventario. Su consulta a Neon no se pudo comprobar mediante HTTP.
6. El panel queda disponible para autenticación en los hosts donde se despliegue esta versión, incluidos previews; los hosts ya no son una barrera adicional. Sesión, roles y permisos siguen siendo obligatorios.

No se ejecutaron commits, push, despliegues ni cambios de variables de producción.
