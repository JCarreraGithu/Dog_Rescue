# Corrección integral de persistencia administrativa

Implementación local del 4 de noviembre de 2026. No se ejecutaron operaciones sobre Neon, ni commit, push o despliegue.

## Resultado de la revisión

| Módulo | Problema encontrado | Solución |
| --- | --- | --- |
| Productos de tienda | Lectura/escritura JSON; los errores de escritura se ocultaban; catálogo predeterminado reaparecía al quedar vacío. | `StoreProduct` en Prisma, creación UUID, edición parcial, eliminación lógica, stock con bloqueo por fila; catálogo público sin respaldo estático. Se conservan categorías, precios, variantes, fotos por URL, disponibilidad y destacados. |
| Pedidos | Ya persistían en `StoreOrder`. | Se conserva su implementación y se prueba su regresión. No se cambia el flujo existente de reserva/descuento de existencias. |
| Expedientes caninos | Escribían primero JSON; intentaban además PostgreSQL con otro identificador; los errores de Neon devolvían datos locales o éxitos falsos. | Solo `Dog`, conservando sus identificadores existentes; lectura, creación, edición, papelera y restauración persistentes. |
| Documentación y adoptantes del expediente | Etapas, fotos de contratos y seguimientos estaban dentro de JSON local. | Campo JSONB `Dog.documentation`; validación de estructura, notificación y cambio de estado en transacción. La documentación no se expone en el catálogo público. |
| Agenda médica | Doble escritura JSON/Prisma con fallback silencioso. | Solo `MedicalRecord`, con validación de fechas y estados, incluido cancelar/completar y `nextDueDate`. |
| Inventario | Ya usaba Prisma, pero los incrementos podían sobrescribirse; errores de BD respondían 500. | Bloqueo de fila para incrementos concurrentes; validaciones y respuestas 400/401/403/404/503. Endpoint privado también protege directamente sus handlers. |
| Cifras de impacto | Doble escritura y respaldo JSON; errores silenciados. | Solo `TransparencyStat`; actualizaciones individuales o múltiples, transacción y clave única existente. |
| Conócenos | Configuración de portada escrita en archivo local. | Singleton `AboutSettings`, edición parcial y consultas sin caché. |
| Fotografías y adjuntos caninos | Escritura en `public/uploads` durante peticiones. | Reutiliza `ReportImage` en PostgreSQL, carga por fragmentos de 2 MB hasta 8 MB y comprobación del formato. Contratos y adjuntos nuevos se cargan privados, con lectura autenticada y `private, no-store`. Fotos de catálogo siguen siendo públicas. |
| Voluntarios, solicitudes de adopción, reportes de riesgo, equipo, auditoría, notificaciones, lema y casos especiales | Ya usaban PostgreSQL. | Se mantienen. Se elimina únicamente el respaldo estático de perros en solicitudes de adopción para impedir postular a un registro retirado/inexistente. Los Word consultan Prisma y aplican permisos/cambio obligatorio de contraseña también dentro del handler; errores de disponibilidad responden 503 sin registrar datos privados. |

No quedan escrituras persistentes a filesystem en `src`. La lectura de plantillas Word es un recurso estático del despliegue. `localStorage` solo conserva el carrito del navegador.

## Migración pendiente

`prisma/migrations/20261104000000_admin_persistence/migration.sql`

- Crea únicamente `StoreProduct` y `AboutSettings`.
- Agrega `Dog.documentation` (JSONB) y `Dog.isArchived`, y `ReportImage.isPrivate`.
- Conserva todos los campos, tablas y relaciones existentes.
- Copia una sola vez los 6 productos del JSON público actual y la portada actual de Conócenos, preservando sus identificadores; `ON CONFLICT DO NOTHING`.
- No crea perros de demostración ni reinicializa datos durante peticiones o arranques.
- La eliminación definitiva de la papelera retira el expediente de las listas mediante `isArchived`; conserva documentación, registros médicos y relaciones en vez de borrarlos en cascada.

Las migraciones anteriores no se modificaron.

## Recuperación de información local

Se conservan los JSON y los archivos originales. Antes de activar el código sobre una base real, hay que conciliar cualquier expediente/documentación que exista únicamente en una copia local.

Herramienta nueva: `scripts/import-admin-content.mjs` (`npm run admin:import`).

