import type { AudioPolicy, QuestionPart, TestBlueprint } from "./types";

export const TEST_BLUEPRINT: TestBlueprint = {
  id: "practice-100-v1",
  title: "Listening & Reading Practice Test",
  totalQuestions: 100,
  sections: [
    {
      section: "listening",
      quotas: [
        { part: "photographs", count: 6 },
        { part: "question-response", count: 14 },
        { part: "short-conversations", count: 15 },
        { part: "short-talks", count: 15 },
      ],
    },
    {
      section: "reading",
      quotas: [
        { part: "incomplete-sentences", count: 20 },
        { part: "text-completion", count: 12 },
        { part: "single-passage", count: 9 },
        { part: "multiple-passage", count: 9 },
      ],
    },
  ],
};

export const AUDIO_POLICY: AudioPolicy = {
  autoplay: false,
  allowSeeking: true,
  maxPlays: null,
  resetOnQuestionChange: true,
};

export const PART_LABELS: Record<QuestionPart, string> = {
  photographs: "Photographs",
  "question-response": "Question–Response",
  "short-conversations": "Short Conversations",
  "short-talks": "Short Talks",
  "incomplete-sentences": "Incomplete Sentences",
  "text-completion": "Text Completion",
  "single-passage": "Single Passage",
  "multiple-passage": "Multiple Passage",
};

export const STORAGE_KEYS = {
  activeAttempt: "practice-desk:active-attempt:v1",
  latestResult: "practice-desk:latest-result:v1",
} as const;

export const SESSION_SCHEMA_VERSION = 1 as const;

export const PROFICIENCY_DESCRIPTIONS = {
  Beginner:
    "You can understand familiar words and very short workplace messages.",
  Elementary:
    "You can handle routine exchanges and identify key details in straightforward texts.",
  Intermediate:
    "You can follow common workplace discussions and understand the main point of varied texts.",
  "Upper Intermediate":
    "You can process detailed professional communication with generally reliable accuracy.",
  Advanced:
    "You can understand complex spoken and written workplace English with strong precision.",
} as const;
