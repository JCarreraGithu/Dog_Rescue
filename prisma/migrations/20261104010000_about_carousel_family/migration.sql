-- NULL conserva la portada existente; [] es un carrusel vacío intencional.
ALTER TABLE "AboutSettings" ADD COLUMN "carousel" JSONB, ADD COLUMN "family" JSONB;
