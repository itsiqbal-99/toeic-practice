import type { ChoiceId } from "@toeic/shared";
export type Change =
  | { kind: "answer"; questionId: string; choiceId: ChoiceId }
  | { kind: "progress"; currentIndex?: number; markedQuestionIds?: string[] }
  | { kind: "audio"; unitId: string };
export interface Pending {
  id: string;
  revision: number;
  change: Change;
}
export function readPending(raw: string | null, id: string): Pending | null {
  try {
    if (!raw) return null;
    const p = JSON.parse(raw),
      c = p?.change;
    if (p?.id !== id || !Number.isInteger(p.revision) || p.revision < 0 || !c)
      return null;
    if (
      c.kind === "answer" &&
      typeof c.questionId === "string" &&
      ["A", "B", "C", "D"].includes(c.choiceId)
    )
      return p;
    if (c.kind === "audio" && typeof c.unitId === "string") return p;
    if (
      c.kind === "progress" &&
      (c.currentIndex === undefined ||
        (Number.isInteger(c.currentIndex) && c.currentIndex >= 0)) &&
      (c.markedQuestionIds === undefined ||
        (Array.isArray(c.markedQuestionIds) &&
          c.markedQuestionIds.every((v: unknown) => typeof v === "string")))
    )
      return p;
    return null;
  } catch {
    return null;
  }
}
