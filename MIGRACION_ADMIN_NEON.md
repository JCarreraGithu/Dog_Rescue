# Migración administrativa preparada para revisión

## Estado y límites

Implementación local preparada y probada. No se aplicaron migraciones a Neon, no se importó la cuenta recuperada, no se modificaron credenciales, no se eliminaron archivos JSON originales y no se ejecutaron commit, push ni despliegues.

Las únicas cuentas creadas/importadas durante las pruebas fueron sintéticas y se usaron exclusivamente en memoria o en `staff_auth_test`, una base local aislada en `127.0.0.1:55439`. Los secretos de prueba se generan al ejecutar los tests; no están en fuentes ni fixtures versionados. El clúster, conexiones privadas y resultados locales están excluidos de Git.

## Implementación

- `StaffUser` conserva ID, nombre, correo, rol, hash scrypt, estado activo, obligación de cambiar contraseña, versión de sesión y fechas. Las fechas se almacenan como `timestamptz(3)` y se serializan a ISO UTC, compatibles con el contrato anterior.
- `AuditLog` guarda snapshots del actor para conservar el historial aunque su cuenta se elimine. Los cambios de cuenta y su auditoría se confirman en la misma transacción.
- `LoginAttempt` implementa límites compartidos en PostgreSQL: 5 intentos por cuenta y 10 por IP en 15 minutos. Reserva cada intento antes de verificar la contraseña, incluyendo solicitudes concurrentes. Un login correcto limpia sus contadores. Las claves se derivan por HMAC; la tabla no guarda correo/IP en claro. Los registros vencidos se limpian durante nuevas solicitudes.
- Las mutaciones del personal y las importaciones comparten un bloqueo transaccional de PostgreSQL, válido entre instancias de Vercel. Se vuelve a comprobar la autorización del actor dentro de la transacción. La protección del último superadministrador se conserva ante peticiones simultáneas.
- Se mantienen scrypt, firma HMAC y expiración de sesiones, `sessionVersion`, estado activo, roles, permisos, cambio obligatorio de contraseña y cookies HttpOnly/Secure/SameSite. Los helpers de las APIs ahora consultan también el usuario vigente en Prisma, además de la protección del middleware.
- No existe fallback del personal a JSON. Los fallos de base se propagan como errores; las rutas de autenticación/equipo/auditoría y el middleware responden 503 sin revelar detalles internos. Logout expira la cookie incluso si falla la base.
- Se eliminó la creación automática de superadministradores desde el login. `ADMIN_EMAIL` y `ADMIN_PASSWORD` ya no crean, actualizan ni restablecen cuentas.
- Se desactivó el registro de consultas Prisma para no enviar hashes ni parámetros a logs. El importador muestra únicamente contadores y errores redactados.
- El dominio compartido continúa funcionando. La prueba HTTP detectó que la reescritura del formulario podía reprocesarse y bloquear `/acceso`. El alias se sirve directamente mediante una ruta dinámica que solo acepta `ADMIN_LOGIN_PATH`; las demás rutas desconocidas devuelven 404. `/acceso` directo permanece bloqueado. El formulario se comparte como componente.

## Importador

El comando `npm run staff:import` compila la herramienta local y la ejecuta. No se añade al build, postinstall ni arranque de Vercel.

Modos preparados (no ejecutados con el JSON real):

```powershell
# Solo valida el archivo local. No consulta ninguna base de datos.
npm run staff:import -- 'C:\RUTA-PRIVADA\admin-users.json'

# Valida y compara contra la base, sin insertar ni actualizar cuentas.
npm run staff:import -- 'C:\RUTA-PRIVADA\admin-users.json' --check-db

# Importación explícita, para ejecutar únicamente después de aprobación.
npm run staff:import -- 'C:\RUTA-PRIVADA\admin-users.json' --apply
```

