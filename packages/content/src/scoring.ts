import type {
  AbilityBand,
  AttemptSession,
  PerformanceMetric,
  QuestionContext,
  ScoreResult,
} from "./types";
import { PART_LABELS } from "./config";

function accuracy(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 1000) / 10;
}

export function scaleSectionScore(correct: number, total: number): number {
  if (total <= 0) return 5;
  const raw = 5 + 490 * (correct / total);
  return Math.max(5, Math.min(495, Math.round(raw / 5) * 5));
}

export function getAbilityBand(score: number): AbilityBand {
  if (score >= 850) return "Advanced";
  if (score >= 650) return "Upper Intermediate";
  if (score >= 450) return "Intermediate";
  if (score >= 250) return "Elementary";
  return "Beginner";
}

function metric(
  key: string,
  label: string,
  contexts: QuestionContext[],
  answers: AttemptSession["answers"],
): PerformanceMetric {
  const correct = contexts.filter(
    ({ question }) => answers[question.id] === question.correctChoiceId,
  ).length;
  return {
    key,
    label,
    correct,
    total: contexts.length,
    accuracy: accuracy(correct, contexts.length),
  };
}

export function scoreAttempt(
  session: AttemptSession,
  contexts: QuestionContext[],
  completedAt = new Date().toISOString(),
): ScoreResult {
  const listening = contexts.filter(({ unit }) => unit.section === "listening");
  const reading = contexts.filter(({ unit }) => unit.section === "reading");
  const correct = contexts.filter(
    ({ question }) => session.answers[question.id] === question.correctChoiceId,
  ).length;
  const answered = contexts.filter(({ question }) =>
    Boolean(session.answers[question.id]),
  ).length;
  const listeningCorrect = metric(
    "listening",
    "Listening",
    listening,
    session.answers,
  );
  const readingCorrect = metric("reading", "Reading", reading, session.answers);
  const listeningScore = scaleSectionScore(
    listeningCorrect.correct,
    listening.length,
  );
  const readingScore = scaleSectionScore(
    readingCorrect.correct,
    reading.length,
  );
  const parts = Array.from(new Set(contexts.map(({ unit }) => unit.part)));

  return {
    schemaVersion: 1,
    attemptId: session.id,
    candidateName: session.candidateName,
    completedAt,
    totalQuestions: contexts.length,
    correct,
    incorrect: answered - correct,
    unanswered: contexts.length - answered,
    accuracy: accuracy(correct, contexts.length),
    listeningScore,
    readingScore,
    estimatedScore: listeningScore + readingScore,
    abilityBand: getAbilityBand(listeningScore + readingScore),
    sectionMetrics: [listeningCorrect, readingCorrect],
    categoryMetrics: parts.map((part) =>
      metric(
        part,
        PART_LABELS[part],
        contexts.filter(({ unit }) => unit.part === part),
        session.answers,
      ),
    ),
    orderedQuestionIds: [...session.orderedQuestionIds],
    selectedUnitIds: [...session.selectedUnitIds],
    answers: { ...session.answers },
  };
}
