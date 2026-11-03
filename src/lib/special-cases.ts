import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { IntakeError, object } from '@/lib/intake-validation';
const statuses = ['Rehabilitado y Adoptado', 'Caso Éxito', 'En Rehabilitación', 'En Adopción'];
export function sanitizeCaseStatus(value: unknown) { return typeof value === 'string' && statuses.includes(value) ? value : 'Caso Éxito'; }
export function caseInput(input: unknown, create = false) {
  const source = object(input);
  const data: Prisma.SpecialCaseUpdateManyMutationInput = {};
  for (const key of ['name','title','subtitle','story','beforeText','afterText','location','date','image','video'] as const) {
    if (source[key] === undefined) continue;
    if (typeof source[key] !== 'string') throw new IntakeError('Texto de caso no válido.');
    const value = source[key].trim();
    if (['title','story'].includes(key) && !value) throw new IntakeError('El título y la historia son obligatorios.');
    data[key] = value;
  }
  for (const key of ['published','featured','draft'] as const) { if (source[key] !== undefined) { if (typeof source[key] !== 'boolean') throw new IntakeError('Visibilidad no válida.'); data[key] = source[key]; } }
  if (source.status !== undefined) data.status = sanitizeCaseStatus(source.status);
  if (source.gallery !== undefined) { if (!Array.isArray(source.gallery) || !source.gallery.every(v => typeof v === 'string')) throw new IntakeError('Galería no válida.'); data.gallery = source.gallery.map(v => v.trim()).filter(Boolean); }
  if (create && (!data.title || !data.story)) throw new IntakeError('El título y la historia son obligatorios.');
  return data;
}
export async function getSpecialCases(includeAll = false) {
  return prisma.specialCase.findMany({ where: { isDeleted: false, ...(includeAll ? {} : { published: true, draft: false }) }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] });
}
export async function createSpecialCase(input: unknown) {
  const patch = caseInput(input, true);
  const gallery = Array.isArray(patch.gallery) ? patch.gallery : [];
  const image = typeof patch.image === 'string' && patch.image ? patch.image : gallery[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000';
  return prisma.specialCase.create({ data: { ...patch, title: patch.title as string, story: patch.story as string, image, gallery: [...new Set([image, ...gallery])] } as Prisma.SpecialCaseCreateInput });
}
export async function updateSpecialCase(id: string, input: unknown) {
  const patch = caseInput(input);
  return prisma.$transaction(async tx => {
    const current = await tx.specialCase.findUnique({ where: { id } });
    if (!current || current.isDeleted) throw new IntakeError('Caso especial no encontrado.', 404);
    if (patch.image !== undefined || patch.gallery !== undefined) {
      const gallery = Array.isArray(patch.gallery) ? patch.gallery : current.gallery;
      const image = typeof patch.image === 'string' && patch.image ? patch.image : gallery[0] || current.image;
      patch.image = image; patch.gallery = [...new Set([image, ...gallery])];
    }
    const result = await tx.specialCase.updateMany({ where: { id, isDeleted: false }, data: patch });
    if (!result.count) throw new IntakeError('Caso especial no encontrado.', 404);
    return tx.specialCase.findUnique({ where: { id } });
  });
}
export async function deleteSpecialCase(id: string) {
  const result = await prisma.specialCase.updateMany({ where: { id, isDeleted: false }, data: { isDeleted: true, deletedAt: new Date() } });
  if (!result.count) throw new IntakeError('Caso especial no encontrado.', 404);
}
