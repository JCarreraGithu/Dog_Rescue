import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHomeHeroSettings, saveHomeHeroSettings } from "@/lib/home-settings";
import { checkContentAccess } from "@/lib/content-auth";
import { ContentValidationError, validateHomeSettings } from "@/lib/content-validation";
import { addNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET() {
  try { return NextResponse.json(await getHomeHeroSettings(), { headers }); }
  catch { return NextResponse.json({ error: "No se pudo leer la configuración del lema." }, { status: 503, headers }); }
}
export async function PUT(request: NextRequest) {
  try {
    const denied = await checkContentAccess(request, "/api/home-settings");
    if (denied) return denied;
    const body = await request.json().catch(() => null);
    const patch = validateHomeSettings(body);
    const updated = await prisma.$transaction(async (tx) => {
      const settings = await saveHomeHeroSettings(patch, tx);
      await addNotification({ type: "system", title: "Lema de inicio actualizado", message: "El lema principal de la página de inicio fue actualizado: "+settings.mottoPart1+" "+settings.mottoHighlight, targetTab: "notifications" }, tx);
      return settings;
    });
    return NextResponse.json(updated, { headers });
  } catch (error) {
    if (error instanceof ContentValidationError) return NextResponse.json({ error: error.message }, { status: 400, headers });
    return NextResponse.json({ error: "No se pudo guardar la configuración del lema." }, { status: 503, headers });
  }
}
