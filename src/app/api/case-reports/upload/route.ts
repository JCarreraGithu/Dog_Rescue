import { NextResponse } from 'next/server';
import { uploadReportImage } from '@/lib/report-images';
import { IntakeError } from '@/lib/intake-validation';
import { intakeFailure, intakeHeaders as headers } from '@/lib/intake-response';
export async function POST(request: Request) {
  try {
    let form: FormData;
    try { form = await request.formData(); } catch { throw new IntakeError('Formulario de imagen no válido.'); }
    return NextResponse.json(await uploadReportImage(form), { status: 201, headers });
  } catch (error) { return intakeFailure(error); }
}
