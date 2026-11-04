// @vitest-environment node
import { describe, expect, it } from "vitest";
import { QUESTION_BANK, buildQuestionContexts } from "@toeic/content";
import { comparisonKey, type ChoiceId } from "@toeic/shared";
import {
  filterUnits,
  selectQuestions,
  publicContexts,
  score,
  reachableCounts,
} from "../../apps/api/src/assessments/engine";
import { recommend } from "../../apps/api/src/progress/insights";
import { validateContent } from "../../apps/api/src/database/content";
const contexts = buildQuestionContexts(QUESTION_BANK, [
  QUESTION_BANK.find((u) => u.part === "incomplete-sentences")!.id,
]);
describe("assessment and intelligence rules", () => {
  it("preserves groups for every advertised count and rejects insufficient content", () => {
    const bank = QUESTION_BANK.filter((u) => u.part === "short-conversations");
    for (const count of reachableCounts(bank)) {
      const a = selectQuestions(
        bank,
        { mode: "focused", count, part: "short-conversations" },
        "test",
      );
      expect(new Set(a.orderedQuestionIds).size).toBe(count);
      expect(count % 3).toBe(0);
    }
    expect(() => selectQuestions(bank, { mode: "mock" }, "test")).toThrow();
    for (const count of [12, 24])
      expect(
        selectQuestions(QUESTION_BANK, { mode: "quick", count }, "test")
          .orderedQuestionIds,
      ).toHaveLength(count);
  });
  it("uses validated filters and resolves only unresolved mistakes", () => {
    const first = QUESTION_BANK.find((u) =>
      u.questions.some((q) => q.skills.includes("inference")),
    )!;
    const filtered = filterUnits(QUESTION_BANK, { skill: "inference" });
    expect(
      filtered.every((u) =>
        u.questions.some((q) => q.skills.includes("inference")),
      ),
    ).toBe(true);
    expect(
      filterUnits(QUESTION_BANK, { replay: true }, [first.questions[0].id]).map(
        (u) => u.id,
      ),
    ).toEqual([first.id]);
    expect(() =>
      selectQuestions(
        QUESTION_BANK,
        { mode: "focused", replay: true },
        "test",
        [],
      ),
    ).toThrow(/unresolved/);
  });
  it("scores raw accuracy without inventing an ETS estimate and keeps cohorts distinct", () => {
    const q = contexts[0].question;
    const result = score(
      contexts,
      { [q.id]: q.correctChoiceId as ChoiceId },
      {
        id: "test",
        mode: "focused",
        title: "Test",
        startedAt: new Date(0),
        completedAt: new Date(60000),
      },
    );
    expect(result.correct).toBe(1);
    expect(result).not.toHaveProperty("estimatedScore");
    expect(result.elapsedSeconds).toBe(60);
    expect(comparisonKey(result)).not.toBe(
      comparisonKey({ ...result, immediate: true }),
    );
    expect(comparisonKey(result)).not.toBe(
      comparisonKey({
        ...result,
        parts: [{ ...result.parts[0], key: "photographs" }],
      }),
    );
    expect(JSON.stringify(publicContexts(contexts))).not.toContain(
      "correctChoiceId",
    );
  });
  it("requires five observations and explains the exact skill sample", () => {
    const rows = Array.from({ length: 5 }, () => ({
      part: "single-passage" as const,
      skills: ["inference"],
      correct: false,
    }));
    expect(recommend(rows.slice(0, 4))).toBeNull();
    expect(recommend(rows)).toMatchObject({
      part: "single-passage",
      skill: "inference",
      sample: 5,
    });
    expect(recommend(rows)!.reason).toContain("5 of your last 5");
    expect(recommend(rows.map((r) => ({ ...r, correct: true })))).toBeNull();
  });
  it("rejects duplicate IDs and missing assets", () => {
    expect(() => validateContent([QUESTION_BANK[0], QUESTION_BANK[0]])).toThrow(
      /duplicate/,
    );
    expect(() => validateContent([QUESTION_BANK[0]], "missing-assets")).toThrow(
      /Missing/,
    );
  });
});
