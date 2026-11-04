import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import type { DataSource } from "typeorm";
import { PARTS } from "@toeic/shared";
import {
  QUESTION_BANK,
  TEST_BLUEPRINT,
  getBankSummary,
  type QuestionUnit,
} from "@toeic/content";

export function contentId(value: string): string {
  const hex = createHash("sha256").update(value).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
export function validateContent(
  bank: QuestionUnit[] = QUESTION_BANK,
  assetRoot = path.resolve(__dirname, "../../../../apps/web/public"),
) {
  const ids = new Set<string>(),
    sources = new Set<string>();
  for (const unit of bank) {
    if (
      ids.has(unit.id) ||
      !unit.questions.length ||
      !unit.id.trim() ||
      !unit.instruction.trim() ||
      PARTS[unit.part]?.section !== unit.section
    )
      throw new Error(`Invalid or duplicate unit: ${unit.id}`);
    ids.add(unit.id);
    for (const question of unit.questions) {
      if (
        ids.has(question.id) ||
        !question.id.trim() ||
        !question.prompt.trim() ||
        !["easy", "medium", "hard"].includes(question.difficulty) ||
        question.skills.some(
          (s) =>
            ![
              "detail",
              "inference",
              "purpose",
              "grammar",
              "vocabulary",
              "reading-comprehension",
              "listening-comprehension",
            ].includes(s),
        ) ||
        question.choices.length < 2 ||
        question.choices.some(
          (c) => !c.text.trim() || !["A", "B", "C", "D"].includes(c.id),
        ) ||
        !question.explanation.trim() ||
        !question.skills.length ||
        !question.choices.some(
          (choice) => choice.id === question.correctChoiceId,
        ) ||
        new Set(question.choices.map((c) => c.id)).size !==
          question.choices.length
      )
        throw new Error(`Invalid question: ${question.id}`);
      ids.add(question.id);
    }
    if (unit.stimulus.kind === "image-audio") sources.add(unit.stimulus.image);
    if (
      unit.stimulus.kind === "audio" ||
      unit.stimulus.kind === "image-audio"
    ) {
      if (!unit.stimulus.transcript.trim())
        throw new Error(`Missing transcript: ${unit.id}`);
      for (const clip of unit.stimulus.audio.clips) sources.add(clip.src);
    }
  }
  const missing = [...sources].filter((source) => {
    const target = path.resolve(assetRoot, "." + source);
    if (!target.startsWith(path.resolve(assetRoot) + path.sep))
      throw new Error("Unsafe media path");
    return !existsSync(target) || statSync(target).size < 1000;
  });
  if (missing.length)
    throw new Error(`Missing or empty assets: ${missing.join(", ")}`);
  return {
    units: bank.length,
    questions: bank.flatMap((u) => u.questions).length,
    assets: sources.size,
    parts: getBankSummary(bank),
  };
}
export async function importContent(
  ds: DataSource,
  bank: QuestionUnit[] = QUESTION_BANK,
) {
  const stats = validateContent(bank);
  await ds.transaction(async (manager) => {
    await manager.query(
      "SELECT pg_advisory_xact_lock(hashtext('toeic-content-import'))",
    );
    await manager.query(
      "UPDATE question_units SET current=false WHERE original_id<>ALL($1::text[])",
      [bank.map((u) => u.id)],
    );
    for (const unit of bank) {
      const version = createHash("sha256")
        .update(JSON.stringify(unit))
        .digest("hex");
      const id = contentId(unit.id + version);
      await manager.query(
        "UPDATE question_units SET current=false WHERE original_id=$1 AND id<>$2",
        [unit.id, id],
      );
      await manager.query(
        `INSERT INTO question_units(id,original_id,version,section,part,instruction,stimulus)
        VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO UPDATE SET current=true`,
        [
          id,
          unit.id,
          version,
          unit.section,
          unit.part,
          unit.instruction,
          JSON.stringify(unit.stimulus),
        ],
      );
      for (const [position, question] of unit.questions.entries()) {
        const questionId = contentId(question.id + version);
        await manager.query(
          `INSERT INTO questions(id,unit_id,original_id,position,prompt,difficulty,skills)
          VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
          [
            questionId,
            id,
            question.id,
            position,
            question.prompt,
            question.difficulty,
            question.skills,
          ],
        );
        for (const choice of question.choices)
          await manager.query(
            "INSERT INTO choices VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
            [questionId, choice.id, choice.text],
          );
        await manager.query(
          "INSERT INTO answer_keys VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
          [questionId, question.correctChoiceId, question.explanation],
        );
      }
      const media =
        unit.stimulus.kind === "image-audio" ? [unit.stimulus.image] : [];
      if (
        unit.stimulus.kind === "audio" ||
        unit.stimulus.kind === "image-audio"
      )
        media.push(...unit.stimulus.audio.clips.map((c) => c.src));
      for (const src of media)
        await manager.query(
          "INSERT INTO media_references VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
          [id, src, src.endsWith(".mp3") ? "audio" : "image"],
        );
    }
    for (const [id, title, definition] of [
      ["focused", "Focused practice", {}],
      ["quick", "Quick test", { counts: [12, 24] }],
      ["mock", "100-question shortened mock", TEST_BLUEPRINT],
      ["legacy", "Imported practice", TEST_BLUEPRINT],
    ] as const)
      await manager.query(
        "INSERT INTO blueprints VALUES($1,1,$2,$3) ON CONFLICT DO NOTHING",
        [id, title, JSON.stringify(definition)],
      );
  });
  return stats;
}
