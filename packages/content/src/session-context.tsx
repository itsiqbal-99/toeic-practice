"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { QUESTION_BANK } from "./question-bank";
import { TEST_BLUEPRINT } from "./config";
import { buildQuestionContexts, generateAttempt } from "./generator";
import { scoreAttempt } from "./scoring";
import { sessionStorageApi } from "./storage";
import type {
  AttemptSession,
  Choice,
  QuestionContext,
  ScoreResult,
} from "./types";

type HydrationStatus = "loading" | "ready" | "corrupt";

interface State {
  hydrationStatus: HydrationStatus;
  activeSession: AttemptSession | null;
  latestResult: ScoreResult | null;
  persistenceWarning: boolean;
}

type Action =
  | {
      type: "hydrate";
      session: AttemptSession | null;
      result: ScoreResult | null;
      corrupt: boolean;
    }
  | { type: "set-session"; session: AttemptSession | null; persisted: boolean }
  | { type: "set-result"; result: ScoreResult | null; persisted: boolean }
  | { type: "dismiss-corrupt" };

const initialState: State = {
  hydrationStatus: "loading",
  activeSession: null,
  latestResult: null,
  persistenceWarning: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        hydrationStatus: action.corrupt ? "corrupt" : "ready",
        activeSession: action.session,
        latestResult: action.result,
      };
    case "set-session":
      return {
        ...state,
        activeSession: action.session,
        persistenceWarning: !action.persisted,
      };
    case "set-result":
      return {
        ...state,
        latestResult: action.result,
        persistenceWarning: !action.persisted,
      };
    case "dismiss-corrupt":
      return { ...state, hydrationStatus: "ready" };
  }
}

interface TestSessionValue extends State {
  activeContexts: QuestionContext[];
  resultContexts: QuestionContext[];
  startAttempt: (candidateName: string) => AttemptSession;
  answerQuestion: (questionId: string, choiceId: Choice["id"]) => void;
  toggleMark: (questionId: string) => void;
  goToQuestion: (index: number) => void;
  submitAttempt: () => ScoreResult | null;
  discardAttempt: () => void;
  clearCorruptData: () => void;
}

const TestSessionContext = createContext<TestSessionValue | null>(null);

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function TestSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const attemptRead = sessionStorageApi.readAttempt();
    const resultRead = sessionStorageApi.readResult();
    dispatch({
      type: "hydrate",
      session: attemptRead.status === "valid" ? attemptRead.value : null,
      result: resultRead.status === "valid" ? resultRead.value : null,
      corrupt:
        attemptRead.status === "corrupt" || resultRead.status === "corrupt",
    });
  }, []);

  const activeContexts = useMemo(() => {
    if (!state.activeSession) return [];
    try {
      return buildQuestionContexts(
        QUESTION_BANK,
        state.activeSession.selectedUnitIds,
      );
    } catch {
      return [];
    }
  }, [state.activeSession]);

  const resultContexts = useMemo(() => {
    if (!state.latestResult) return [];
    try {
      return buildQuestionContexts(
        QUESTION_BANK,
        state.latestResult.selectedUnitIds,
      );
    } catch {
      return [];
    }
  }, [state.latestResult]);

  const persistSession = useCallback((session: AttemptSession | null) => {
    const persisted = session
      ? sessionStorageApi.writeAttempt(session)
      : (sessionStorageApi.removeAttempt(), true);
    dispatch({ type: "set-session", session, persisted });
  }, []);

  const startAttempt = useCallback(
    (candidateName: string) => {
      const id = createId();
      const seed = `${id}:${candidateName}:${Date.now()}`;
      const generated = generateAttempt(QUESTION_BANK, TEST_BLUEPRINT, seed);
      const now = new Date().toISOString();
      const session: AttemptSession = {
        schemaVersion: 1,
        id,
        candidateName: candidateName.trim(),
        blueprintId: TEST_BLUEPRINT.id,
        seed,
        selectedUnitIds: generated.selectedUnitIds,
        orderedQuestionIds: generated.orderedQuestionIds,
        answers: {},
        markedQuestionIds: [],
        currentIndex: 0,
        startedAt: now,
        updatedAt: now,
      };
      persistSession(session);
      return session;
    },
    [persistSession],
  );

  const updateSession = useCallback(
    (updater: (session: AttemptSession) => AttemptSession) => {
      if (!state.activeSession) return;
      persistSession(updater(state.activeSession));
    },
    [persistSession, state.activeSession],
  );

  const answerQuestion = useCallback(
    (questionId: string, choiceId: Choice["id"]) => {
      updateSession((session) => ({
        ...session,
        answers: { ...session.answers, [questionId]: choiceId },
        updatedAt: new Date().toISOString(),
      }));
    },
    [updateSession],
  );

  const toggleMark = useCallback(
    (questionId: string) => {
      updateSession((session) => {
        const marked = new Set(session.markedQuestionIds);
        if (marked.has(questionId)) marked.delete(questionId);
        else marked.add(questionId);
        return {
          ...session,
          markedQuestionIds: [...marked],
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [updateSession],
  );

  const goToQuestion = useCallback(
    (index: number) => {
      updateSession((session) => ({
        ...session,
        currentIndex: Math.max(
          0,
          Math.min(session.orderedQuestionIds.length - 1, index),
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [updateSession],
  );

  const submitAttempt = useCallback(() => {
    if (!state.activeSession || activeContexts.length === 0) return null;
    const result = scoreAttempt(state.activeSession, activeContexts);
    const persisted = sessionStorageApi.writeResult(result);
    sessionStorageApi.removeAttempt();
    dispatch({ type: "set-result", result, persisted });
    dispatch({ type: "set-session", session: null, persisted: true });
    return result;
  }, [activeContexts, state.activeSession]);

  const discardAttempt = useCallback(
    () => persistSession(null),
    [persistSession],
  );

  const clearCorruptData = useCallback(() => {
    sessionStorageApi.removeAttempt();
    sessionStorageApi.removeResult();
    dispatch({ type: "dismiss-corrupt" });
  }, []);

  const value = useMemo<TestSessionValue>(
    () => ({
      ...state,
      activeContexts,
      resultContexts,
      startAttempt,
      answerQuestion,
      toggleMark,
      goToQuestion,
      submitAttempt,
      discardAttempt,
      clearCorruptData,
    }),
    [
      state,
      activeContexts,
      resultContexts,
      startAttempt,
      answerQuestion,
      toggleMark,
      goToQuestion,
      submitAttempt,
      discardAttempt,
      clearCorruptData,
    ],
  );

  return (
    <TestSessionContext.Provider value={value}>
      {children}
    </TestSessionContext.Provider>
  );
}

export function useTestSession(): TestSessionValue {
  const value = useContext(TestSessionContext);
  if (!value)
    throw new Error("useTestSession must be used inside TestSessionProvider.");
  return value;
}
