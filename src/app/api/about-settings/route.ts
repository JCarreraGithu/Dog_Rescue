import { NextRequest, NextResponse } from "next/server";
import {
  getAboutSettings,
  saveAboutSettings,
  DEFAULT_ABOUT_SETTINGS,
} from "@/lib/about-settings";

export async function GET() {
  try {
    const settings = await getAboutSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error al leer configuración de Conócenos:", error);
    return NextResponse.json(DEFAULT_ABOUT_SETTINGS);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const current = await getAboutSettings();

    const updated = await saveAboutSettings({
      heroImage:
        typeof body.heroImage === "string" && body.heroImage.trim()
          ? body.heroImage.trim()
          : current.heroImage,
      heroBadgeText:
        typeof body.heroBadgeText === "string" && body.heroBadgeText.trim()
          ? body.heroBadgeText.trim()
          : current.heroBadgeText,
      heroCaptionTitle:
        typeof body.heroCaptionTitle === "string" &&
        body.heroCaptionTitle.trim()
          ? body.heroCaptionTitle.trim()
          : current.heroCaptionTitle,
      heroCaptionSubtitle:
        typeof body.heroCaptionSubtitle === "string" &&
        body.heroCaptionSubtitle.trim()
          ? body.heroCaptionSubtitle.trim()
          : current.heroCaptionSubtitle,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al guardar configuración de Conócenos:", error);
    return NextResponse.json(
      { error: "No se pudo guardar la foto de Conócenos" },
      { status: 500 }
    );
  }
}
