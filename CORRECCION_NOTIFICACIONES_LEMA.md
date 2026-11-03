# Corrección de persistencia de notificaciones y lema

## Resultado local

Ambas funciones ahora utilizan Prisma/PostgreSQL. La migración nueva se probó únicamente en PostgreSQL local aislado. No se aplicó en Neon ni en producción, y no se hizo commit, push ni despliegue a Vercel en esta tarea.

El workspace ya tenía cambios en `src/data/admin-notifications.json` y `src/data/home-settings.json` antes de empezar. Se conservaron sin editarlos. La validación offline de esos archivos encontró una configuración válida y cuatro notificaciones válidas.

## Causas identificadas

1. `notifications.ts` leía/escribía `src/data/admin-notifications.json`. Cada alta, lectura o eliminación dependía del filesystem de la instancia. Las mutaciones reescribían la lista completa, con posibilidad de perder altas concurrentes. La API además devolvía `200 []` si fallaba la lectura, y el componente no revisaba `response.ok` al modificar notificaciones.
2. `home-settings.ts` escribía `src/data/home-settings.json`. El PUT también intentaba escribir una notificación local después de guardar el lema, por lo que podía devolver error aunque una de las dos operaciones hubiera ocurrido. La lectura ocultaba fallos devolviendo valores predeterminados. Este almacenamiento no proporciona persistencia compartida para las funciones de Vercel.

El diagnóstico se basa en las rutas y el almacenamiento del código, junto con el error reportado; no se consultaron logs privados de Vercel.

## Solución

- `Notification` conserva IDs, tipo, título, mensaje, módulo de destino, estado leído, fecha y metadata JSONB. Los cinco tipos existentes y los productores de adopciones, pedidos, voluntariado, reportes y eventos del sistema siguen usando `addNotification()` con el mismo contrato.
- Las notificaciones se insertan individualmente. Marcar como leída usa `updateMany`; eliminar usa `deleteMany`; nunca se reemplaza la lista completa ni se vuelve a cargar el JSON como fallback.
- La lista devuelve las 200 más recientes, como la vista anterior, con orden estable. Marcar todas y limpiar historial operan sobre la tabla completa. No se elimina automáticamente historial antiguo al insertar una nueva notificación.
- `HomeSettings` almacena todos los textos y las opciones de tipografía, peso, cursiva, transformación, tamaño, color/degradado y alineación. Usa una fila identificada por `home`.
- Los PUT parciales actualizan solo sus campos para conservar cambios concurrentes en otros campos. El lema y su notificación se guardan en la misma transacción: si falla cualquiera, se revierte todo.
- La API pública y el frontend usan `no-store`. Los valores predeterminados se utilizan solo si nunca se guardó una configuración; los fallos de base generan 503, no una respuesta falsa de éxito ni una configuración predeterminada que aparente haber sido guardada.
- Se validan textos, nombres de campos y opciones visuales. Datos inválidos reciben 400; IDs de notificaciones inexistentes reciben 404; un ID vacío no puede convertirse accidentalmente en "limpiar historial".
- Se conserva el middleware de autenticación, permisos y auditoría. Ambos handlers verifican también sesión vigente, rol y cambio obligatorio de contraseña. Un visitante no puede modificar contenido ni listar notificaciones; un voluntario no puede modificarlo.
- La interfaz de notificaciones muestra errores y deshabilita acciones mientras guarda. El editor del lema no carga un objeto de error como si fuera configuración ni permite editar valores predeterminados después de fallar la lectura inicial.
- Los módulos de persistencia ya no importan `fs`, `path` ni los JSON locales. `local-records.ts` no necesitó modificaciones para esta corrección.

## Archivos modificados o nuevos

Persistencia y API:

- `prisma/schema.prisma`
- `prisma/migrations/20261102010000_notifications_home_settings/migration.sql`
- `src/lib/notifications.ts`
- `src/lib/notification-types.ts` (nuevo contrato de tipos compartido)
- `src/lib/home-settings.ts`
- `src/lib/content-auth.ts`
- `src/lib/content-validation.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/home-settings/route.ts`

Frontend:

- `src/components/admin/NotificationsCenter.tsx`
- `src/components/admin/HeroSettingsManager.tsx`
- `src/app/admin/page.tsx`
- `src/app/page.tsx`

Traslado opcional y pruebas:

- `src/lib/site-content-import.ts`
- `scripts/import-site-content.ts`
- `package.json`
- `tsconfig.staff-tools.json`
- `tests/content-persistence.test.cjs`
- `tests/admin-http.test.cjs`
- `tests/memory-prisma.cjs`
- `scripts/test-postgres.mjs`
- `CORRECCION_NOTIFICACIONES_LEMA.md`

## Migración

`20261102010000_notifications_home_settings` contiene exclusivamente CREATE TABLE de `Notification` y `HomeSettings`, sus claves primarias y un índice de ordenación de notificaciones. No contiene ALTER, DROP, UPDATE, DELETE ni INSERT sobre tablas existentes. Los modelos anteriores permanecen iguales, aparte de diferencias de finales de línea del workspace.

No se añadieron dependencias ni se cambiaron las migraciones de baseline/autenticación ya preparadas.

## Verificaciones ejecutadas