Para los dos últimos modos se requieren `STAFF_IMPORT_DATABASE_URL` y `STAFF_IMPORT_EXPECT_HOST` en el entorno privado del proceso local. No se cargan automáticamente desde `.env`; no se incluyen secretos en argumentos. Debe comprobarse también el proyecto, rama y nombre de base de destino, además del host.

El archivo debe tener ruta absoluta y estar fuera del repositorio, incluso después de resolver enlaces. Se valida tamaño, estructura `{ "users": [...] }`, campos permitidos, roles, booleanos, IDs, correos únicos/normalizados, fechas ISO UTC con milisegundos, versión entera no negativa y formato scrypt con sal de 16 bytes y resultado de 64 bytes.

No se corrigen ni se normalizan silenciosamente datos del archivo. Una fecha no canónica, correo no normalizado o campo inesperado provoca un error sin imprimir sus valores. Esto permite revisar incompatibilidades en privado antes de importar.

La comparación verifica todos los campos, incluido el hash y `sessionVersion`. Una cuenta exactamente igual se cuenta como existente y no se actualiza. Si coinciden ID o correo pero difieren los datos, toda la operación aborta. Todas las comparaciones se completan antes de insertar. No utiliza upsert ni skipDuplicates, y no modifica cuentas existentes. La inserción y su auditoría son atómicas. Si una cuenta ya cambió por uso normal, una nueva importación del archivo antiguo abortará para impedir restaurar hashes/versiones anteriores.

El JSON original permanece intacto. No se ha localizado ni leído el archivo recuperado en esta tarea: su ruta privada y validación concreta quedan pendientes. La compatibilidad con una cuenta de versión 2 se verificó con datos sintéticos; no constituye validación de la cuenta real.

## Migraciones preparadas

1. `prisma/migrations/00000000000000_baseline_existing/migration.sql`: representación del esquema anterior, necesaria porque el repositorio no tenía historial de migraciones. En una base vacía crea las tablas del refugio; **en Neon existente debe verificarse y marcarse aplicada, no ejecutar sus CREATE TABLE**.
2. `prisma/migrations/20261102000000_staff_auth/migration.sql`: crea únicamente `StaffRole`, `StaffUser`, `AuditLog`, `LoginAttempt`, sus índices y restricciones administrativas. No altera ni elimina tablas de perros, adopciones, inventario, voluntariado, reportes o transparencia.
3. `migration_lock.toml`: proveedor PostgreSQL.

Se comprobó que el texto de todos los modelos Prisma anteriores permanece igual al estado inicial de esta tarea. La migración administrativa incluye unicidad de correo, comprobación de correo normalizado, versión no negativa, formato scrypt y contador positivo.

Las dos migraciones se aplicaron desde cero únicamente en PostgreSQL local de pruebas. El esquema y el historial reales de Neon no se inspeccionaron; no debe ejecutarse `migrate deploy` en producción sin resolver antes la baseline y cualquier diferencia real de esquema.

## Resultados de verificación

| Comando / prueba | Resultado |
| --- | --- |
| `prisma generate` | Aprobado. Fue necesario liberar la biblioteca bloqueada por dos procesos Next locales de este proyecto. No se actualizaron dependencias. |
| `prisma validate` | Aprobado. |
| `tsc --noEmit` | Aprobado. |
| Compilación de herramienta (`tsconfig.staff-tools.json`) | Aprobada. |
| `npm run lint` | Código 0, cero errores. Persisten 81 advertencias existentes de imports/variables, imágenes y dependencias de hooks. No se desactivaron reglas de seguridad ni `no-explicit-any`. |
| `npm run build` | Build completo aprobado: compilación, lint, tipos, páginas y trazas. Persiste advertencia CSS existente por posición de `@import`. |
| `npm test` | 15 pruebas aprobadas, cero fallos y una omitida (HTTP requiere servicios). Incluye autenticación, middleware, importación y CLI con datos sintéticos. |
| `npm run test:postgres` | Migraciones aplicadas desde cero en PostgreSQL 18 local. 14 pruebas de Prisma aprobadas y una prueba HTTP contra `next start` aprobada, sin omisiones. |
| Modelos existentes y migración aditiva | Verificado: modelos previos intactos; SQL administrativo no altera tablas previas. |

