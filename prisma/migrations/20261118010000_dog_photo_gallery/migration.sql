-- AlterTable
ALTER TABLE "Dog" ADD COLUMN "galleryPhotos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
