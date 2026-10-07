# Cambios (copiar encima del proyecto, respetando las rutas)

## Antes de probar
1. Crea el archivo `.env` (copia de `.env.example`) con ADMIN_PASSWORD y AUTH_SECRET.
2. En Render agrega esas mismas 2 variables en Environment.
3. `npm run dev` y prueba: /acceso, /admin, /tienda, /conocenos.

## Pendientes por completar con el refugio
- src/config/site.ts        -> número real de WhatsApp
- src/data/products.ts      -> productos y precios reales (los actuales son ejemplo)
- src/data/impact-cases.ts  -> fotos/videos y casos reales (los "draft" solo se ven en desarrollo)
- src/app/conocenos/page.tsx (FAMILY) -> nombres y fotos
- src/components/Footer.tsx -> teléfono y correo (siguen siendo de ejemplo)
