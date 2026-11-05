import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { addNotification } from '@/lib/notifications';
import { checkContentAccess } from '@/lib/content-auth';
import { getApplications, applicationView, dogInclude } from '@/lib/intake-store';
import { body, id, text, age, choice, APPLICATION_STATUSES, IntakeError } from '@/lib/intake-validation';
import { intakeFailure, intakeHeaders as headers } from '@/lib/intake-response';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { const denied = await checkContentAccess(request, '/api/applications'); if (denied) return denied; return NextResponse.json(await getApplications(), { headers }); }
  catch (error) { return intakeFailure(error); }
}
export async function POST(request: Request) {
  try {
    const data = await body(request); const applicantName = text(data.applicantName), applicantPhone = text(data.applicantPhone), applicantAge = age(data.applicantAge), dogId = id(data.dogId);
    if (!applicantName || !applicantPhone) throw new IntakeError('Completa todos los campos de la solicitud correctamente.');
    for (const key of ['petsAllowed', 'safeHome', 'enoughSpace', 'knowsFiveFreedoms', 'commitsToWelfare', 'commitsToSterilize']) if (typeof data[key] !== 'boolean') throw new IntakeError('Completa todos los campos de la solicitud correctamente.');
    const petAccess = choice(data.petAccess, ['Todos', 'Algunos']);
    const application = await prisma.$transaction(async tx => {
      const dog = await tx.dog.findUnique({ where: { id: dogId } });
      if (!dog || dog.isDeleted || dog.isArchived) throw new IntakeError('Perrito no encontrado en el catálogo.', 404);
      const info = dog;
      const row = await tx.adoptionApplication.create({ data: { dogId: dog ? dog.id : null, dogSnapshot: { id: dogId, name: info.name, photoUrl: info.photoUrl }, applicantName, applicantPhone, applicantAge, petAccess, petsAllowed: data.petsAllowed as boolean, safeHome: data.safeHome as boolean, enoughSpace: data.enoughSpace as boolean, knowsFiveFreedoms: data.knowsFiveFreedoms as boolean, commitsToWelfare: data.commitsToWelfare as boolean, commitsToSterilize: data.commitsToSterilize as boolean, status: 'En Evaluación' }, include: dogInclude });
      await addNotification({ type: 'adoption', title: 'Nueva Solicitud de Adopción: ' + info.name, message: applicantName + ' (' + applicantAge + ' años • Tel: ' + applicantPhone + ') envió postulación para adoptar a ' + info.name + ' y aceptó el Acta de Compromiso.', targetTab: 'applications', metadata: { applicationId: row.id, dogId, dogName: info.name, applicantName, applicantPhone } }, tx);
      return applicationView(row);
    });
    return NextResponse.json(application, { status: 201, headers });
  } catch (error) { return intakeFailure(error); }
}
export async function PUT(request: Request) {
  try {
    const denied = await checkContentAccess(request, '/api/applications'); if (denied) return denied;
    const data = await body(request); const applicationId = id(data.id), status = choice(data.status, APPLICATION_STATUSES);
    const row = await prisma.adoptionApplication.update({ where: { id: applicationId }, data: { status, ...(typeof data.evaluatorNotes === 'string' ? { evaluatorNotes: data.evaluatorNotes } : {}) }, include: dogInclude });
    return NextResponse.json(applicationView(row), { headers });
  } catch (error) { return intakeFailure(error); }
}
export async function DELETE(request: Request) {
  try { const denied = await checkContentAccess(request, '/api/applications'); if (denied) return denied; const result = await prisma.adoptionApplication.deleteMany({ where: { id: id(new URL(request.url).searchParams.get('id')) } }); if (!result.count) throw new IntakeError('Solicitud no encontrada.', 404); return NextResponse.json({ ok: true }, { headers }); }
  catch (error) { return intakeFailure(error); }
}
