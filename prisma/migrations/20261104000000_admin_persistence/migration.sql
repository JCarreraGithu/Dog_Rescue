-- AlterTable
ALTER TABLE "Dog" ADD COLUMN     "documentation" JSONB,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ReportImage" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StoreProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "variantLabel" TEXT,
    "variants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "badge" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutSettings" (
    "id" TEXT NOT NULL,
    "heroImage" TEXT NOT NULL,
    "heroBadgeText" TEXT NOT NULL,
    "heroCaptionTitle" TEXT NOT NULL,
    "heroCaptionSubtitle" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AboutSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreProduct_isDeleted_createdAt_idx" ON "StoreProduct"("isDeleted", "createdAt");

-- Public catalogue snapshot: runs once; deleted products are never seeded at runtime.
INSERT INTO "StoreProduct" ("id","name","description","price","category","variantLabel","image","stock","available","featured","badge","variants") VALUES ('playera-oficial-guardianes','Playera Oficial "Guardianes de Amatitlán"','Playera 100% algodón peinado de alta calidad con el logo oficial de DOG rescue Guatemala en pecho y espalda. Ideal para jornadas y uso diario.',110,'Playeras','Talla','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',25,true,true,'Más Vendida',ARRAY['S','M','L','XL']::TEXT[]) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "StoreProduct" ("id","name","description","price","category","variantLabel","image","stock","available","featured","badge","variants") VALUES ('playera-adopta-no-compres','Playera Edición Especial "Adopta un Amigo"','Diseño exclusivo ilustrado que promueve la adopción responsable. Cada playera financia vacunas y desparasitaciones para un rescatado.',120,'Playeras','Talla','https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',18,true,true,'Edición Especial',ARRAY['S','M','L','XL']::TEXT[]) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "StoreProduct" ("id","name","description","price","category","variantLabel","image","stock","available","featured","badge","variants") VALUES ('playera-voluntario-corazon','Playera "Huellitas del Corazón"','Corte cómodo y fresco en tono claro con estampado artístico de huellitas. Perfecta para apoyar la causa y difundir el mensaje.',100,'Playeras','Talla','https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800',15,true,false,'100% Solidaria',ARRAY['XS','S','M','L']::TEXT[]) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "StoreProduct" ("id","name","description","price","category","variantLabel","image","stock","available","featured","badge","variants") VALUES ('paleta-dulce-artesanal','Paleta de Dulce Artesanal Solidaria','Deliciosas paletas de caramelo artesanal con sabores frutales tradicionales. ¡Endulza tu día en Amatitlán o pídelas por envío mientras ayudas a llenar los platitos del refugio!',10,'Paletas','Sabor','https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&q=80&w=800',60,true,true,'Dulce Solidario',ARRAY['Fresa','Cereza','Mango','Sandía','Uva']::TEXT[]) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "StoreProduct" ("id","name","description","price","category","variantLabel","image","stock","available","featured","badge","variants") VALUES ('pack-familiar-paletas','Pack Surtido de 6 Paletas de Dulce','Bolsita surtida con 6 paletas de caramelo artesanal de tus sabores favoritos para compartir o regalar. Equivale a 3 días de alimento para un perrito rescatado.',50,'Paletas','Combinación','https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&q=80&w=800',30,true,true,'Ahorro Solidario',ARRAY['Surtido Frutal','Surtido Dulce Tradicional','Mix Favoritos (Fresa/Cereza/Mango)']::TEXT[]) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "StoreProduct" ("id","name","description","price","category","variantLabel","image","stock","available","featured","badge","variants") VALUES ('paleta-caramelo-corazon','Paleta de Caramelo "Corazón Perruno"','Paletas de dulce macizo multicolor en presentación especial para regalo o jornadas de adopción. Fáciles de transportar y enviar a todo el país.',12,'Paletas','Sabor','https://images.unsplash.com/photo-1514517521153-1be72277b32f?auto=format&fit=crop&q=80&w=800',45,true,false,'Edición Dulce',ARRAY['Tutti Frutti','Frambuesa Azul','Manzana Verde','Mango con Chamoy']::TEXT[]) ON CONFLICT ("id") DO NOTHING;

-- Existing public About settings; never overwritten after the migration.
INSERT INTO "AboutSettings" ("id","heroImage","heroBadgeText","heroCaptionTitle","heroCaptionSubtitle") VALUES ('about','/uploads/casos/804959185_1072879375603903_6252243748483-1793169771622.jpg','Amor animalista desde 2020','DOG rescue Guatemala','Salvando vidas con amor y dignidad') ON CONFLICT ("id") DO NOTHING;