- Sin opciones: valida offline; no consulta PostgreSQL ni carga `.env`.
- `--check-db`: compara sin escribir.
- `--apply`: importa en transacción, con bloqueo asesor y por expediente; no sobrescribe conflictos.
- Conserva IDs, datos documentales, fechas disponibles y registros médicos; no importa cuentas ni credenciales.
- Rechaza solicitudes anidadas para que se concilien expresamente en lugar de omitirlas.
- Si hay URLs `/uploads/`, necesita la copia local de `public`; valida rutas y formatos, guarda los bytes en PostgreSQL y reemplaza esas referencias por URLs persistentes. Las referencias documentales se guardan privadas.
- Usa exclusivamente `ADMIN_IMPORT_DATABASE_URL` y verifica `ADMIN_IMPORT_EXPECT_HOST`; nunca toma `DATABASE_URL` como respaldo. Solo informa contadores y errores genéricos.
- Es idempotente; si una fila existente difiere, cancela toda la transacción para revisión, sin borrar información ni sobrescribirla.

Ejemplos PowerShell, para ejecutar únicamente sobre el destino expresamente autorizado y con variables privadas ya configuradas:

```powershell
npm run admin:import -- "RUTA_PRIVADA\dogs.json"
npm run admin:import -- "RUTA_PRIVADA\dogs.json" --check-db "RUTA_PRIVADA\public"
# Solo después de revisar la comparación:
npm run admin:import -- "RUTA_PRIVADA\dogs.json" --apply "RUTA_PRIVADA\public"
```

La validación offline del archivo actual `src/data/dogs.json` reconoció 7 expedientes. No se importaron a Neon. Si hay diferencias entre PostgreSQL y el JSON, hay que conciliarlas en una copia privada antes de aplicar la importación. No se cambia automáticamente el contenido existente de Neon para hacerlo coincidir con un respaldo antiguo.

Los archivos ya perdidos en el filesystem efímero de un despliegue anterior no pueden recuperarse desde el código: deben rescatarse de una copia existente o volver a adjuntarse. Las imágenes estáticas ya versionadas en `public/uploads/casos` se conservan.

## Verificación

- `npm test`: 38 aprobadas; 2 omitidas porque requieren PostgreSQL/servidor. Esas suites se ejecutan en `test:postgres`.
- `npm run test:postgres`: 48 aprobadas, sin omisiones, en `127.0.0.1:55439`, base exclusiva `staff_auth_test`.
- Incluye CRUD de productos, perros, agenda e inventario; documentos; configuración; incrementos simultáneos; importación sin duplicados/conflictos; permisos; rollback por fallo de notificación; respuestas 400/401/403/404/503; fotos públicas y privadas.
- Prueba HTTP con `next start`: reinicia el servidor y repite `migrate deploy` sobre la base aislada, comprobando persistencia y ausencia de reinicialización.
- TypeScript, validación Prisma, ESLint y build se verifican localmente. ESLint conserva 81 advertencias existentes; no se desactivaron reglas. El build mantiene la advertencia CSS previa sobre posición de `@import`.

## Publicación posterior, no ejecutada

1. Respaldar/copiar los JSON y adjuntos locales y revisar el diff y la migración nueva.
2. Configurar privadamente `DATABASE_URL` y `DIRECT_URL` para el destino autorizado. Confirmar el destino antes de ejecutar comandos de migración. Las herramientas de importación usan sus propias variables verificadas.
3. Aplicar y probar primero en una rama de desarrollo autorizada. Para validar automáticamente se dispone del PostgreSQL aislado local.
4. Con autorización para el destino final:

```powershell
npm ci
npx prisma migrate status
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw "Detener publicación: falló migrate deploy" }
# Revisar/importar los expedientes locales pendientes con la herramienta anterior.
npm test
npx tsc --noEmit
npm run lint
npm run build
```

5. Después de verificar datos y permisos, publicar mediante el flujo habitual de Vercel autorizado. Verificar creación/edición/eliminación, recarga y fotos en el despliegue real. No se ejecutaron aquí comandos de despliegue.

No ejecutar `db push`, `migrate reset`, seeds ni volver a registrar la baseline. El cambio necesita la migración antes de activar las rutas nuevas.

## Archivos principales

- Esquema y migración Prisma indicados arriba.
- `src/lib/store.ts`, `dog-store.ts`, `admin-validation.ts`, `local-records.ts`, `about-settings.ts`.
- APIs: productos, perros, documentación, agenda, inventario, transparencia, Conócenos y carga/lectura de imágenes.
- Frontend: `StoreManager`, `DogDocumentationModal`, panel, tienda, catálogo e inicio; cliente compartido de cargas fragmentadas.
- Rutas Word: permisos y errores; `content-validation.ts` / `refuge-name.ts`: imports relativos para que las herramientas offline compiladas sigan funcionando.
- `scripts/import-admin-content.mjs`, `scripts/test-postgres.mjs`, `package.json`.
- Pruebas nuevas `tests/admin-persistence.test.cjs` y ampliaciones en pruebas HTTP e ingreso público.
