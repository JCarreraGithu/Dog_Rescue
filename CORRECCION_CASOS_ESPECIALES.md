# Casos especiales: eliminación persistente

## Causa y corrección

El servidor escribía `src/data/special-cases.json` y, ante un error, devolvía `DEFAULT_IMPACT_CASES`. Las dos vistas públicas también comenzaban con esos casos estáticos y descartaban respuestas vacías. El carrusel mostraba otros casos si ninguno tenía activada la opción “En Inicio”.

Ahora `SpecialCase` es la fuente de verdad en PostgreSQL. DELETE marca `isDeleted=true` y conserva `deletedAt` e historial. Las lecturas públicas y administrativas excluyen los eliminados; PUT no puede revivirlos. No hay siembra ni fallback estático durante lecturas, arranques o recargas. Una respuesta vacía se representa vacía tanto en Conócenos como en Inicio.

Se conservan textos, galería, video, estados, borrador, visibilidad y “En Inicio”. Las fotos utilizan el almacenamiento PostgreSQL existente de imágenes y cargas por fragmentos de hasta 8 MB en total, sin otra tabla de archivos ni filesystem persistente. No se cambió la persistencia del resto de los módulos.

Las rutas administrativas verifican sesión, permisos y cambio obligatorio de contraseña. `GET ?all=1` exige autenticación; ya no expone borradores a visitantes. Fallos de base devuelven 503; no se anuncia éxito si falla la escritura. El panel muestra los errores.

## Migración

`prisma/migrations/20261102030000_special_cases/migration.sql` crea únicamente `SpecialCase` y su índice. Incluye una instantánea inicial de los cinco casos del JSON existente: Arizona, Oso, Valentín, Esperanza y Campeón, preservando sus IDs y contenido.

La carga inicial sucede una sola vez al aplicar esta migración. No hay seed en el build ni en el arranque. Las inserciones usan `ON CONFLICT DO NOTHING`; no actualizan casos existentes ni tumbas de eliminaciones. Repetir `migrate deploy` después de borrar no los recrea. No se altera ninguna tabla anterior ni se elimina el JSON original.

## Archivos

- `prisma/schema.prisma` y la migración indicada.
- `src/lib/special-cases.ts` y `src/lib/special-case-upload-client.ts`.
- `src/app/api/special-cases/route.ts`, `[id]/route.ts` y `upload/route.ts`.
- `src/components/admin/SpecialCasesManager.tsx`.
- `src/components/SpecialCasesSection.tsx` y `src/components/ImpactCarousel.tsx`.
- `tests/admin-http.test.cjs`, `tests/memory-prisma.cjs` y este informe.

## Validación

- TypeScript, Prisma validate y build: aprobados.
- ESLint: cero errores y 81 advertencias existentes.
- `npm test`: 37 aprobadas, una HTTP omitida en el modo sin servicios.
- `npm run test:postgres`: 37 aprobadas con PostgreSQL local aislado y servidor Next de producción local.
- La prueba HTTP elimina los cinco casos iniciales, verifica listas vacías, crea y edita otro caso con fotografía persistente, reinicia Next y repite `prisma migrate deploy` sobre la base aislada. Comprueba que solo permanece el nuevo caso y que los anteriores siguen marcados como eliminados. Verifica también permisos y ausencia de acceso anónimo a `?all=1`.
- Los módulos de lema, notificaciones, autenticación y formularios continúan pasando sus pruebas.

No se aplicó esta migración en Neon ni se ejecutó commit, push o despliegue a Vercel.

## Publicación posterior, no ejecutada

Configurar privadamente `DATABASE_URL` y `DIRECT_URL` para la base verificada que usa el despliegue. Después de autorizar la publicación:

```powershell
npm ci
npx prisma migrate status
# Revisar que el historial anterior sea el esperado.
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw "Falló la migración; no desplegar." }
npm test
if ($LASTEXITCODE -ne 0) { throw "Fallaron las pruebas." }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Falló el build." }
npx vercel --prod
```

Si ya se usa despliegue por Git, el push autorizado puede sustituir el último comando. No ejecutar ambos mecanismos innecesariamente. No usar reset, db push ni volver a registrar la baseline para forzar diferencias de historial. La migración incorpora el contenido actual del repositorio; cualquier caso exclusivo de otra copia privada debe conciliarse antes de publicar. La comprobación en el dominio Vercel queda pendiente de ese despliegue autorizado.
