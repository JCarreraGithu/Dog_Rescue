import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { addNotification } from '@/lib/notifications';
import { checkContentAccess } from '@/lib/content-auth';
import { getVolunteers } from '@/lib/intake-store';
import { body, id, text, age, choice, DAYS, AREAS, COMMITMENTS, IntakeError } from '@/lib/intake-validation';
import { intakeFailure, intakeHeaders as headers } from '@/lib/intake-response';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { const denied = await checkContentAccess(request, '/api/volunteers'); if (denied) return denied; return NextResponse.json(await getVolunteers(), { headers }); }
  catch (error) { return intakeFailure(error); }
}
export async function POST(request: Request) {
  try {
    const data = await body(request), name = text(data.name), phone = text(data.phone), years = age(data.age);
    if (!name || !phone || data.acceptsSafetyRules !== true || data.authorizesDataUse !== true) throw new IntakeError('Completa correctamente los campos obligatorios.');
    if (!Array.isArray(data.availableDays) || !data.availableDays.length || !Array.isArray(data.interestAreas) || !data.interestAreas.length) throw new IntakeError('Selecciona los días y áreas de interés.');
    const availableDays = data.availableDays.map(day => choice(day, DAYS)), interestAreas = data.interestAreas.map(area => choice(area, AREAS)), commitmentDuration = choice(data.commitmentDuration, COMMITMENTS);
    const row = await prisma.$transaction(async tx => {
      const volunteer = await tx.volunteer.create({ data: { name, phone, age: years, email: text(data.email), municipality: text(data.municipality), availableDays, commitmentDuration, interestAreas, animalExperience: text(data.animalExperience), motivation: text(data.motivation), acceptsSafetyRules: true, authorizesDataUse: true, status: 'En Evaluación' } });
      await addNotification({ type: 'volunteer', title: 'Nueva Postulación de Voluntariado: ' + name, message: name + ' (' + years + ' años • Tel: ' + phone + ') se postuló para: ' + interestAreas.join(', '), targetTab: 'volunteers', metadata: { volunteerId: volunteer.id } }, tx);
      return volunteer;
    });
    return NextResponse.json(row, { status: 201, headers });
  } catch (error) { return intakeFailure(error); }
}
export async function PUT(request: Request) {
  try { const denied = await checkContentAccess(request, '/api/volunteers'); if (denied) return denied; const data = await body(request); const row = await prisma.volunteer.update({ where: { id: id(data.id) }, data: { status: choice(data.status, ['Aprobado', 'Rechazado']), ...(typeof data.evaluatorNotes === 'string' ? { evaluatorNotes: data.evaluatorNotes.trim() } : {}) } }); return NextResponse.json(row, { headers }); }
  catch (error) { return intakeFailure(error); }
}
export async function DELETE(request: Request) {
  try { const denied = await checkContentAccess(request, '/api/volunteers'); if (denied) return denied; const result = await prisma.volunteer.deleteMany({ where: { id: id(new URL(request.url).searchParams.get('id')) } }); if (!result.count) throw new IntakeError('Solicitud no encontrada.', 404); return NextResponse.json({ ok: true }, { headers }); }
  catch (error) { return intakeFailure(error); }
}
