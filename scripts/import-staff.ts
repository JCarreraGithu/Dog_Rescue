import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { importStaffUsers, validateStaffImport, StaffImportError } from "../src/lib/staff-import";

async function main() {
  const args = process.argv.slice(2);
  const file = args[0];
  const flags = args.slice(1);
  if (!file || !path.isAbsolute(file) || flags.length > 1 || flags.some((f) => !["--check-db", "--apply"].includes(f))) {
    throw new StaffImportError("Uso: npm run staff:import -- RUTA_ABSOLUTA_PRIVADA [--check-db | --apply]. Sin flags: solo validación local.");
  }
  const realFile = await fs.realpath(file);
  // El comando ejecuta .private-tools/scripts/import-staff.js; no depende del cwd.
  const repository = await fs.realpath(path.resolve(__dirname, "../.."));
  const relative = path.relative(repository, realFile);
  if (!relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)) throw new StaffImportError("El archivo debe estar fuera del repositorio.");
  const stat = await fs.stat(realFile);
  if (!stat.isFile() || stat.size > 10 * 1024 * 1024) throw new StaffImportError("Archivo privado no compatible.");
  let input: unknown;
  try { input = JSON.parse(await fs.readFile(realFile, "utf8")); }
  catch { throw new StaffImportError("No se pudo leer el JSON privado."); }
  const users = validateStaffImport(input);
  if (!flags.length) { console.log(JSON.stringify({ validated: users.length, databaseAccess: false })); return; }
  // Nunca toma automáticamente DATABASE_URL de .env o del despliegue.
  const url = process.env.STAFF_IMPORT_DATABASE_URL;
  const expectedHost = process.env.STAFF_IMPORT_EXPECT_HOST;
  if (!url || !expectedHost || new URL(url).hostname !== expectedHost) throw new StaffImportError("Falta conexión explícita y confirmación del host de destino.");
  const client = new PrismaClient({ datasourceUrl: url, log: [] });
  try { console.log(JSON.stringify(await importStaffUsers(client, input, flags.includes("--apply")))); }
  finally { await client.$disconnect(); }
}

main().catch((error: unknown) => {
  // Solo nuestros mensajes fijos; errores de sistema/JSON nunca se imprimen.
  const text = error instanceof StaffImportError ? error.message : "No se pudo completar la operación local.";
  console.error(text);
  process.exitCode = 1;
});
