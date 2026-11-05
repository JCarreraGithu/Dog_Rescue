import type { Prisma, Dog } from "@prisma/client";
import { prisma } from "@/lib/db";
import { IntakeError, object, choice } from "@/lib/intake-validation";
import { stringField, numberField, booleanField, dateField, imageUrl, stringList, nonemptyPatch } from "@/lib/admin-validation";
import { buildDefaultDogDocumentation, type DogDocumentation } from "@/lib/local-records";

export function dogInput(input: unknown, create = false) {
  const source = object(input), data: Prisma.DogUncheckedUpdateManyInput = {};
  for (const key of ["name", "breed", "ageCategory", "gender", "size", "temperament", "status", "rescueHistory", "healthNotes"] as const) if (source[key] !== undefined) data[key] = stringField(source[key], ["name", "ageCategory", "size", "gender", "status"].includes(key));
  if (source.photoUrl !== undefined) { data.photoUrl = imageUrl(source.photoUrl); if (!data.photoUrl) throw new IntakeError("La fotografía es obligatoria."); }
  if (source.ageYears !== undefined) data.ageYears = numberField(source.ageYears);
  if (source.isSterilized !== undefined) data.isSterilized = booleanField(source.isSterilized);
  if (source.rescueDate !== undefined) data.rescueDate = dateField(source.rescueDate);
  if (source.action === "restore" || source.isDeleted === false) { data.isDeleted = false; data.deletedAt = null; }
  if (create && (!data.name || !data.photoUrl)) throw new IntakeError("El nombre y la fotografía son obligatorios.");
  nonemptyPatch(data);
  return data;
}
export const dogRelations = { medicalRecords: { orderBy: { date: "desc" as const } } };
export async function getDogs() { return prisma.dog.findMany({ include: dogRelations, orderBy: { createdAt: "desc" } }); }
// No se expone documentación ni datos de adoptantes en el catálogo público.
export function dogView(row: Dog, staff = false) {
  const { documentation: _documentation, ...visible } = row;
  void _documentation;
  if (staff) return visible;
  return { id: row.id, name: row.name, breed: row.breed, ageCategory: row.ageCategory, ageYears: row.ageYears, gender: row.gender, size: row.size, temperament: row.temperament, status: row.status, rescueHistory: row.rescueHistory, healthNotes: row.healthNotes, photoUrl: row.photoUrl, isSterilized: row.isSterilized, medicalRecords: [] };
}
export function emptyDocumentation(dog: Dog): DogDocumentation {
  return buildDefaultDogDocumentation({ ...dog, documentation: undefined, createdAt: dog.createdAt.toISOString(), deletedAt: dog.deletedAt?.toISOString(), medicalRecords: [] });
}
export function documentationInput(input: unknown, defaults: DogDocumentation): DogDocumentation {
  const source = object(input);
  // Cada etapa conserva la estructura de la interfaz y rechaza tipos inválidos.
  const result = structuredClone(defaults);
  for (const stage of ["arrival", "rehabilitation", "adoption"] as const) {
    if (source[stage] === undefined) continue;
    const patch = object(source[stage]), target = result[stage] as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(patch)) {
      if (!Object.hasOwn(target, key)) throw new IntakeError("Campo documental desconocido.");
      if (["medicalAttachments", "followUps"].includes(key)) {
        if (!Array.isArray(value) || value.length > 200) throw new IntakeError("Lista documental inválida.");
        const ids = new Set<string>();
        target[key] = value.map(item => {
          const row = object(item), id = stringField(row.id, true);
          if (ids.has(id)) throw new IntakeError("Identificadores documentales duplicados."); ids.add(id);
          if (key === "medicalAttachments") return { id, title: stringField(row.title, true), type: choice(row.type, ["Receta", "Examen", "Certificado", "Foto Recuperación"]), url: imageUrl(row.url), date: stringField(row.date) };
          return { id, period: choice(row.period, ["Mes 1", "Mes 3", "Mes 6", "Anual"]), date: stringField(row.date), status: choice(row.status, ["Pendiente", "Verificado Óptimo", "Requiere Visita"]), notes: stringField(row.notes), ...(row.photoUrl !== undefined ? { photoUrl: imageUrl(row.photoUrl) } : {}) };
        });
      } else if (key === "beforePhotos") target[key] = stringList(value).map(imageUrl);
      else if (typeof target[key] === "boolean") target[key] = booleanField(value);
      else target[key] = key.endsWith("PhotoUrl") ? imageUrl(value) : stringField(value);
    }
  }
  result.updatedAt = new Date().toISOString();
  return result;
}
export function medicalInput(input: unknown, create = false) {
  const source = object(input), data: Prisma.MedicalRecordUncheckedUpdateManyInput = {};
  for (const key of ["type", "title", "description", "vetName"] as const) if (source[key] !== undefined) data[key] = stringField(source[key], key === "title");
  if (source.status !== undefined) data.status = choice(source.status, ["Programado", "Pendiente", "Completado", "Cancelado"]);
  if (source.date !== undefined) data.date = dateField(source.date);
  if (source.nextDueDate !== undefined) data.nextDueDate = source.nextDueDate === null || source.nextDueDate === "" ? null : dateField(source.nextDueDate);
  if (create && (!data.title || !data.date)) throw new IntakeError("El título y la fecha son obligatorios.");
  nonemptyPatch(data); return data;
}
