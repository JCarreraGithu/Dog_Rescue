import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { addNotification } from '@/lib/notifications';
import { checkContentAccess } from '@/lib/content-auth';
import { getReports } from '@/lib/intake-store';
import { body, id, text, choice, REPORT_STATUSES, URGENCIES, IntakeError } from '@/lib/intake-validation';
import { intakeFailure, intakeHeaders as headers } from '@/lib/intake-response';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { const denied = await checkContentAccess(request, '/api/case-reports'); if (denied) return denied; return NextResponse.json(await getReports(), { headers }); }
  catch (error) { return intakeFailure(error); }
}
export async function POST(request: Request) {
  try {
    const data = await body(request); const reporterName = text(data.reporterName, 'Ciudadano'), reporterPhone = text(data.reporterPhone), locationAddress = text(data.locationAddress, 'Amatitlán'), description = text(data.description);
    if (!reporterPhone || !locationAddress || !description) throw new IntakeError('Completa teléfono, ubicación y descripción del reporte.');
    const rawPhotos = Array.isArray(data.photos) ? data.photos : typeof data.photoUrl === 'string' ? [data.photoUrl] : [];
    if (rawPhotos.length > 20 || !rawPhotos.every(p => typeof p === 'string' && p.length <= 2048 && (/^https?:\/\//i.test(p) || /^\/(?:uploads\/reportes|api\/case-reports\/images)\//.test(p)))) throw new IntakeError('Fotografías de reporte no válidas.');
    const photos = rawPhotos as string[], photoUrl = photos[0] || null, urgencyLevel = choice(data.urgencyLevel ?? 'Media', URGENCIES);
    const row = await prisma.$transaction(async tx => {
      for (const photo of photos) {
        const match = photo.match(/^\/api\/case-reports\/images\/([0-9a-f-]{36})$/i);
        if (match) {
          const image = await tx.reportImage.findUnique({ where: { id: match[1] } });
          if (!image || image.received !== image.totalSize) throw new IntakeError('La fotografía no terminó de guardarse.');
        }
      }
      const report = await tx.caseReport.create({ data: { reporterName, reporterPhone, locationAddress, description, photos, photoUrl, urgencyLevel, status: 'Recibido' } });
      await addNotification({ type: 'case_report', title: 'Reporte de Perrito en Riesgo • Urgencia ' + urgencyLevel + (photos.length ? ' (' + photos.length + ' fotos)' : ''), message: reporterName + ' (Tel: ' + reporterPhone + ') reportó en "' + locationAddress + '": ' + description, targetTab: 'case-reports', metadata: { reportId: report.id, photoUrl, urgencyLevel } }, tx);
      return report;
    });
    return NextResponse.json(row, { status: 201, headers });
  } catch (error) { return intakeFailure(error); }
}
export async function PUT(request: Request) {
  try {
    const denied = await checkContentAccess(request, '/api/case-reports'); if (denied) return denied;
    const data = await body(request), patch: Prisma.CaseReportUpdateManyMutationInput = {};
    if (data.status !== undefined) patch.status = choice(data.status, REPORT_STATUSES);
    if (data.urgencyLevel !== undefined) patch.urgencyLevel = choice(data.urgencyLevel, URGENCIES);
    if (data.adminNotes !== undefined) { if (typeof data.adminNotes !== 'string') throw new IntakeError('Notas no válidas.'); patch.adminNotes = data.adminNotes; }
    if (!Object.keys(patch).length) throw new IntakeError('No hay cambios válidos.');
    const reports = await prisma.$transaction(async tx => { const result = await tx.caseReport.updateMany({ where: { id: id(data.id) }, data: patch }); if (!result.count) throw new IntakeError('Reporte no encontrado.', 404); return getReports(tx); });
    return NextResponse.json({ ok: true, reports }, { headers });
  } catch (error) { return intakeFailure(error); }
}
export async function DELETE(request: Request) {
  try { const denied = await checkContentAccess(request, '/api/case-reports'); if (denied) return denied; const reportId = id(new URL(request.url).searchParams.get('id')); const reports = await prisma.$transaction(async tx => { const result = await tx.caseReport.deleteMany({ where: { id: reportId } }); if (!result.count) throw new IntakeError('Reporte no encontrado.', 404); return getReports(tx); }); return NextResponse.json({ ok: true, reports }, { headers }); }
  catch (error) { return intakeFailure(error); }
}
