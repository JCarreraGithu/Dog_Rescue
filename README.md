# 🐶 Refugio DOG Rescue Guatemala (Amatitlán)

Sistema web integral para la gestión de rescates, expedientes caninos, catálogo digital de adopciones, agenda médica, control de inventario y voluntariado en Amatitlán, Guatemala sin fines de lucro.

---

## 🛠️ Tecnologías Utilizadas

- **Fullstack Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Estilos & UI**: Tailwind CSS v4 + Lucide Icons
- **Base de Datos**: SQLite con Prisma ORM
- **Reportes & Estadísticas**: Recharts
- **Documentación / Fichas**: Impresión y exportación formateada de Expedientes Caninos en PDF

---

## 🚀 Guía de Instalación y Ejecución Local

Para clonar y ejecutar el proyecto en tu computadora local:

```bash
# 1. Clonar el repositorio
git clone https://github.com/ericocastro-Arch/refugio-de-Perros.git

# 2. Entrar a la carpeta del proyecto
cd refugio-de-Perros

# 3. Instalar dependencias de Node.js
npm install

# 4. Inicializar la base de datos SQLite con Prisma
npx prisma db push

# 5. Cargar los datos de prueba iniciales (Amatitlán)
node prisma/seed.js

# 6. Iniciar el servidor local de desarrollo
npm run dev
```

Abre en tu navegador:
- **Portal Público**: `http://localhost:3000`
- **Catálogo Digital**: `http://localhost:3000/catalogo`
- **Panel Administrativo**: `http://localhost:3000/admin`

---

## 🌿 Flujo de Trabajo en Equipo (Branching Strategy)

Para trabajar de manera organizada en equipo y mantener la estabilidad del proyecto:

1. **Rama `main`**: Contiene la versión estable de producción. **Protegida contra cambios directos**.
2. **Rama `dev`**: Rama principal de desarrollo conjunto.
3. **Ramas de Funcionalidad (`feature/...`)**: Cada compañero debe crear una rama para la tarea que va a desarrollar:

```bash
# Crear y cambiarte a una nueva rama de trabajo
git checkout -b feature/mi-nueva-funcionalidad

# Guardar cambios en tu rama
git add .
git commit -m "feat: descripción de los cambios realizados"

# Subir tu rama a GitHub
git push -u origin feature/mi-nueva-funcionalidad
```

4. **Pull Request (PR)**:
   - Abre un Pull Request en GitHub de tu rama hacia `dev` o `main`.
   - Revisa el código con tu equipo antes de fusionar (Merge).

---

## 📂 Estructura del Proyecto

```text
refugio-de-Perros/
├── prisma/
│   ├── schema.prisma   # Modelos relacionales de datos (Perros, Inventario, Voluntarios, etc.)
│   └── seed.js         # Script de sembrado de datos iniciales
├── src/
│   ├── app/
│   │   ├── admin/      # Panel Administrativo (Expedientes, Agenda, Inventario, Adoptantes)
│   │   ├── api/        # Rutas de API RESTful (Dogs, Inventory, Volunteers, Applications, Case Reports)
│   │   ├── catalogo/   # Catálogo Digital de Adopciones con Filtros
│   │   ├── layout.tsx  # Root Layout con Navbar y Footer
│   │   └── page.tsx    # Landing Page Pública (Hero, Transparencia, Voluntariado, Reporte de Caso)
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── lib/
│       └── db.ts       # Singleton Client de Prisma
└── package.json
```
