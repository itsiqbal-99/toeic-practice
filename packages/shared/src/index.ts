export type Section = "listening" | "reading";
export const PARTS = {
  photographs: { number: 1, label: "Photographs", section: "listening" },
  "question-response": {
    number: 2,
    label: "Question–response",
    section: "listening",
  },
  "short-conversations": {
    number: 3,
    label: "Conversations",
    section: "listening",
  },
  "short-talks": { number: 4, label: "Short talks", section: "listening" },
  "incomplete-sentences": {
    number: 5,
    label: "Incomplete sentences",
    section: "reading",
  },
  "text-completion": {
    number: 6,
    label: "Text completion",
    section: "reading",
  },
  "single-passage": { number: 7, label: "Single passages", section: "reading" },
  "multiple-passage": {
    number: 7,
    label: "Multiple passages",
    section: "reading",
  },
} as const;
export type Part = keyof typeof PARTS;
export type ChoiceId = "A" | "B" | "C" | "D";
export type Mode = "focused" | "quick" | "mock";
export interface Clip {
  src: string;
  speaker: string;
  text?: string;
}
export type Stimulus =
  | { kind: "none" }
  | {
      kind: "image-audio";
      image: string;
      alt: string;
      audio: { clips: Clip[] };
      transcript?: string;
    }
  | { kind: "audio"; audio: { clips: Clip[] }; transcript?: string }
  | { kind: "passage"; title: string; body: string; sourceLabel?: string }
  | {
      kind: "documents";
      documents: { label: string; title: string; body: string }[];
    };
export interface Question {
  id: string;
  prompt: string;
  choices: { id: ChoiceId; text: string }[];
  difficulty: "easy" | "medium" | "hard";
  skills: string[];
  correctChoiceId?: ChoiceId;
  explanation?: string;
}
export interface Unit {
  id: string;
  section: Section;
  part: Part;
  instruction: string;
  stimulus: Stimulus;
  questions: Question[];
}
export interface Context {
  unit: Unit;
  question: Question;
  index: number;
}
export interface StartInput {
  mode: Mode;
  part?: Part;
  count?: number;
  timed?: boolean;
  immediate?: boolean;
  difficulty?: "easy" | "medium" | "hard";
  skill?: string;
  replay?: boolean;
}
export interface Attempt {
  id: string;
  mode: Mode;
  title: string;
  status: "active" | "completed";
  revision: number;
  contexts: Context[];
  answers: Record<string, ChoiceId>;
  markedQuestionIds: string[];
  currentIndex: number;
  startedAt: string;
  updatedAt: string;
  deadline: string | null;
  serverNow: string;
  immediate: boolean;
  audioPlayedUnitIds: string[];
}
export interface Metric {
  key: string;
  label: string;
  correct: number;
  total: number;
  accuracy: number;
}
export interface HistoryPage {
  items: Result[];
  total: number;
  offset: number;
  limit: number;
}
export interface Result {
  attemptId: string;
  mode: Mode;
  title: string;
  completedAt: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
  elapsedSeconds: number;
  sections: Metric[];
  parts: Metric[];
  skills: Metric[];
  imported?: boolean;
  immediate?: boolean;
  timed?: boolean;
}
export interface Profile {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  guest: boolean;
  googleEnabled: boolean;
  mergeCount: number;
}
export interface Recommendation {
  part: Part;
  skill?: string;
  reason: string;
  sample: number;
}
export interface Overview {
  user: Profile;
  completed: number;
  practiced: number;
  accuracy: number | null;
  sections: Metric[];
  skills: Metric[];
  parts: Metric[];
  active: {
    id: string;
    mode: Mode;
    title: string;
    answered: number;
    total: number;
    updatedAt: string;
  }[];
  history: Result[];
  recommendation: Recommendation | null;
  preferences: { goal: number | null; weeklyTarget: number };
  weeklyCount: number;
}
export interface BlueprintInfo {
  id: string;
  title: string;
  mode: Mode;
  available: boolean;
  count: number;
  minutes: number;
  reason?: string;
}
export interface Catalog {
  parts: {
    id: Part;
    label: string;
    number: number;
    section: Section;
    count: number;
    counts: number[];
    difficulties: string[];
  }[];
  blueprints: BlueprintInfo[];
}
export const MODE_LABELS: Record<Mode, string> = {
  focused: "Focused practice",
  quick: "Quick test",
  mock: "Shortened mock",
};
export function percent(correct: number, total: number): number {
  return total ? Math.round((correct / total) * 1000) / 10 : 0;
}
export function comparisonKey(result: Result): string {
  return [
    result.mode,
    result.totalQuestions,
    Boolean(result.immediate),
    Boolean(result.timed),
    Boolean(result.imported),
    result.parts
      .map((p) => p.key + ":" + p.total)
      .sort()
      .join(","),
  ].join("|");
}
