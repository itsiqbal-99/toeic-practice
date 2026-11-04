import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { config } from "dotenv";
config({ path: "apps/api/.env", quiet: true });
let database, server;
if (!process.env.DATABASE_URL) {
  database = await PGlite.create(
    process.env.LOCAL_DB_PATH ||
      fileURLToPath(new URL("../.local-db", import.meta.url)),
  );
  const port = Number(process.env.LOCAL_DB_PORT || 5434);
  server = new PGLiteSocketServer({ db: database, port, host: "127.0.0.1" });
  await server.start();
  process.env.DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;
  process.env.DB_POOL_SIZE = "1";
}
process.env.WEB_ORIGIN ||= "http://127.0.0.1:3000";
const children = [];
function run(args) {
  const child = spawn(process.execPath, args, {
    stdio: "inherit",
    env: process.env,
  });
  children.push(child);
  return child;
}
await new Promise((resolve, reject) => {
  const build = run([
    "node_modules/typescript/bin/tsc",
    "-b",
    "packages/shared",
    "packages/content",
  ]);
  build.on("exit", (code) =>
    code === 0 ? resolve() : reject(new Error("Package compilation failed")),
  );
});
const api = run([
  "node_modules/tsx/dist/cli.mjs",
  "--tsconfig",
  "apps/api/tsconfig.json",
  "apps/api/src/main.ts",
]);
const web = run([
  "node_modules/next/dist/bin/next",
  "dev",
  "apps/web",
  "--hostname",
  "127.0.0.1",
  "--port",
  process.env.WEB_PORT || "3000",
]);
async function close() {
  for (const child of children) child.kill();
  await server?.stop();
  await database?.close();
  process.exit(0);
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
api.on("exit", (code) => {
  if (code) void close();
});
web.on("exit", (code) => {
  if (code) void close();
});