La suite de acceso comprueba páginas públicas con/sin sesión, alias, API pública por método, APIs privadas 401, roles 403, cambio obligatorio de contraseña, tokens alterados/vencidos, usuario inactivo y versión revocada. También prueba login/session/logout, cambio real de contraseña sintética con incremento de versión, auditoría atómica, reversión ante fallo, concurrencia de superadministradores, incrementos concurrentes, importación repetida sin duplicados, conflicto sin sobrescritura y límites distribuidos.

La prueba CLI usa un archivo temporal sintético fuera del repositorio, valida sin base y comprueba errores redactados, ausencia de hashes en salida, rechazo de rutas internas y rechazo de flags contradictorios.

La prueba HTTP usa el build de producción local, cookies y una cuenta sintética de versión 2. Verifica portada, catálogo, conocenos, tienda y login 200; adopciones redirige al catálogo; `/acceso` 404; `/admin` anónimo redirige; catálogo API público; operaciones privadas anónimas 401; login correcto; cookie segura; panel autenticado 200; portada posterior al login 200 sin redirección; sesión; roles 403 y logout con expiración de cookie. No es una prueba de navegador ni de Vercel.

`npm run test:postgres` requiere binarios locales de PostgreSQL para Windows y un build actual. Puede indicarse `STAFF_TEST_POSTGRES_BIN`. Inicializa un clúster privado si no existe, genera sus credenciales localmente, rechaza URLs remotas y recrea exclusivamente `staff_auth_test` en el puerto reservado 55439. Arranca Next en el puerto 3109 para HTTP y detiene ambos servidores al terminar. No lo configure con datos reales.

## Archivos de esta implementación

Persistencia y seguridad:

- `prisma/schema.prisma`
- `prisma/migrations/00000000000000_baseline_existing/migration.sql`
- `prisma/migrations/20261102000000_staff_auth/migration.sql`
- `prisma/migrations/migration_lock.toml`
- `src/lib/db.ts`, `staff-store.ts`, `staff-types.ts`, `staff-transaction.ts`, `staff-response.ts`, `login-attempts.ts`, `staff-import.ts`, `auth.ts`
- `src/middleware.ts`
- `src/app/api/auth/login/route.ts`, `logout/route.ts`, `session/route.ts`, `change-password/route.ts`
- `src/app/api/team/route.ts`, `team/[id]/route.ts`, `audit/route.ts`
- Helpers de sesión en las rutas de applications, volunteers, inventory, home-settings, dogs (incluidos upload, medical y documentation), medical-records y products, y exportaciones Word de adopción/voluntariado.

Formulario, herramientas y pruebas:

- `src/components/admin/LoginForm.tsx`
- `src/app/acceso/page.tsx`
- `src/app/[...staffLogin]/page.tsx`
- `scripts/import-staff.ts`, `scripts/test-postgres.mjs`
- `tests/admin-access.test.cjs`, `tests/admin-http.test.cjs`, `tests/import-cli.test.cjs`, `tests/memory-prisma.cjs`
- `package.json`, `.gitignore`, `.env.example`, `tsconfig.json`, `tsconfig.staff-tools.json`, `eslint.config.mjs`
- `MIGRACION_ADMIN_NEON.md`

Correcciones de tipos para resolver ESLint, sin cambiar reglas ni datos de negocio:

