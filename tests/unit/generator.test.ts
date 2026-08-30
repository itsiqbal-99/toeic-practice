import { describe, expect, it } from "vitest";
import { QUESTION_BANK, getBankSummary, getTotalQuestionCount } from "@/data/question-bank";
import { TEST_BLUEPRINT } from "@/features/test/config";
import { buildQuestionContexts, generateAttempt } from "@/features/test/generator";

describe("question bank and test generation", () => {
  it("contains the approved 150-question composition", () => {
    expect(getTotalQuestionCount()).toBe(150);
    expect(getBankSummary()).toEqual({
      photographs: 9,
      "question-response": 21,
      "short-conversations": 24,
      "short-talks": 21,
      "incomplete-sentences": 30,
      "text-completion": 15,
      "single-passage": 15,
      "multiple-passage": 15,
    });
  });

  it("is deterministic for one seed and varies across seeds", () => {
    const first = generateAttempt(QUESTION_BANK, TEST_BLUEPRINT, "candidate-one");
    const repeat = generateAttempt(QUESTION_BANK, TEST_BLUEPRINT, "candidate-one");
    const second = generateAttempt(QUESTION_BANK, TEST_BLUEPRINT, "candidate-two");
    expect(repeat).toEqual(first);
    expect(second.orderedQuestionIds).not.toEqual(first.orderedQuestionIds);
  });

  it("enforces every quota without duplicates", () => {
    const generated = generateAttempt(QUESTION_BANK, TEST_BLUEPRINT, "quota-check");
    const contexts = buildQuestionContexts(QUESTION_BANK, generated.selectedUnitIds);
    const counts = contexts.reduce<Record<string, number>>((summary, context) => {
      summary[context.unit.part] = (summary[context.unit.part] ?? 0) + 1;
      return summary;
    }, {});
    expect(contexts).toHaveLength(100);
    expect(new Set(contexts.map(({ question }) => question.id)).size).toBe(100);
    expect(counts).toEqual({
      photographs: 6,
      "question-response": 14,
      "short-conversations": 15,
      "short-talks": 15,
      "incomplete-sentences": 20,
      "text-completion": 12,
      "single-passage": 9,
      "multiple-passage": 9,
    });
  });

  it("keeps every selected multi-question unit contiguous", () => {
    const generated = generateAttempt(QUESTION_BANK, TEST_BLUEPRINT, "group-check");
    const contexts = buildQuestionContexts(QUESTION_BANK, generated.selectedUnitIds);
    for (const unitId of generated.selectedUnitIds) {
      const indices = contexts.filter(({ unit }) => unit.id === unitId).map(({ index }) => index);
      expect(indices).toEqual(Array.from({ length: indices.length }, (_, offset) => indices[0] + offset));
    }
  });

  it("fails clearly when a bank cannot satisfy an exact quota", () => {
    const insufficient = QUESTION_BANK.filter((unit) => unit.part !== "photographs");
    expect(() => generateAttempt(insufficient, TEST_BLUEPRINT, "missing-part")).toThrow(/exact quota/i);
  });
});
