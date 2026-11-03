# Pedidos, adopciones, voluntariado y reportes: corrección local

## Resultado

Los cuatro módulos utilizan PostgreSQL mediante Prisma. No se modificó Neon de producción, no se importaron datos reales ni se hicieron commit, push o despliegues. La migración se ejecutó únicamente en el PostgreSQL local reservado a pruebas.

`src/data/store-orders.json` ya estaba modificado antes de esta tarea y no fue editado por esta implementación. Los JSON anteriores se conservan como respaldo; no se mezclan automáticamente con las lecturas de PostgreSQL.

## Causa y solución

Las cuatro APIs escribían primero archivos JSON. Adopciones, voluntariado y reportes intentaban después otra inserción en Prisma, ocultando errores y generando IDs diferentes entre el registro local, la base y la notificación. Las lecturas mezclaban ambos almacenes. Pedidos se almacenaba exclusivamente en JSON y algunas lecturas devolvían HTTP 200 con una lista vacía ante errores.

- Pedidos: modelo `StoreOrder`, con productos en JSONB y los mismos datos de cliente, entrega, pago, estados, guía y notas. CRUD persistente, eliminación real y 404 para IDs inexistentes.
- Adopciones: reutiliza `AdoptionApplication`. Conserva cuestionario, evaluación y relación con Dog. `dogSnapshot` permite conservar la referencia de perros del catálogo de respaldo sin insertar perros ficticios ni violar la FK.
- Voluntariado: reutiliza `Volunteer`, sin cambiar su tabla. Conserva validaciones, consentimientos, intereses, disponibilidad y evaluación.
- Reportes: reutiliza `CaseReport`, añadiendo únicamente `photos` y `adminNotes`, que antes solo existían en JSON. Conserva la foto principal, estados, urgencia y galería.
- Cada creación y su notificación se confirman en la misma transacción. Si falla la notificación, se revierte la solicitud completa.
- GET, PUT y DELETE administrativos verifican sesión, usuario activo, versión, rol y cambio obligatorio de contraseña, además del middleware y su auditoría. Los POST ciudadanos siguen siendo públicos.
- Datos inválidos reciben 400; falta de sesión 401; permisos insuficientes 403; IDs inexistentes 404; fallos de base 503. No se devuelve éxito falso ni se oculta un fallo usando JSON.
- Los alias de lectura históricos en `local-records.ts` consultan ahora PostgreSQL para estos módulos. Las exportaciones Word y los consumidores de expedientes leen los registros persistidos. La lectura de plantillas Word sigue siendo de solo lectura; no es almacenamiento de solicitudes.
- La interfaz muestra errores de pedidos/reportes y evita cerrar el editor como si hubiera guardado cuando falla la operación.

## Fotografías

La subida de reportes también escribía `public/uploads`. Ahora `ReportImage` conserva los bytes en PostgreSQL, sin servicios externos ni credenciales adicionales. El navegador envía fragmentos de 2 MB para conservar imágenes de hasta 8 MB sin una única petición grande.

Las cargas incompletas no son públicas. La continuación exige un token aleatorio, almacenado solo como hash, y un offset válido. La respuesta pública se sirve desde `/api/case-reports/images/[id]` con tipo de imagen y `nosniff`. Esa excepción GET del middleware no abre la lista privada de reportes. Se mantiene el carácter público que tenían las URLs de fotos anteriores.

## Migración necesaria

`prisma/migrations/20261102020000_orders_and_public_intake/migration.sql`:

- Crea `StoreOrder` y `ReportImage`.
- Añade `AdoptionApplication.dogSnapshot` nullable.
- Añade `CaseReport.photos` y `CaseReport.adminNotes`, con valores predeterminados para los registros anteriores.
- No elimina tablas, columnas ni registros; no contiene DROP, DELETE, TRUNCATE, UPDATE o INSERT de datos existentes.

No se crearon tablas duplicadas de adopciones, voluntarios o reportes. No se cambiaron migraciones anteriores.

## Archivos modificados/nuevos

- `prisma/schema.prisma` y la migración indicada.
- APIs: `src/app/api/orders/route.ts`, `applications/route.ts`, `volunteers/route.ts`, `case-reports/route.ts`, `case-reports/upload/route.ts` y `case-reports/images/[id]/route.ts`.
- Exportaciones: `src/app/api/applications/[id]/word/route.ts` y `src/app/api/volunteers/[id]/word/route.ts`.
- Persistencia/validación: `src/lib/intake-store.ts`, `intake-validation.ts`, `intake-response.ts`, `report-images.ts`, `order-import.ts` y `local-records.ts`.
- Frontend: `src/app/page.tsx`, `src/components/admin/StoreManager.tsx` y `CaseReportsManager.tsx`.
- `src/middleware.ts`: acceso público exclusivamente a las imágenes individuales.
- `scripts/import-orders.ts`, `package.json` y `tsconfig.staff-tools.json`.
- `tests/intake-persistence.test.cjs`, `tests/admin-http.test.cjs`, `tests/memory-prisma.cjs` y `scripts/test-postgres.mjs`.
- Este informe.

