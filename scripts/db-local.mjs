// Local development PostgreSQL using real Postgres binaries shipped by the
// `embedded-postgres` platform package. Binaries + data are kept under a short
// path because Windows Postgres fails on very long install paths.
// Usage: npm run db:local   (keep running; Ctrl+C to stop)
// Production must use a managed PostgreSQL — see README.
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import pg from "pg";

const port = Number(process.env.LOCAL_PG_PORT ?? 5433);
const USER = "vetrina";
const PASSWORD = "vetrina_local_dev";
const platformPkg = `@embedded-postgres/${os.platform() === "win32" ? "windows" : os.platform()}-${os.arch()}`;
const pkgDir = path.resolve("node_modules", platformPkg);
const { version } = JSON.parse(readFileSync(path.join(pkgDir, "package.json"), "utf8"));

const home = path.join(process.env.LOCALAPPDATA ?? os.homedir(), "vetrina-pg");
const nativeDir = path.join(home, `native-${version}`);
const dataDir = path.join(home, "data");
const exe = (n) => path.join(nativeDir, "bin", os.platform() === "win32" ? `${n}.exe` : n);

if (!existsSync(exe("postgres"))) {
  mkdirSync(home, { recursive: true });
  cpSync(path.join(pkgDir, "native"), nativeDir, { recursive: true });
}
if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
  const pwFile = path.join(home, "pw.txt");
  writeFileSync(pwFile, PASSWORD);
  const r = spawnSync(exe("initdb"), ["-D", dataDir, "-U", USER, "--pwfile", pwFile, "-A", "scram-sha-256", "-E", "UTF8", "--locale=C"], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("initdb failed");
}

const server = spawn(exe("postgres"), ["-D", dataDir, "-p", String(port), "-c", "listen_addresses=localhost"], { stdio: ["ignore", "ignore", "pipe"] });
server.stderr.on("data", (d) => { const s = String(d); if (/FATAL|ERROR|PANIC/.test(s)) process.stderr.write(s); });
server.on("exit", (code) => { console.log(`postgres exited (${code})`); process.exit(code ?? 0); });

for (let i = 0; i < 60; i++) {
  try {
    const c = new pg.Client({ host: "localhost", port, user: USER, password: PASSWORD, database: "postgres" });
    await c.connect();
    for (const db of ["vetrina", "vetrina_test"]) {
      const { rowCount } = await c.query("select 1 from pg_database where datname=$1", [db]);
      if (!rowCount) await c.query(`create database ${db}`);
    }
    await c.end();
    console.log(`PostgreSQL ready: postgresql://${USER}:${PASSWORD}@localhost:${port}/vetrina`);
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 500));
  }
}
const stop = () => { server.kill("SIGINT"); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
