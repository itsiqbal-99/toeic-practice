export type Section = "listening" | "reading";

export type QuestionPart =
  | "photographs"
  | "question-response"
  | "short-conversations"
  | "short-talks"
  | "incomplete-sentences"
  | "text-completion"
  | "single-passage"
  | "multiple-passage";

export type Difficulty = "easy" | "medium" | "hard";

export type Skill =
  | "detail"
  | "inference"
  | "purpose"
  | "grammar"
  | "vocabulary"
  | "reading-comprehension"
  | "listening-comprehension";

export interface Choice {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface AudioClip {
  src: string;
  speaker: string;
  text: string;
}

export interface AudioSequence {
  clips: AudioClip[];
}

export type Stimulus =
  | { kind: "none" }
  | {
      kind: "image-audio";
      image: string;
      alt: string;
      audio: AudioSequence;
      transcript: string;
    }
  | {
      kind: "audio";
      audio: AudioSequence;
      transcript: string;
    }
  | {
      kind: "passage";
      title: string;
      body: string;
      sourceLabel?: string;
    }
  | {
      kind: "documents";
      documents: Array<{ label: string; title: string; body: string }>;
    };

export interface Question {
  id: string;
  prompt: string;
  choices: Choice[];
  correctChoiceId: Choice["id"];
  explanation: string;
  difficulty: Difficulty;
  skills: Skill[];
}

export interface QuestionUnit {
  id: string;
  section: Section;
  part: QuestionPart;
  instruction: string;
  stimulus: Stimulus;
  questions: Question[];
}

export interface PartQuota {
  part: QuestionPart;
  count: number;
}

export interface TestBlueprint {
  id: string;
  title: string;
  totalQuestions: number;
  sections: Array<{ section: Section; quotas: PartQuota[] }>;
}

export interface AudioPolicy {
  autoplay: boolean;
  allowSeeking: boolean;
  maxPlays: number | null;
  resetOnQuestionChange: boolean;
}

export interface AttemptSession {
  schemaVersion: 1;
  id: string;
  candidateName: string;
  blueprintId: string;
  seed: string;
  selectedUnitIds: string[];
  orderedQuestionIds: string[];
  answers: Record<string, Choice["id"]>;
  markedQuestionIds: string[];
  currentIndex: number;
  startedAt: string;
  updatedAt: string;
}

export interface PerformanceMetric {
  key: string;
  label: string;
  correct: number;
  total: number;
  accuracy: number;
}

export type AbilityBand =
  | "Beginner"
  | "Elementary"
  | "Intermediate"
  | "Upper Intermediate"
  | "Advanced";

export interface ScoreResult {
  schemaVersion: 1;
  attemptId: string;
  candidateName: string;
  completedAt: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
  listeningScore: number;
  readingScore: number;
  estimatedScore: number;
  abilityBand: AbilityBand;
  sectionMetrics: PerformanceMetric[];
  categoryMetrics: PerformanceMetric[];
  orderedQuestionIds: string[];
  selectedUnitIds: string[];
  answers: Record<string, Choice["id"]>;
}

export interface QuestionContext {
  unit: QuestionUnit;
  question: Question;
  index: number;
}
