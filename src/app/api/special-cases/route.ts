import { NextRequest, NextResponse } from "next/server";
import {
  getSpecialCases,
  saveSpecialCases,
  sanitizeCaseStatus,
} from "@/lib/special-cases";
import { ImpactCase } from "@/data/impact-cases";

// GET: obtener listado de casos especiales (público o todos para admin con ?all=1)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get("all") === "1";
    const cases = await getSpecialCases();

    const filtered = includeAll
      ? cases
      : cases.filter((c) => c.published !== false && !c.draft);

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error al obtener casos especiales:", error);
    return NextResponse.json(
      { error: "Error al cargar los casos especiales" },
      { status: 500 }
    );
  }
}

// POST: crear un nuevo caso especial desde el panel de administración
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      title,
      subtitle,
      story,
      beforeText,
      afterText,
      location,
      date,
      status,
      image,
      gallery,
      video,
      featured,
      published,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "El título del caso es obligatorio" },
        { status: 400 }
      );
    }

    if (!story || typeof story !== "string" || !story.trim()) {
      return NextResponse.json(
        { error: "La historia del caso es obligatoria" },
        { status: 400 }
      );
    }

    const cases = await getSpecialCases();

    const cleanGallery = Array.isArray(gallery)
      ? gallery.map((img) => String(img).trim()).filter(Boolean)
      : [];

    const mainImage =
      typeof image === "string" && image.trim()
        ? image.trim()
        : cleanGallery[0] ||
          "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000";

    const finalGallery =
      cleanGallery.length > 0
        ? cleanGallery.includes(mainImage)
          ? cleanGallery
          : [mainImage, ...cleanGallery]
        : [mainImage];

    const newCase: ImpactCase = {
      id: `caso-${Date.now()}`,
      name: typeof name === "string" ? name.trim() : "",
      title: title.trim(),
      subtitle: typeof subtitle === "string" ? subtitle.trim() : "",
      story: story.trim(),
      beforeText: typeof beforeText === "string" ? beforeText.trim() : "",
      afterText: typeof afterText === "string" ? afterText.trim() : "",
      location:
        typeof location === "string" && location.trim()
          ? location.trim()
          : "Amatitlán, Guatemala",
      date: typeof date === "string" ? date.trim() : "",
      status: sanitizeCaseStatus(status),
      image: mainImage,
      gallery: finalGallery,
      video: typeof video === "string" && video.trim() ? video.trim() : undefined,
      featured: featured !== undefined ? Boolean(featured) : true,
      published: published !== undefined ? Boolean(published) : true,
    };

    const updated = [newCase, ...cases];
    await saveSpecialCases(updated);

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error("Error al crear caso especial:", error);
    return NextResponse.json(
      { error: "No se pudo guardar el caso especial" },
      { status: 500 }
    );
  }
}
