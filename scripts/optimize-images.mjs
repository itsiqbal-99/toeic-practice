import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = path.resolve(process.argv[2] ?? "tmp/imagegen");
const outputDir = path.resolve("apps/web/public/images/questions");
await fs.mkdir(outputDir, { recursive: true });

const files = (await fs.readdir(sourceDir)).filter((file) =>
  file.endsWith(".png"),
);
for (const file of files) {
  const output = path.join(outputDir, file.replace(/\.png$/i, ".webp"));
  await sharp(path.join(sourceDir, file))
    .resize({ width: 1536, withoutEnlargement: true })
    .webp({ quality: 82, smartSubsample: true })
    .toFile(output);
  const stat = await fs.stat(output);
  console.log(`${path.basename(output)} ${Math.round(stat.size / 1024)}KB`);
}
