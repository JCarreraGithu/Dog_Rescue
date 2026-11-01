import { NextRequest, NextResponse } from "next/server";
import {
  getSpecialCases,
  saveSpecialCases,
  sanitizeCaseStatus,
} from "@/lib/special-cases";

// PUT: editar caso especial existente
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const cases = await getSpecialCases();

    const index = cases.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: "Caso especial no encontrado" },
        { status: 404 }
      );
    }

    const current = cases[index];

    const cleanGallery =
      body.gallery !== undefined && Array.isArray(body.gallery)
        ? body.gallery.map((img: unknown) => String(img).trim()).filter(Boolean)
        : current.gallery || [current.image];

    const mainImage =
      typeof body.image === "string" && body.image.trim()
        ? body.image.trim()
        : cleanGallery[0] || current.image;

    const finalGallery =
      cleanGallery.length > 0
        ? cleanGallery.includes(mainImage)
          ? cleanGallery
          : [mainImage, ...cleanGallery]
        : [mainImage];

    const updatedCase = {
      ...current,
      name:
        typeof body.name === "string" ? body.name.trim() : current.name,
      title:
        typeof body.title === "string" && body.title.trim()
          ? body.title.trim()
          : current.title,
      subtitle:
        typeof body.subtitle === "string"
          ? body.subtitle.trim()
          : current.subtitle,
      story:
        typeof body.story === "string" && body.story.trim()
          ? body.story.trim()
          : current.story,
      beforeText:
        typeof body.beforeText === "string"
          ? body.beforeText.trim()
          : current.beforeText,
      afterText:
        typeof body.afterText === "string"
          ? body.afterText.trim()
          : current.afterText,
      location:
        typeof body.location === "string"
          ? body.location.trim()
          : current.location,
      date: typeof body.date === "string" ? body.date.trim() : current.date,
      status:
        body.status !== undefined
          ? sanitizeCaseStatus(body.status)
          : current.status,
      image: mainImage,
      gallery: finalGallery,
      video:
        typeof body.video === "string"
          ? body.video.trim() || undefined
          : current.video,
      featured:
        body.featured !== undefined ? Boolean(body.featured) : current.featured,
      published:
        body.published !== undefined
          ? Boolean(body.published)
          : current.published,
    };

    cases[index] = updatedCase;
    await saveSpecialCases(cases);

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error("Error al actualizar caso especial:", error);
    return NextResponse.json(
      { error: "Error al actualizar el caso especial" },
      { status: 500 }
    );
  }
}

// DELETE: eliminar un caso especial
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cases = await getSpecialCases();
    const filtered = cases.filter((c) => c.id !== id);

    if (filtered.length === cases.length) {
      return NextResponse.json(
        { error: "Caso especial no encontrado" },
        { status: 404 }
      );
    }

    await saveSpecialCases(filtered);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al eliminar caso especial:", error);
    return NextResponse.json(
      { error: "Error al eliminar el caso especial" },
      { status: 500 }
    );
  }
}
