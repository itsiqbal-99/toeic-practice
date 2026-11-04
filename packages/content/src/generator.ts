import type { QuestionContext, QuestionUnit, TestBlueprint } from "./types";

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function selectExactUnits(
  candidates: QuestionUnit[],
  targetCount: number,
  random: () => number,
): QuestionUnit[] {
  const shuffled = shuffle(candidates, random);

  function visit(index: number, remaining: number): QuestionUnit[] | null {
    if (remaining === 0) return [];
    if (remaining < 0 || index >= shuffled.length) return null;

    const current = shuffled[index];
    const withCurrent = visit(index + 1, remaining - current.questions.length);
    if (withCurrent) return [current, ...withCurrent];
    return visit(index + 1, remaining);
  }

  const selected = visit(0, targetCount);
  if (!selected) {
    throw new Error(
      `Question bank cannot satisfy an exact quota of ${targetCount}.`,
    );
  }
  return selected;
}

export interface GeneratedAttempt {
  selectedUnitIds: string[];
  orderedQuestionIds: string[];
}

export function generateAttempt(
  bank: readonly QuestionUnit[],
  blueprint: TestBlueprint,
  seed: string,
): GeneratedAttempt {
  const random = createSeededRandom(seed);
  const selectedUnits: QuestionUnit[] = [];

  for (const sectionConfig of blueprint.sections) {
    for (const quota of sectionConfig.quotas) {
      const candidates = bank.filter(
        (unit) =>
          unit.section === sectionConfig.section && unit.part === quota.part,
      );
      selectedUnits.push(...selectExactUnits(candidates, quota.count, random));
    }
  }

  const orderedQuestionIds = selectedUnits.flatMap((unit) =>
    unit.questions.map((question) => question.id),
  );
  const uniqueIds = new Set(orderedQuestionIds);

  if (orderedQuestionIds.length !== blueprint.totalQuestions) {
    throw new Error("Generated attempt does not match the configured total.");
  }
  if (uniqueIds.size !== orderedQuestionIds.length) {
    throw new Error("Generated attempt contains duplicate questions.");
  }

  return {
    selectedUnitIds: selectedUnits.map((unit) => unit.id),
    orderedQuestionIds,
  };
}

export function buildQuestionContexts(
  bank: readonly QuestionUnit[],
  selectedUnitIds: readonly string[],
): QuestionContext[] {
  const byId = new Map(bank.map((unit) => [unit.id, unit]));
  const contexts: QuestionContext[] = [];
  for (const unitId of selectedUnitIds) {
    const unit = byId.get(unitId);
    if (!unit) throw new Error(`Question unit ${unitId} is unavailable.`);
    for (const question of unit.questions) {
      contexts.push({ unit, question, index: contexts.length });
    }
  }
  return contexts;
}
