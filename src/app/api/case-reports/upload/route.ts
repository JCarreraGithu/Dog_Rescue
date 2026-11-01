import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo de imagen" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "La imagen supera el límite de 8 MB" },
        { status: 400 }
      );
    }

    const originalExt = path.extname(file.name || "").toLowerCase() || ".jpg";
    const ext = ALLOWED_EXTENSIONS.has(originalExt) ? originalExt : ".jpg";

    const safeBase = (
      path.basename(file.name || "reporte", originalExt) || "reporte"
    )
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .slice(0, 40);

    const fileName = `${safeBase}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}${ext}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "reportes"
    );

    await fs.mkdir(uploadDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(
      path.join(uploadDir, fileName),
      Buffer.from(arrayBuffer)
    );

    const publicUrl = `/uploads/reportes/${fileName}`;
    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (error) {
    console.error("Error al subir foto de reporte:", error);
    return NextResponse.json(
      { error: "No se pudo subir la fotografía" },
      { status: 500 }
    );
  }
}
