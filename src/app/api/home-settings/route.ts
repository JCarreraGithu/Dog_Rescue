import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getHomeHeroSettings,
  saveHomeHeroSettings,
  DEFAULT_HOME_HERO_SETTINGS,
} from "@/lib/home-settings";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { addNotification } from "@/lib/notifications";

async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function GET() {
  try {
    const settings = await getHomeHeroSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error al leer configuración del lema de inicio:", error);
    return NextResponse.json(DEFAULT_HOME_HERO_SETTINGS);
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const updated = await saveHomeHeroSettings(body);

    await addNotification({
      type: "system",
      title: "Lema de inicio actualizado",
      message: `El lema principal de la página de inicio fue actualizado: "${updated.mottoPart1} ${updated.mottoHighlight}".`,
      targetTab: "notifications",
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al guardar configuración del lema de inicio:", error);
    return NextResponse.json(
      { error: "No se pudo guardar la configuración del lema" },
      { status: 500 }
    );
  }
}
