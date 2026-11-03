import { NextResponse } from 'next/server';
import { getSpecialCases, createSpecialCase } from '@/lib/special-cases';
import { checkContentAccess } from '@/lib/content-auth';
import { body } from '@/lib/intake-validation';
import { intakeFailure, intakeHeaders as headers } from '@/lib/intake-response';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { const all = new URL(request.url).searchParams.get('all') === '1'; if (all) { const denied = await checkContentAccess(request, '/api/special-cases'); if (denied) return denied; } return NextResponse.json(await getSpecialCases(all), { headers }); }
  catch (error) { return intakeFailure(error); }
}
export async function POST(request: Request) {
  try { const denied = await checkContentAccess(request, '/api/special-cases'); if (denied) return denied; return NextResponse.json(await createSpecialCase(await body(request)), { status: 201, headers }); }
  catch (error) { return intakeFailure(error); }
}
