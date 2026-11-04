import "dotenv/config";
import { database } from "./database";
import { importContent } from "./content";
async function main() {
  const ds = database(
    process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL,
  );
  await ds.initialize();
  try {
    if (process.argv[2] === "migrate")
      console.log({
        migrations: (await ds.runMigrations()).map((m) => m.name),
      });
    else if (process.argv[2] === "seed") console.log(await importContent(ds));
    else throw new Error("Use migrate or seed");
  } finally {
    await ds.destroy();
  }
}
void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Database command failed",
  );
  process.exitCode = 1;
});
