import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS, TEST_BLUEPRINT } from "@/features/test/config";
import { sessionStorageApi } from "@/features/test/storage";
import type { AttemptSession } from "@/features/test/types";

const validSession: AttemptSession = {
  schemaVersion: 1,
  id: "attempt-1",
  candidateName: "Alex Morgan",
  blueprintId: TEST_BLUEPRINT.id,
  seed: "seed",
  selectedUnitIds: ["photo-01"],
  orderedQuestionIds: ["photo-01-q1"],
  answers: { "photo-01-q1": "A" },
  markedQuestionIds: [],
  currentIndex: 0,
  startedAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:01:00.000Z",
};

describe("session persistence", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips a valid attempt", () => {
    expect(sessionStorageApi.writeAttempt(validSession)).toBe(true);
    expect(sessionStorageApi.readAttempt()).toEqual({ status: "valid", value: validSession });
  });

  it("reports malformed and obsolete records as corrupt", () => {
    window.localStorage.setItem(STORAGE_KEYS.activeAttempt, "{not-json");
    expect(sessionStorageApi.readAttempt()).toEqual({ status: "corrupt" });
    window.localStorage.setItem(STORAGE_KEYS.activeAttempt, JSON.stringify({ ...validSession, schemaVersion: 2 }));
    expect(sessionStorageApi.readAttempt()).toEqual({ status: "corrupt" });
  });

  it("removes an active attempt", () => {
    sessionStorageApi.writeAttempt(validSession);
    sessionStorageApi.removeAttempt();
    expect(sessionStorageApi.readAttempt()).toEqual({ status: "empty" });
  });
});
