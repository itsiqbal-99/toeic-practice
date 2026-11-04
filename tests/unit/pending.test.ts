import { describe, expect, it } from "vitest";
import { readPending } from "../../apps/web/src/features/attempt/pending";
describe("offline pending edits", () => {
  it("restores a valid change and rejects corrupt, cross-attempt and malformed records", () => {
    const record = {
      id: "attempt",
      revision: 1,
      change: { kind: "answer", questionId: "q1", choiceId: "A" },
    };
    expect(readPending(JSON.stringify(record), "attempt")).toEqual(record);
    expect(readPending("{broken", "attempt")).toBeNull();
    expect(readPending(JSON.stringify(record), "other")).toBeNull();
    expect(
      readPending(
        JSON.stringify({
          ...record,
          change: { kind: "progress", markedQuestionIds: 42 },
        }),
        "attempt",
      ),
    ).toBeNull();
    expect(
      readPending(
        JSON.stringify({
          ...record,
          change: { kind: "answer", questionId: "q1", choiceId: "Z" },
        }),
        "attempt",
      ),
    ).toBeNull();
  });
});