| Verificación | Resultado |
| --- | --- |
| Prisma generate | Aprobado. Se liberaron procesos Next locales que bloqueaban la biblioteca antes de regenerar. |
| Prisma validate | Aprobado. |
| TypeScript y compilación de herramientas | Aprobados. |
| ESLint | Cero errores y 81 advertencias existentes; sin desactivar reglas. |
| `npm test` | 27 pruebas aprobadas, cero fallos y una omitida (HTTP requiere servicios). |
| `npm run test:postgres` | 14 pruebas de autenticación, 12 de contenido y una HTTP aprobadas, sin omisiones. Se aplicaron las tres migraciones desde cero exclusivamente en `staff_auth_test`, 127.0.0.1:55439. |
| Build de Next en producción local | Aprobado; permanece la advertencia CSS existente sobre la posición de `@import`. |
| Importador offline con los JSON actuales | Configuración y cuatro notificaciones validadas, sin acceso a base. |
| `git diff --check` | Aprobado. |

Las pruebas de contenido verifican compatibilidad de tipos/metadata, altas concurrentes, leído individual/todas, eliminación individual, limpieza completa, ausencia de reaparición al recargar, permisos 401/403, ID vacío, 404, validación visual, campos completos y parciales, errores 503 y rollback cuando falla la creación de la notificación. También verifican el traslado idempotente del contenido anterior.

La prueba HTTP utiliza `next start` contra PostgreSQL aislado. Guarda el lema, consulta su versión pública, elimina una notificación y reinicia el servidor; después comprueba que el lema permanece y que la notificación eliminada no reaparece. No se ejecutaron mutaciones de prueba en Neon o Vercel.

## Traslado opcional de los JSON existentes

No se importan durante arranques o lecturas: esto evita restaurar notificaciones borradas al recargar. Para conservar el lema personalizado y el historial anterior, se preparó una herramienta explícita, transaccional y sin sobrescrituras.

```powershell
# Solo validar, sin conectar a la base:
npm run content:import -- src/data/home-settings.json src/data/admin-notifications.json

# Comparar contra el destino configurado, sin escribir:
npm run content:import -- src/data/home-settings.json src/data/admin-notifications.json --check-db

# Traslado explícito, después de crear las dos tablas nuevas:
npm run content:import -- src/data/home-settings.json src/data/admin-notifications.json --apply
```

Los dos modos con base requieren `CONTENT_IMPORT_DATABASE_URL` y `CONTENT_IMPORT_EXPECT_HOST` en el entorno privado. No usan automáticamente las conexiones genéricas del proyecto. Conservan IDs, fechas, metadata y estado leído. Una repetición con datos idénticos no duplica; cualquier conflicto aborta toda la transacción. No modifica ni elimina archivos originales. Su uso es un traslado inicial: volver a importar manualmente un historial antiguo después de borrarlo podría recrear esas entradas; no debe añadirse al build ni al arranque.

## Comandos para publicar cuando se autorice

Precondición: configurar privadamente `DOG_RESCUE_PUBLISH_DATABASE_URL` y `DOG_RESCUE_PUBLISH_DIRECT_URL` con la base del destino elegido, y verificar que corresponda al mismo destino que usa Vercel. No pegar sus valores en el chat. Los comandos siguientes no se ejecutaron sobre Neon/producción.

```powershell
if (!$env:DOG_RESCUE_PUBLISH_DATABASE_URL -or !$env:DOG_RESCUE_PUBLISH_DIRECT_URL) {
  throw "Faltan las conexiones privadas del destino de publicación."
}
$env:DATABASE_URL = $env:DOG_RESCUE_PUBLISH_DATABASE_URL
$env:DIRECT_URL = $env:DOG_RESCUE_PUBLISH_DIRECT_URL

npm ci
if ($LASTEXITCODE -ne 0) { throw "Falló la instalación." }

# Revisar que solo esté pendiente 20261102010000_notifications_home_settings.
npx prisma migrate status
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw "Falló la migración. No desplegar." }

# Traslado inicial para conservar los JSON actuales (si se desea conservarlos).
$env:CONTENT_IMPORT_DATABASE_URL = $env:DIRECT_URL
$env:CONTENT_IMPORT_EXPECT_HOST = ([uri]$env:DIRECT_URL).Host
npm run content:import -- src/data/home-settings.json src/data/admin-notifications.json --check-db
if ($LASTEXITCODE -ne 0) { throw "Conflicto al comparar el contenido. No sobrescribir." }
npm run content:import -- src/data/home-settings.json src/data/admin-notifications.json --apply
if ($LASTEXITCODE -ne 0) { throw "Falló el traslado. No desplegar." }

npm test
if ($LASTEXITCODE -ne 0) { throw "Fallaron las pruebas." }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Falló el build." }

# Solo después de autorizar la publicación y confirmar el proyecto Vercel vinculado:
npx vercel --prod
```

Si el estado de migraciones muestra una baseline/historial diferente del esperado, no forzar `resolve`, `db push` o reset como parte de estos comandos. Esa diferencia debe revisarse por separado. Si la publicación se realiza mediante Git integrado con Vercel, el push autorizado sustituye el último comando; no hace falta ejecutar ambos mecanismos.

Las variables runtime de Vercel siguen siendo las existentes (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` y, opcionalmente, `ADMIN_LOGIN_PATH`). La herramienta de traslado no requiere variables nuevas permanentes en Vercel. Después de publicar falta verificar las dos funciones en el dominio real; las pruebas locales no certifican la conectividad del despliegue.
