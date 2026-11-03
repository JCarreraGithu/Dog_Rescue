import fs from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { validateOrderImport, importOrders, OrderImportError } from "../src/lib/order-import";
async function main() {
  const [file, mode] = process.argv.slice(2);
  if (!file || process.argv.length > 4 || (mode && !['--check-db', '--apply'].includes(mode))) throw new OrderImportError('Uso: npm run orders:import -- ARCHIVO [--check-db | --apply]. Sin modo: validación offline.');
  const stat = await fs.stat(file);
  if (!stat.isFile() || stat.size > 10 * 1024 * 1024) throw new OrderImportError('Archivo de pedidos no compatible.');
  const input: unknown = JSON.parse(await fs.readFile(file, 'utf8'));
  const orders = validateOrderImport(input);
  if (!mode) { console.log(JSON.stringify({ validated: orders.length, databaseAccess: false })); return; }
  const url = process.env.ORDER_IMPORT_DATABASE_URL;
  if (!url || !process.env.ORDER_IMPORT_EXPECT_HOST || new URL(url).hostname !== process.env.ORDER_IMPORT_EXPECT_HOST) throw new OrderImportError('Configura ORDER_IMPORT_DATABASE_URL y ORDER_IMPORT_EXPECT_HOST para el destino confirmado.');
  const client = new PrismaClient({ datasourceUrl: url, log: [] });
  try { console.log(JSON.stringify(await importOrders(client, input, mode === '--apply'))); }
  finally { await client.$disconnect(); }
}
main().catch((error: unknown) => { console.error(error instanceof OrderImportError ? error.message : 'No se pudo validar o importar el archivo privado de pedidos.'); process.exitCode = 1; });
