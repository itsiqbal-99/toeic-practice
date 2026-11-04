import { PARTS, type Part, type Recommendation } from "@toeic/shared";
export interface Observation {
  part: Part;
  skills: string[];
  correct: boolean;
}
export function recommend(recent: Observation[]): Recommendation | null {
  const groups = new Map<
    string,
    { part: Part; skill?: string; total: number; correct: number }
  >();
  for (const row of recent)
    for (const skill of [undefined, ...row.skills]) {
      const key = row.part + ":" + (skill || "");
      const sample = groups.get(key) || {
        part: row.part,
        skill,
        total: 0,
        correct: 0,
      };
      sample.total++;
      if (row.correct) sample.correct++;
      groups.set(key, sample);
    }
  const weak = [...groups.values()]
    .filter((g) => g.total >= 5 && g.correct / g.total < 0.7)
    .sort(
      (a, b) =>
        a.correct / a.total - b.correct / b.total ||
        Number(Boolean(b.skill)) - Number(Boolean(a.skill)) ||
        b.total - a.total,
    )[0];
  return weak
    ? {
        part: weak.part,
        skill: weak.skill,
        sample: weak.total,
        reason: `Part ${PARTS[weak.part].number}${weak.skill ? " " + weak.skill.replaceAll("-", " ") : ""} needs attention — ${weak.total - weak.correct} of your last ${weak.total} answered questions in this group were incorrect.`,
      }
    : null;
}
