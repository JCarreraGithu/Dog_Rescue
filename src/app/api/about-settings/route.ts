import { NextResponse } from "next/server";
import { checkContentAccess } from "@/lib/content-auth";
import { body } from "@/lib/intake-validation";
import { intakeFailure, intakeHeaders as headers } from "@/lib/intake-response";
import { getAboutSettings, saveAboutSettings } from "@/lib/about-settings";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json(await getAboutSettings(), { headers }); } catch (error) { return intakeFailure(error); }
}
export async function PUT(request: Request) {
  try { const denied = await checkContentAccess(request, "/api/about-settings"); if (denied) return denied; return NextResponse.json(await saveAboutSettings(await body(request)), { headers }); }
  catch (error) { return intakeFailure(error); }
}
