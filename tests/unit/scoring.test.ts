import { describe, expect, it } from "vitest";
import { QUESTION_BANK } from "@/data/question-bank";
import { TEST_BLUEPRINT } from "@/features/test/config";
import { buildQuestionContexts, generateAttempt } from "@/features/test/generator";
import { getAbilityBand, scaleSectionScore, scoreAttempt } from "@/features/test/scoring";
import type { AttemptSession } from "@/features/test/types";

function session(answers: AttemptSession["answers"]): { session: AttemptSession; contexts: ReturnType<typeof buildQuestionContexts> } {
  const generated = generateAttempt(QUESTION_BANK, TEST_BLUEPRINT, "score-test");
  return {
    session: {
      schemaVersion: 1,
      id: "attempt-score",
      candidateName: "Jordan Lee",
      blueprintId: TEST_BLUEPRINT.id,
      seed: "score-test",
      selectedUnitIds: generated.selectedUnitIds,
      orderedQuestionIds: generated.orderedQuestionIds,
      answers,
      markedQuestionIds: [],
      currentIndex: 0,
      startedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    contexts: buildQuestionContexts(QUESTION_BANK, generated.selectedUnitIds),
  };
}

describe("scoring", () => {
  it("scales section results to 5–495 in five-point increments", () => {
    expect(scaleSectionScore(0, 50)).toBe(5);
    expect(scaleSectionScore(25, 50)).toBe(250);
    expect(scaleSectionScore(50, 50)).toBe(495);
    expect(scaleSectionScore(37, 50) % 5).toBe(0);
  });

  it("scores a fully correct attempt at 990", () => {
    const base = session({});
    const answers = Object.fromEntries(base.contexts.map(({ question }) => [question.id, question.correctChoiceId]));
    const result = scoreAttempt({ ...base.session, answers }, base.contexts, "2026-01-01T01:00:00.000Z");
    expect(result.correct).toBe(100);
    expect(result.accuracy).toBe(100);
    expect(result.listeningScore).toBe(495);
    expect(result.readingScore).toBe(495);
    expect(result.estimatedScore).toBe(990);
    expect(result.abilityBand).toBe("Advanced");
  });

  it("treats unanswered questions separately from incorrect answers", () => {
    const base = session({});
    const result = scoreAttempt(base.session, base.contexts);
    expect(result.correct).toBe(0);
    expect(result.incorrect).toBe(0);
    expect(result.unanswered).toBe(100);
    expect(result.estimatedScore).toBe(10);
  });

  it("maps every proficiency boundary", () => {
    expect(getAbilityBand(10)).toBe("Beginner");
    expect(getAbilityBand(250)).toBe("Elementary");
    expect(getAbilityBand(450)).toBe("Intermediate");
    expect(getAbilityBand(650)).toBe("Upper Intermediate");
    expect(getAbilityBand(850)).toBe("Advanced");
  });
});