## Pruebas ejecutadas

| Comprobación | Resultado |
| --- | --- |
| `npm test` | 37 aprobadas, cero fallos, una omitida (HTTP necesita servicios). |
| `npm run test:postgres` | 37 aprobadas: autenticación 14, lema/notificaciones 12, formularios/pedidos 10 y HTTP 1. Sin omisiones. |
| TypeScript | Aprobado. |
| ESLint | Cero errores; 81 advertencias existentes. |
| Prisma generate y validate | Aprobados. |
| Build final | Aprobado. Persiste advertencia CSS existente sobre posición de `@import`. |
| `git diff --check` | Aprobado. |
| Importador de pedidos, validación offline | Archivo local válido, cero pedidos; sin acceder a la base. |

Las pruebas usan exclusivamente datos sintéticos en memoria o en `staff_auth_test`, 127.0.0.1:55439. Comprueban creación/lectura/evaluación/eliminación, notificaciones con el mismo ID persistido, errores y rollback, permisos y referencias a perros reales/del catálogo de respaldo. También verifican subida por fragmentos, bytes recuperados y rechazo de tokens incorrectos.

La prueba HTTP usa `next start`: crea registros de los cuatro tipos, elimina un pedido, reinicia el servidor y confirma que los registros restantes y las fotos siguen disponibles y que el pedido borrado no reaparece. También descarga Word de adopción/voluntariado y vuelve a comprobar lema, notificaciones y autenticación. No es una prueba contra Vercel ni una inspección de sus logs privados.

## Pedidos históricos en JSON

La herramienta opcional conserva IDs, fechas, importes, productos, estados y notas. Valida antes de escribir, es transaccional, no duplica registros idénticos y aborta ante conflictos. No modifica el archivo original ni genera notificaciones nuevas para pedidos históricos.

```powershell
# Validación local, sin conexión:
npm run orders:import -- src/data/store-orders.json

# Después de configurar privadamente ORDER_IMPORT_DATABASE_URL y ORDER_IMPORT_EXPECT_HOST:
npm run orders:import -- src/data/store-orders.json --check-db
npm run orders:import -- src/data/store-orders.json --apply
```

No se importan automáticamente archivos antiguos de solicitudes o reportes: hacerlo podría duplicar entradas que el código anterior ya había insertado con otro ID. Se conservan los originales para conciliación explícita si existen registros exclusivamente locales.

## Comandos para publicar después de autorizar

Configurar privadamente `DATABASE_URL` y `DIRECT_URL` para el destino verificado que utiliza Vercel. No reutilizar una conexión de otra rama por su nombre genérico. Los siguientes comandos no se ejecutaron en producción:

```powershell
npm ci
npx prisma migrate status
# Debe estar pendiente únicamente la migración nueva, o las pendientes ya revisadas.
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw "Falló la migración; no publicar." }

# Solo si hay pedidos históricos que trasladar:
$env:ORDER_IMPORT_DATABASE_URL = $env:DIRECT_URL
$env:ORDER_IMPORT_EXPECT_HOST = ([uri]$env:DIRECT_URL).Host
npm run orders:import -- src/data/store-orders.json --check-db
if ($LASTEXITCODE -ne 0) { throw "Conflicto de pedidos; no sobrescribir." }
npm run orders:import -- src/data/store-orders.json --apply
if ($LASTEXITCODE -ne 0) { throw "Falló la importación; no publicar." }

npm test
if ($LASTEXITCODE -ne 0) { throw "Fallaron las pruebas." }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Falló el build." }

# Solo tras autorizar el despliegue y verificar el proyecto Vercel vinculado:
npx vercel --prod
```

No usar `db push`, `migrate reset`, seeds ni cambios destructivos para resolver diferencias del historial. El despliegue mediante Git puede sustituir el último comando cuando se autorice; no hace falta usar ambos mecanismos. Los JSON privados/de datos no deben incluirse accidentalmente en un commit de código.

Después de publicar queda comprobar en el dominio real los cuatro flujos, incluida una foto grande enviada por fragmentos. Las fotos antiguas que solo existan en discos efímeros de Vercel no se recuperan con la migración; los archivos disponibles se conservan. Las cargas interrumpidas dejan fragmentos en `ReportImage`; su limpieza futura debe distinguirlos de imágenes completas que todavía usan los reportes.
