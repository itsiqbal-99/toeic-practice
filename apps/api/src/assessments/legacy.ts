import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { TEST_BLUEPRINT, type QuestionUnit } from "@toeic/content";
const identifier = z.string().min(1).max(120);
export const legacySchema = z
  .object({
    kind: z.enum(["active", "result"]),
    data: z
      .object({
        schemaVersion: z.literal(1),
        id: identifier.optional(),
        attemptId: identifier.optional(),
        selectedUnitIds: z.array(identifier).min(1).max(100),
        orderedQuestionIds: z.array(identifier).length(100),
        answers: z.record(identifier, z.enum(["A", "B", "C", "D"])),
        markedQuestionIds: z.array(identifier).max(100).default([]),
        currentIndex: z.number().int().min(0).max(99).default(0),
        completedAt: z.iso.datetime().optional(),
      })
      .passthrough(),
  })
  .strict();
export type LegacyInput = z.infer<typeof legacySchema>;
export function validateLegacy(input: LegacyInput, bank: QuestionUnit[]) {
  const d = input.data,
    units = d.selectedUnitIds.map((id) => bank.find((u) => u.id === id));
  const questions = units.flatMap((u) => u?.questions || []);
  if (
    new Set(d.selectedUnitIds).size !== units.length ||
    units.some((u) => !u) ||
    JSON.stringify(questions.map((q) => q.id)) !==
      JSON.stringify(d.orderedQuestionIds) ||
    TEST_BLUEPRINT.sections
      .flatMap((s) => s.quotas)
      .some(
        (quota) =>
          units
            .filter((u) => u?.part === quota.part)
            .flatMap((u) => u!.questions).length !== quota.count,
      ) ||
    Object.entries(d.answers).some(
      ([id, choice]) =>
        !questions
          .find((q) => q.id === id)
          ?.choices.some((c) => c.id === choice),
    ) ||
    d.markedQuestionIds.some((id) => !questions.some((q) => q.id === id)) ||
    !(input.kind === "active" ? d.id : d.attemptId) ||
    (input.kind === "result" &&
      (!d.completedAt || Date.parse(d.completedAt) > Date.now() + 60000))
  ) {
    throw new BadRequestException(
      "This legacy record does not match the preserved 100-question content. The original file has not been changed.",
    );
  }
}
