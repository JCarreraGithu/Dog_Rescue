# Carrusel de Conócenos y Familia Fundadora

Cambios limitados a `/conocenos`, su bloque administrativo y la configuración `AboutSettings`. No se modificaron los casos especiales ni otros módulos funcionales.

## Persistencia y compatibilidad

Migración aditiva: `20261104010000_about_carousel_family`.

Agrega `carousel` y `family` como JSONB nullable a `AboutSettings`. No sobrescribe datos ni cambia las columnas existentes. Si `carousel` todavía es NULL, la API convierte la foto y los textos actuales en la primera diapositiva. Una lista guardada vacía permanece vacía: nunca se vuelve a insertar la portada original. Cada diapositiva conserva ID, URL, título, subtítulo e insignia opcional. El orden es el de la lista guardada.

La familia admite exactamente tres espacios. Inicialmente muestra Doña Odra, Primer hijo y Segundo hijo, con fotografías pendientes; no se inventaron nombres ni fotos de los hijos. Los nombres y las imágenes se configuran desde el panel.

La API conserva sus permisos administrativos y sus respuestas de validación/disponibilidad. El panel espera la carga exitosa antes de habilitar la edición y guarda cada bloque por separado, sin enviar ni sobrescribir las otras configuraciones de Conócenos.

## Presentación

- Se conserva la ubicación, proporciones, tarjeta oscura y distintivo amarillo de la portada.
- Transición de opacidad, flechas, indicadores y avance automático cada cinco segundos.
- La interacción con ratón, toque, foco o controles pausa el avance hasta recargar. Se respeta la preferencia de movimiento reducido.
- Familia entre el relato histórico y Misión/Visión/Valores: tres columnas desde `sm`, una columna en teléfonos estrechos.
- Las fotos ausentes o que fallen al cargar muestran un marcador discreto, sin iconos de imagen rota.

## Rutas de imágenes

La foto actual apunta a un archivo versionado que existe en `public/uploads/casos`; se conserva. Los tres archivos estáticos publicados están enumerados en `src/lib/about-content.ts`. Se rechazan nuevas rutas `/uploads` que no correspondan a esos recursos, para evitar referencias al filesystem efímero de otro despliegue. Las fotos nuevas pueden usar URLs persistentes externas o las URLs de imágenes públicas persistentes ya cargadas en el sistema.

Si se incorpora otro recurso estático mediante Git en el futuro, se debe verificar su archivo y actualizar la lista explícita. No se descargan URLs externas en el servidor. Si una imagen externa deja de existir, la presentación muestra el marcador; su disponibilidad futura depende de su proveedor.

## Archivos

- `prisma/schema.prisma` y la migración indicada.
- `src/lib/about-settings.ts`, `src/lib/about-content.ts`.
- `src/components/AboutHeroVisual.tsx`, `AboutPhoto.tsx`, `FoundingFamily.tsx`.
- `src/components/admin/AboutContentManager.tsx`, `SpecialCasesManager.tsx` (sustitución del bloque de portada).
- `src/app/conocenos/page.tsx` (ubicación de Familia Fundadora).
- `tests/admin-persistence.test.cjs`, `tests/admin-http.test.cjs`.

## Verificaciones

- `npm test`: 38 aprobadas, 2 omitidas por requerir servicios.
- `npm run test:postgres`: 49 aprobadas, ninguna omitida, sobre PostgreSQL local aislado.
- TypeScript, validación Prisma y build final: correctos. ESLint: 0 errores y 80 advertencias. El build conserva la advertencia CSS anterior sobre la ubicación de `@import`.

Las pruebas de PostgreSQL cubren portada heredada, agregar/editar/reordenar/eliminar diapositivas, lista vacía persistente, tres integrantes, entradas inválidas, protección administrativa y conservación de otros campos. La prueba HTTP reinicia `next start`, repite las migraciones en la base aislada y comprueba que los cambios y eliminaciones permanecen, junto con la respuesta pública de `/conocenos`.

No se ejecutaron migraciones ni importaciones en Neon. No se hizo commit, push ni despliegue.

## Publicación posterior autorizada

Configurar privadamente las conexiones Prisma del destino verificado. Ejecutar primero en desarrollo autorizado y revisar todas las migraciones pendientes con `migrate status`.

```powershell
npm ci
npx prisma migrate status
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw "Falló la migración; detener publicación" }
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Después de autorización para publicar, usar el flujo habitual de Vercel; por CLI:

```powershell
npx vercel --prod
```

Aplicar la migración antes de activar el código nuevo. No usar `db push`, reset ni seeds. Al activar el módulo, revisar la primera diapositiva heredada y configurar los nombres y fotos reales de la familia.
