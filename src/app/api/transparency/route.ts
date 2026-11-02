import type { TransparencyView } from "@/lib/view-types";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

const STATS_FILE = path.join(process.cwd(), "src/data/transparency-stats.json");

const FALLBACK_STATS = [
  { id: "1", key: "rescues_count", value: 510, label: "Perros Rescatados" },
  { id: "2", key: "adoptions_count", value: 260, label: "Adopciones Integradas" },
  { id: "3", key: "sterilizations_count", value: 1020, label: "Esterilizaciones" },
];

function readLocalStats(): TransparencyView[] {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const content = fs.readFileSync(STATS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return FALLBACK_STATS;
}

function saveLocalStats(stats: TransparencyView[]) {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), "utf-8");
  } catch (err) {
    console.error("Error al guardar stats locales:", err);
  }
}

export async function GET() {
  if (process.env.DATABASE_URL) {
    try {
      const stats = await prisma.transparencyStat.findMany();
      if (stats && stats.length > 0) {
        return NextResponse.json(stats);
      }
    } catch {
      // Si falla la consulta a BD, caemos al archivo local
    }
  }

  return NextResponse.json(readLocalStats());
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    let currentStats = readLocalStats();

    // Soporte para actualización en lote: { rescues_count: 510, adoptions_count: 260, sterilizations_count: 1020 }
    if (typeof body === "object" && body !== null) {
      if (body.key && body.value !== undefined) {
        // Actualización individual
        const val = parseInt(body.value, 10);
        currentStats = currentStats.map((s) =>
          s.key === body.key ? { ...s, value: val } : s
        );

        if (process.env.DATABASE_URL) {
          try {
            await prisma.transparencyStat.upsert({
              where: { key: body.key },
              update: { value: val },
              create: {
                key: body.key,
                value: val,
                label: currentStats.find((s) => s.key === body.key)?.label || body.key,
              },
            });
          } catch {}
        }
      } else {
        // Actualización múltiple
        for (const [key, rawVal] of Object.entries(body)) {
          if (["rescues_count", "adoptions_count", "sterilizations_count"].includes(key)) {
            const val = parseInt(String(rawVal), 10);
            if (!isNaN(val)) {
              currentStats = currentStats.map((s) =>
                s.key === key ? { ...s, value: val } : s
              );

              if (process.env.DATABASE_URL) {
                try {
                  await prisma.transparencyStat.upsert({
                    where: { key },
                    update: { value: val },
                    create: {
                      key,
                      value: val,
                      label: currentStats.find((s) => s.key === key)?.label || key,
                    },
                  });
                } catch {}
              }
            }
          }
        }
      }

      saveLocalStats(currentStats);
    }

    return NextResponse.json(currentStats);
  } catch (error) {
    console.error("Error al actualizar contador:", error);
    return NextResponse.json(
      { error: "Error al actualizar contador", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
