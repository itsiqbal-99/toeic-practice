import "reflect-metadata";
import { config } from "dotenv";
import { database } from "./database/database";
import { importContent } from "./database/content";
import { createApp } from "./app";
config({ path: "apps/api/.env", quiet: true });
config({ quiet: true });
async function main() {
  if (process.env.NODE_ENV === "production") {
    const origin = new URL(process.env.WEB_ORIGIN || "");
    if (origin.protocol !== "https:")
      throw new Error("Production WEB_ORIGIN must use HTTPS.");
  }
  const db = database();
  await db.initialize();
  if (process.env.NODE_ENV !== "production") {
    await db.runMigrations();
    console.log({ event: "content-import", ...(await importContent(db)) });
  }
  const app = await createApp(db);
  app.enableShutdownHooks();
  await app.listen(
    Number(process.env.PORT || 4000),
    process.env.API_HOST || "127.0.0.1",
  );
}
void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "API startup failed");
  process.exitCode = 1;
});
