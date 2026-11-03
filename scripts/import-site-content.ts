import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { validateSiteContent, importSiteContent, SiteContentImportError } from "../src/lib/site-content-import";
import { ContentValidationError } from "../src/lib/content-validation";

async function main() {
  const [homeFile, notificationsFile, mode] = process.argv.slice(2);
  if (!homeFile || !notificationsFile || process.argv.length > 5 || (mode && !['--check-db', '--apply'].includes(mode))) throw new SiteContentImportError("Uso: npm run content:import -- ARCHIVO_LEMA ARCHIVO_NOTIFICACIONES [--check-db | --apply]. Sin modo: validación offline.");
  const read = async (file: string) => {
    const absolute = path.resolve(file);
    const stat = await fs.stat(absolute);
    if (!stat.isFile() || stat.size > 10 * 1024 * 1024) throw new SiteContentImportError("Archivo de contenido no compatible.");
    return JSON.parse(await fs.readFile(absolute, "utf8")) as unknown;
  };
  const home = await read(homeFile);
  const notifications = await read(notificationsFile);
  const validated = validateSiteContent(home, notifications);
  if (!mode) { console.log(JSON.stringify({ validatedNotifications: validated.notifications.length, validSettings: true, databaseAccess: false })); return; }
  const url = process.env.CONTENT_IMPORT_DATABASE_URL;
  const host = process.env.CONTENT_IMPORT_EXPECT_HOST;
  if (!url || !host || new URL(url).hostname !== host) throw new SiteContentImportError("Configura explícitamente CONTENT_IMPORT_DATABASE_URL y CONTENT_IMPORT_EXPECT_HOST para el destino elegido.");
  const client = new PrismaClient({ datasourceUrl: url, log: [] });
  try { console.log(JSON.stringify(await importSiteContent(client, home, notifications, mode === '--apply'))); }
  finally { await client.$disconnect(); }
}
main().catch((error: unknown) => {
  console.error(error instanceof SiteContentImportError || error instanceof ContentValidationError ? error.message : "No se pudo validar o trasladar el contenido local.");
  process.exitCode = 1;
});
