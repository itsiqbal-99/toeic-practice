import { BadRequestException } from "@nestjs/common";
import {
  generateAttempt,
  TEST_BLUEPRINT,
  type QuestionUnit,
  type TestBlueprint,
} from "@toeic/content";
import {
  PARTS,
  percent,
  type Context,
  type Metric,
  type Mode,
  type Result,
  type StartInput,
  type ChoiceId,
} from "@toeic/shared";

export function reachableCounts(units: QuestionUnit[]): number[] {
  const reachable = new Set([0]);
  for (const unit of units)
    for (const count of [...reachable])
      reachable.add(count + unit.questions.length);
  return [...reachable].filter((n) => n > 0).sort((a, b) => a - b);
}
export function filterUnits(
  bank: QuestionUnit[],
  input: Pick<StartInput, "replay" | "difficulty" | "skill">,
  mistakeIds: string[] = [],
) {
  let candidates = bank;
  if (input.replay)
    candidates = candidates.filter((u) =>
      u.questions.some((q) => mistakeIds.includes(q.id)),
    );
  if (input.skill)
    candidates = candidates.filter((u) =>
      u.questions.some((q) => q.skills.includes(input.skill as never)),
    );
  if (input.difficulty)
    candidates = candidates.filter((u) =>
      u.questions.every((q) => q.difficulty === input.difficulty),
    );
  return candidates;
}
export function selectQuestions(
  bank: QuestionUnit[],
  input: StartInput,
  seed: string,
  mistakeIds: string[] = [],
) {
  const candidates = filterUnits(bank, input, mistakeIds);
  if (input.replay && !candidates.length)
    throw new BadRequestException(
      "No unresolved mistakes match these filters. Try another part or complete a practice session first.",
    );
  let blueprint: TestBlueprint;
  if (input.mode === "mock") blueprint = TEST_BLUEPRINT;
  else if (input.mode === "quick") {
    const count = input.count || 12;
    if (![12, 24].includes(count))
      throw new BadRequestException("Quick tests contain 12 or 24 questions.");
    const n = count / 4;
    blueprint = {
      id: "quick",
      title: "Quick test",
      totalQuestions: count,
      sections: [
        {
          section: "listening",
          quotas: [
            { part: "photographs", count: n },
            { part: "short-conversations", count: n },
          ],
        },
        {
          section: "reading",
          quotas: [
            { part: "incomplete-sentences", count: n },
            { part: "single-passage", count: n },
          ],
        },
      ],
    };
  } else {
    const part = input.part || candidates[0]?.part;
    if (!part) throw new BadRequestException("Choose an available part.");
    const units = candidates.filter((u) => u.part === part);
    const counts = reachableCounts(units);
    const target = input.count || counts.find((n) => n >= 5) || counts[0];
    if (!target || !counts.includes(target))
      throw new BadRequestException(
        "This count cannot preserve the available question groups. Choose another count.",
      );
    blueprint = {
      id: "focused",
      title: PARTS[part].label,
      totalQuestions: target,
      sections: [
        { section: PARTS[part].section, quotas: [{ part, count: target }] },
      ],
    };
  }
  try {
    const selected = generateAttempt(candidates, blueprint, seed);
    return {
      ...selected,
      title:
        input.mode === "mock"
          ? "100-question shortened mock"
          : input.mode === "quick"
            ? `${blueprint.totalQuestions}-question quick test`
            : `Part ${PARTS[input.part || candidates.find((u) => selected.selectedUnitIds.includes(u.id))!.part].number} · ${blueprint.title}`,
    };
  } catch {
    throw new BadRequestException(
      "The validated bank cannot satisfy this configuration without repeating questions.",
    );
  }
}
export function score(
  contexts: Context[],
  answers: Record<string, ChoiceId>,
  info: {
    id: string;
    mode: Mode;
    title: string;
    startedAt: Date;
    completedAt: Date;
    immediate?: boolean;
    timed?: boolean;
  },
): Result {
  const make = (key: string, label: string, items: Context[]): Metric => {
    const correct = items.filter(
      (c) => answers[c.question.id] === c.question.correctChoiceId,
    ).length;
    return {
      key,
      label,
      correct,
      total: items.length,
      accuracy: percent(correct, items.length),
    };
  };
  const correct = contexts.filter(
    (c) => answers[c.question.id] === c.question.correctChoiceId,
  ).length;
  const answered = contexts.filter((c) => answers[c.question.id]).length;
  return {
    attemptId: info.id,
    mode: info.mode,
    title: info.title,
    completedAt: info.completedAt.toISOString(),
    immediate: Boolean(info.immediate),
    timed: Boolean(info.timed),
    totalQuestions: contexts.length,
    correct,
    incorrect: answered - correct,
    unanswered: contexts.length - answered,
    accuracy: percent(correct, contexts.length),
    elapsedSeconds: Math.max(
      0,
      Math.round((+info.completedAt - +info.startedAt) / 1000),
    ),
    sections: (["listening", "reading"] as const)
      .map((s) =>
        make(
          s,
          s === "listening" ? "Listening" : "Reading",
          contexts.filter((c) => c.unit.section === s),
        ),
      )
      .filter((m) => m.total),
    parts: [...new Set(contexts.map((c) => c.unit.part))].map((p) =>
      make(
        p,
        `Part ${PARTS[p].number} · ${PARTS[p].label}`,
        contexts.filter((c) => c.unit.part === p),
      ),
    ),
    skills: [...new Set(contexts.flatMap((c) => c.question.skills))].map((s) =>
      make(
        s,
        s.replaceAll("-", " "),
        contexts.filter((c) => c.question.skills.includes(s)),
      ),
    ),
  };
}
export function publicContexts(contexts: Context[], review = false): Context[] {
  return contexts.map(({ unit, question, index }) => {
    const stimulus = structuredClone(unit.stimulus);
    if (
      !review &&
      (stimulus.kind === "audio" || stimulus.kind === "image-audio")
    ) {
      delete stimulus.transcript;
      stimulus.audio.clips = stimulus.audio.clips.map(({ src, speaker }) => ({
        src,
        speaker,
      }));
      if (stimulus.kind === "image-audio")
        stimulus.alt = "Workplace photograph for this listening question";
    }
    const visible = (q: Context["question"]) => ({
      id: q.id,
      prompt: q.prompt,
      difficulty: q.difficulty,
      skills: q.skills,
      choices: q.choices.map((c) => ({
        id: c.id,
        text:
          !review && ["photographs", "question-response"].includes(unit.part)
            ? `Option ${c.id}`
            : c.text,
      })),
      ...(review
        ? { correctChoiceId: q.correctChoiceId, explanation: q.explanation }
        : {}),
    });
    return {
      unit: {
        id: unit.id,
        part: unit.part,
        section: unit.section,
        instruction: unit.instruction,
        stimulus,
        questions: unit.questions.map(visible),
      },
      question: visible(question),
      index,
    };
  });
}
