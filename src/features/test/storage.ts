import { STORAGE_KEYS } from "./config";
import type { AttemptSession, ScoreResult } from "./types";

export type StorageRead<T> =
  | { status: "empty" }
  | { status: "valid"; value: T }
  | { status: "corrupt" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isAttemptSession(value: unknown): value is AttemptSession {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    typeof value.id === "string" &&
    typeof value.candidateName === "string" &&
    typeof value.seed === "string" &&
    Array.isArray(value.selectedUnitIds) &&
    value.selectedUnitIds.every((item) => typeof item === "string") &&
    Array.isArray(value.orderedQuestionIds) &&
    value.orderedQuestionIds.every((item) => typeof item === "string") &&
    isRecord(value.answers) &&
    Array.isArray(value.markedQuestionIds) &&
    typeof value.currentIndex === "number" &&
    typeof value.startedAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

export function isScoreResult(value: unknown): value is ScoreResult {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    typeof value.attemptId === "string" &&
    typeof value.candidateName === "string" &&
    typeof value.estimatedScore === "number" &&
    typeof value.listeningScore === "number" &&
    typeof value.readingScore === "number" &&
    Array.isArray(value.orderedQuestionIds) &&
    Array.isArray(value.selectedUnitIds) &&
    isRecord(value.answers)
  );
}

function read<T>(key: string, validate: (value: unknown) => value is T): StorageRead<T> {
  if (typeof window === "undefined") return { status: "empty" };
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { status: "empty" };
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? { status: "valid", value: parsed } : { status: "corrupt" };
  } catch {
    return { status: "corrupt" };
  }
}

function write(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // The in-memory session remains usable when storage is unavailable.
  }
}

export const sessionStorageApi = {
  readAttempt: () => read(STORAGE_KEYS.activeAttempt, isAttemptSession),
  writeAttempt: (value: AttemptSession) => write(STORAGE_KEYS.activeAttempt, value),
  removeAttempt: () => remove(STORAGE_KEYS.activeAttempt),
  readResult: () => read(STORAGE_KEYS.latestResult, isScoreResult),
  writeResult: (value: ScoreResult) => write(STORAGE_KEYS.latestResult, value),
  removeResult: () => remove(STORAGE_KEYS.latestResult),
};