- `src/lib/view-types.ts`, `local-records.ts`, `notifications.ts`
- `src/data/default-dogs.ts` (solo tipos)
- `src/app/admin/page.tsx`, `catalogo/page.tsx`, `page.tsx`
- `src/components/CartDrawer.tsx`
- `src/components/admin/CaseReportsManager.tsx`, `DogDocumentationModal.tsx`, `HeroSettingsManager.tsx`, `NotificationsCenter.tsx`, `StoreManager.tsx`
- Tipos en APIs de dogs, medical-records, orders, transparency, case-reports y exportaciones Word.
- `prisma/seed.js`: carga de Prisma mediante import dinámico compatible con su ejecución CommonJS; no se ejecutó el seed.

El workspace ya contenía los cambios de dominio compartido de la tarea anterior, incluidos `.env.example`, middleware, shell/layout, `/adopciones`, `/api/donation-needs` y el informe anterior. Se conservaron; este informe describe el estado actualizado de autenticación y reemplaza el diagnóstico de almacenamiento del informe anterior.

## Pasos pendientes antes de producción

1. Revisar esta implementación y autorizar por separado las operaciones sobre Neon.
2. Guardar una copia privada del JSON recuperado y, si existe, de `audit-log.json`. Validar el JSON de usuarios con el modo offline y revisar incompatibilidades sin pegar secretos en el chat.
3. Respaldar Neon y comprobar su proyecto/rama/base, tablas reales e historial `_prisma_migrations`. Comparar con la baseline preparada. Resolver diferencias antes de marcarla aplicada; no ejecutar seeds ni reset ni db push para forzar coincidencias.
4. Solo con autorización y baseline verificada, marcar `00000000000000_baseline_existing` aplicada mediante `prisma migrate resolve --applied 00000000000000_baseline_existing`, usando una conexión directa privada al destino correcto. Este comando modifica el historial y no se ha ejecutado en Neon.
5. Aplicar únicamente la migración administrativa pendiente mediante el flujo revisado de `prisma migrate deploy`. No añadirlo automáticamente al build de Vercel por ahora.
6. Configurar privadamente `STAFF_IMPORT_DATABASE_URL` y `STAFF_IMPORT_EXPECT_HOST` en la máquina del operador. Ejecutar primero `--check-db`, revisar contadores y después autorizar `--apply`. No publicar logs con secretos ni copiar el JSON al repositorio o despliegue.
7. Verificar privadamente que la cuenta importada conserva ID, hash, rol, estado, obligación de contraseña y versión 2. Repetir la comprobación sin escrituras. No resetear contraseñas ni forzar cambios de versión durante la importación.
8. Conservar `AUTH_SECRET` de producción si se desea mantener las sesiones existentes. Mantener `DATABASE_URL` y `DIRECT_URL` para el mismo destino aprobado. `ADMIN_LOGIN_PATH` es opcional y usa `/portal-interno` por defecto. Las antiguas variables de host y de creación inicial ya no son necesarias para este flujo. No se modificó ninguna variable de Vercel.
9. Autorizar el despliegue y comprobar login real, roles, revocación, logout y página pública en Vercel. Las pruebas locales no certifican infraestructura, permisos o conectividad de producción.
10. Mantener el JSON original como respaldo privado hasta confirmar la migración. La importación histórica de `audit-log.json` no forma parte del importador de usuarios preparado: conservarlo y decidir su traslado por separado si se necesita ese historial en el panel.

## Aspectos pendientes

- La cuenta recuperada no se ha validado todavía; su preservación exacta depende de que cumpla el formato esperado y de no encontrar conflictos en destino.
- Las mutaciones usan una transacción serializada para el equipo completo, adecuada para un equipo pequeño. Si crece considerablemente, convendrá pasar a operaciones específicas manteniendo los controles de concurrencia.
- La bitácora nueva no borra automáticamente registros históricos; la retención requiere una política separada.
- El límite por IP conserva la dependencia del encabezado del proxy existente. En producción debe comprobarse el origen efectivo de ese encabezado; el contador sí queda compartido en base de datos.
- Persisten advertencias de lint/CSS existentes. El build no está bloqueado por ellas.
