import "reflect-metadata";
import { DataSource } from "typeorm";
import { InitialSchema1793664000000 } from "./migration";
import { Integrity1793750400000 } from "./integrity-migration";
export function database(url = process.env.DATABASE_URL): DataSource {
  if (!url)
    throw new Error(
      "DATABASE_URL is required. Run npm run dev for local PostgreSQL.",
    );
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(
    new URL(url).hostname,
  );
  if (
    process.env.NODE_ENV === "production" &&
    local &&
    !process.env.ALLOW_LOCAL_DATABASE
  ) {
    throw new Error(
      "Production requires an explicitly configured external PostgreSQL database.",
    );
  }
  const parsed = new URL(url);
  parsed.searchParams.delete("sslmode");
  return new DataSource({
    type: "postgres",
    url: parsed.toString(),
    ssl: local ? false : { rejectUnauthorized: true },
    synchronize: false,
    migrations: [InitialSchema1793664000000, Integrity1793750400000],
    migrationsRun: false,
    extra: {
      max: Number(process.env.DB_POOL_SIZE || 4),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
    logging: ["error"],
  });
}
