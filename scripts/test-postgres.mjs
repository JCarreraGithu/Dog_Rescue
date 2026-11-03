// Harness local únicamente: nunca carga .env ni acepta una URL de Neon.
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
const require = createRequire(import.meta.url);
const directory = path.resolve(".local-test-db");
const postgres = process.env.STAFF_TEST_POSTGRES_BIN || "C:\\Program Files\\PostgreSQL\\18\\bin\\postgres.exe";
if (!fs.existsSync(path.join(directory, "connection.json"))) {
  if (fs.existsSync(path.join(directory, "data"))) throw Error("Existe un clúster de pruebas sin configuración; no se sobrescribirá.");
  fs.mkdirSync(directory, { recursive: true });
  const password = crypto.randomBytes(32).toString("hex");
  const passwordFile = path.join(directory, "password");
  fs.writeFileSync(passwordFile, password, { mode: 0o600 });
  const initialized = spawnSync(path.join(path.dirname(postgres), "initdb.exe"), ["-D", path.join(directory, "data"), "-U", "staff_test", `--pwfile=${passwordFile}`, "--auth=scram-sha-256", "--encoding=UTF8", "--locale=C"], { windowsHide: true, stdio: "ignore" });
  if (initialized.status !== 0) throw Error("No se pudo inicializar PostgreSQL de pruebas.");
  fs.writeFileSync(path.join(directory, "connection.json"), JSON.stringify({ url: `postgresql://staff_test:${password}@127.0.0.1:55439/postgres?schema=public` }), { mode: 0o600 });
}
const connection = JSON.parse(fs.readFileSync(path.join(directory, "connection.json"), "utf8"));
const parsed = new URL(connection.url);
if (parsed.hostname !== "127.0.0.1" || parsed.port !== "55439" || parsed.pathname !== "/postgres") throw Error("Destino local no válido.");
const output = fs.openSync(path.join(directory, "test-server.log"), "a");
const server = spawn(postgres, ["-D", path.join(directory, "data"), "-p", "55439", "-h", "127.0.0.1", "-c", "log_statement=none", "-c", "log_min_error_statement=panic", "-c", "log_parameter_max_length_on_error=0"], { windowsHide: true, stdio: ["ignore", output, output] });
server.on("error", () => {});
const base = new PrismaClient({ datasourceUrl: connection.url, log: [] });
const testUrl = new URL(connection.url);
testUrl.pathname = "/staff_auth_test";
const env = { ...process.env, DATABASE_URL: testUrl.href, DIRECT_URL: testUrl.href, STAFF_TEST_DATABASE_URL: testUrl.href };
function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, windowsHide: true, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", code => code === 0 ? resolve() : reject(Error("Comprobación PostgreSQL fallida.")));
  });
}
try {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try { await base.$queryRaw`SELECT 1`; ready = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 300)); }
  }
  if (!ready) throw Error("No se pudo conectar al PostgreSQL aislado.");
  // Esta base está reservada a fixtures; se recrea para probar los SQL desde cero.
  await base.$executeRawUnsafe('DROP DATABASE IF EXISTS staff_auth_test WITH (FORCE)');
  await base.$executeRawUnsafe('CREATE DATABASE staff_auth_test');
  console.log("PostgreSQL aislado conectado; se usarán únicamente cuentas sintéticas.");
  await run([require.resolve("prisma/build/index.js"), "migrate", "deploy"]);
  await run(["--test", "tests/admin-access.test.cjs"]);
  await run(["--test", "tests/content-persistence.test.cjs"]);
  await run(["--test", "tests/intake-persistence.test.cjs"]);
  await run(["--test", "tests/admin-http.test.cjs"]);
} catch {
  console.error("No se completó la verificación PostgreSQL aislada; revisar el log local privado.");
  process.exitCode = 1;
} finally {
  await base.$disconnect();
  spawnSync(path.join(path.dirname(postgres), "pg_ctl.exe"), ["-D", path.join(directory, "data"), "-w", "stop"], { windowsHide: true, stdio: "ignore" });
  if (server.exitCode === null) server.kill();
  fs.closeSync(output);
}
