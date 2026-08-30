import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { QUESTION_BANK } from "@/data/question-bank";

function publicFile(source: string): string {
  return path.join(process.cwd(), "public", source.replace(/^\//, ""));
}

describe("bundled question media", () => {
  it("ships every referenced image and audio clip as a non-empty file", () => {
    const sources = new Set<string>();

    for (const unit of QUESTION_BANK) {
      if (unit.stimulus.kind === "image-audio") {
        sources.add(unit.stimulus.image);
        unit.stimulus.audio.clips.forEach((clip) => sources.add(clip.src));
      }
      if (unit.stimulus.kind === "audio") {
        unit.stimulus.audio.clips.forEach((clip) => sources.add(clip.src));
      }
    }

    expect([...sources].filter((source) => source.endsWith(".webp"))).toHaveLength(9);
    expect([...sources].filter((source) => source.endsWith(".mp3"))).toHaveLength(64);

    for (const source of sources) {
      const file = publicFile(source);
      expect(existsSync(file), `Missing ${source}`).toBe(true);
      expect(statSync(file).size, `Empty ${source}`).toBeGreaterThan(1_000);
    }
  });
});
