import { NextResponse } from 'next/server';
import { checkContentAccess } from '@/lib/content-auth';
import { uploadReportImage } from '@/lib/report-images';
import { intakeFailure, intakeHeaders as headers } from '@/lib/intake-response';
export async function POST(request: Request) {
  try { const denied = await checkContentAccess(request, '/api/special-cases/upload'); if (denied) return denied; return NextResponse.json(await uploadReportImage(await request.formData()), { status: 201, headers }); }
  catch (error) { return intakeFailure(error); }
}
