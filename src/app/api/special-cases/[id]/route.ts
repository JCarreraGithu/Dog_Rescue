import { NextResponse } from 'next/server';
import { updateSpecialCase, deleteSpecialCase } from '@/lib/special-cases';
import { checkContentAccess } from '@/lib/content-auth';
import { body, id } from '@/lib/intake-validation';
import { intakeFailure, intakeHeaders as headers } from '@/lib/intake-response';
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  try { const denied = await checkContentAccess(request, '/api/special-cases'); if (denied) return denied; return NextResponse.json(await updateSpecialCase(id((await context.params).id), await body(request)), { headers }); }
  catch (error) { return intakeFailure(error); }
}
export async function DELETE(request: Request, context: Context) {
  try { const denied = await checkContentAccess(request, '/api/special-cases'); if (denied) return denied; await deleteSpecialCase(id((await context.params).id)); return NextResponse.json({ ok: true }, { headers }); }
  catch (error) { return intakeFailure(error); }
}
