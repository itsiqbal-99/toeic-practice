"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  LayoutGrid,
  Clock3,
  CloudCheck,
  LoaderCircle,
  Headphones,
  BookOpen,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { PARTS, MODE_LABELS, type Result } from "@toeic/shared";
import { useAttempt } from "@/features/attempt/use-attempt";
import { api, timeLabel } from "@/lib/api";
import { Brand } from "@/components/workspace/shell";
import { FetchState } from "@/components/workspace/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { QuestionRenderer } from "./question-renderer";
function TestContent() {
  const id = useSearchParams().get("attempt") || "",
    router = useRouter(),
    client = useQueryClient();
  const {
    attempt: a,
    isPending,
    error,
    refetch,
    change,
    pending,
    saving,
    saveError,
    retry,
    discard,
    storageWarning,
  } = useAttempt(id);
  const [navigator, setNavigator] = useState(false),
    [confirm, setConfirm] = useState(false),
    [remaining, setRemaining] = useState<number | null>(null);
  const submit = useMutation({
    mutationFn: () =>
      api<Result>("/attempts/" + id + "/submit", { method: "POST" }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["overview"] });
      router.replace("/results?attempt=" + id);
    },
  });
  useEffect(() => {
    if (a?.status === "completed") router.replace("/results?attempt=" + id);
  }, [a?.status, id, router]);
  useEffect(() => {
    if (!a?.deadline) return;
    const offset = Date.parse(a.serverNow) - Date.now(),
      deadline = Date.parse(a.deadline);
    const timer = setInterval(() => {
      const seconds = Math.max(
        0,
        Math.ceil((deadline - Date.now() - offset) / 1000),
      );
      setRemaining(seconds);
      if (seconds === 0) {
        clearInterval(timer);
        void refetch();
      }
    }, 500);
    return () => clearInterval(timer);
  }, [a?.deadline, a?.serverNow, refetch]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pending]);
  const current = a?.contexts[a.currentIndex];
  const feedback = useQuery({
    queryKey: ["feedback", id, current?.question.id],
    queryFn: () =>
      api<{ correctChoiceId: string; explanation: string }>(
        `/attempts/${id}/feedback/${current?.question.id}`,
      ),
    enabled: Boolean(
      a?.immediate && current && a.answers[current.question.id] && !pending,
    ),
  });
  if (!id)
    return (
      <main className="standalone">
        <Brand />
        <h1>No session selected</h1>
        <p>Choose a practice session or resume one from your dashboard.</p>
        <Link className="button button--solid button--brand" href="/">
          Open dashboard
        </Link>
      </main>
    );
  if (isPending || !a || !current)
    return (
      <main className="standalone">
        <Brand />
        <FetchState
          loading={isPending}
          error={error}
          retry={() => void refetch()}
        />
        <Link className="text-link" href="/">
          Return to dashboard
        </Link>
      </main>
    );
  const answered = Object.keys(a.answers).length,
    marked = a.markedQuestionIds.includes(current.question.id),
    busy = saving || Boolean(pending) || submit.isPending;
  const navigate = async (index: number) => {
    try {
      await change({ kind: "progress", currentIndex: index });
      setNavigator(false);
      requestAnimationFrame(()=>document.getElementById("question-heading")?.focus());
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {}
  };
  const grid = (
    <div className="navigator-content">
      <div className="navigator-summary">
        <strong>
          {answered} / {a.contexts.length}
        </strong>
        <span>answered</span>
      </div>
      <div className="navigator-legend">
        <span>
          <i />
          Answered
        </span>
        <span>
          <Bookmark />
          Marked
        </span>
      </div>
      {(["listening", "reading"] as const).map((section) =>
        a.contexts.some((c) => c.unit.section === section) ? (
          <section key={section} className="navigator-section">
            <h3>{section === "listening" ? "Listening" : "Reading"}</h3>
            <div className="answer-grid">
              {a.contexts
                .filter((c) => c.unit.section === section)
                .map((c) => (
                  <button
                    key={c.question.id}
                    disabled={busy}
                    className={
                      "answer-cell " +
                      (a.currentIndex === c.index ? "current " : "") +
                      (a.answers[c.question.id] ? "answered " : "") +
                      (a.markedQuestionIds.includes(c.question.id)
                        ? "marked"
                        : "")
                    }
                    aria-label={`Question ${c.index + 1}, ${a.answers[c.question.id] ? "answered" : "unanswered"}${a.markedQuestionIds.includes(c.question.id) ? ", marked" : ""}`}
                    aria-current={
                      a.currentIndex === c.index ? "step" : undefined
                    }
                    onClick={() => void navigate(c.index)}
                  >
                    {c.index + 1}
                    {a.markedQuestionIds.includes(c.question.id) ? (
                      <span className="marked-corner" aria-hidden="true" />
                    ) : null}
                  </button>
                ))}
            </div>
          </section>
        ) : null,
      )}
    </div>
  );
  return (
    <div className={"exam " + (a.mode === "mock" ? "exam--strict" : "")}>
      <a className="skip-link" href="#question-heading">
        Skip to question
      </a>
      <header className="exam-header">
        <Brand />
        <div className="exam-title">
          <span>{MODE_LABELS[a.mode]}</span>
          <strong>{a.title}</strong>
        </div>
        <div className="exam-header-actions">
          {a.deadline ? (
            <span
              className={
                "timer " +
                (remaining !== null && remaining < 300 ? "timer-warning" : "")
              }
              aria-label="Time remaining"
            >
              <Clock3 aria-hidden="true" />
              {remaining === null ? "--:--" : timeLabel(remaining)}
            </span>
          ) : (
            <span className="untimed">
              <Clock3 />
              Untimed
            </span>
          )}
          <Link
            className="icon-button"
            href="/"
            aria-label="Save and exit to dashboard"
          >
            <LogOut />
          </Link>
        </div>
      </header>
      <div
        className="exam-progress"
        role="progressbar"
        aria-label="Questions answered"
        aria-valuemin={0}
        aria-valuemax={a.contexts.length}
        aria-valuenow={answered}
      >
        <span style={{ width: (answered / a.contexts.length) * 100 + "%" }} />
      </div>
      <span className="sr-only" role="status" aria-label="Answered progress">
        {answered} of {a.contexts.length} questions answered.
      </span>
      <div className="exam-content">
        <main className="exam-main">
          <div className="exam-context">
            <span className="tag">
              {current.unit.section === "listening" ? (
                <Headphones />
              ) : (
                <BookOpen />
              )}
              PART {PARTS[current.unit.part].number}
            </span>
            <span>{PARTS[current.unit.part].label}</span>
            <button
              className={"mark-button " + (marked ? "is-marked" : "")}
              aria-pressed={marked}
              disabled={busy}
              onClick={() =>
                void change({
                  kind: "progress",
                  markedQuestionIds: marked
                    ? a.markedQuestionIds.filter(
                        (q) => q !== current.question.id,
                      )
                    : [...a.markedQuestionIds, current.question.id],
                }).catch(() => {})
              }
            >
              <Bookmark />
              {marked ? "Marked" : "Mark for review"}
            </button>
          </div>
          <div className="question-heading-row">
            <h1 id="question-heading" tabIndex={-1}>
              Question {a.currentIndex + 1}
              <span>of {a.contexts.length}</span>
            </h1>
            <span
              className="save-status"
              role="status"
              aria-label="Save status"
            >
              {saving ? (
                <>
                  <LoaderCircle className="spin" />
                  Saving…
                </>
              ) : pending ? (
                <>
                  <AlertTriangle />
                  Not synced
                </>
              ) : (
                <>
                  <CloudCheck />
                  Saved
                </>
              )}
            </span>
          </div>
          <p className="question-instruction">{current.unit.instruction}</p>
          {pending && !saving ? (
            <div className="inline-alert" role="alert">
              <p>
                {saveError?.message ||
                  "A change from this browser is waiting to sync."}
              </p>
              <div className="inline-actions">
                <Button
                  emphasis="outline"
                  onClick={() => void retry().catch(() => {})}
                >
                  Retry save
                </Button>
                <Button emphasis="ghost" onClick={discard}>
                  Use server’s saved state
                </Button>
              </div>
            </div>
          ) : null}
          {storageWarning ? (
            <p className="inline-alert" role="status">
              {storageWarning}
            </p>
          ) : null}
          <QuestionRenderer
            context={current}
            selectedChoice={a.answers[current.question.id]}
            onAnswer={(choice) =>
              void change({
                kind: "answer",
                questionId: current.question.id,
                choiceId: choice,
              }).catch(() => {})
            }
            disabled={
              busy ||
              (a.immediate && Boolean(a.answers[current.question.id])) ||
              remaining === 0
            }
            strict={a.mode === "mock"}
            played={a.audioPlayedUnitIds.includes(current.unit.id)}
            onAudioBegin={
              a.mode === "mock"
                ? () => change({ kind: "audio", unitId: current.unit.id })
                : undefined
            }
          />
          {feedback.data ? (
            <div
              className={
                "answer-feedback " +
                (feedback.data.correctChoiceId ===
                a.answers[current.question.id]
                  ? "correct"
                  : "incorrect")
              }
              role="status"
            >
              <strong>
                {feedback.data.correctChoiceId ===
                a.answers[current.question.id]
                  ? "That’s correct."
                  : `The correct answer is ${feedback.data.correctChoiceId}.`}
              </strong>
              <p>{feedback.data.explanation}</p>
            </div>
          ) : null}
          {feedback.error ? (
            <p className="inline-alert">
              Feedback couldn’t load.{" "}
              <button onClick={() => void feedback.refetch()}>
                Retry feedback
              </button>
            </p>
          ) : null}
        </main>
        <aside className="exam-sidebar">
          <div className="exam-sidebar-heading">
            <span className="step-label">YOUR ANSWER SHEET</span>
            <h2>Session overview</h2>
          </div>
          {grid}
          <Button
            emphasis="outline"
            disabled={busy}
            onClick={() => setConfirm(true)}
          >
            Review and submit <Check />
          </Button>
          <p className="fine-print">
            {a.mode === "mock"
              ? "Audio has one playback per group. Browser controls do not provide proctoring or anti-cheat security."
              : "Your question position and answered progress are tracked separately."}
          </p>
        </aside>
      </div>
      <footer className="exam-actions">
        <Button
          emphasis="outline"
          disabled={busy || a.currentIndex === 0}
          onClick={() => void navigate(a.currentIndex - 1)}
        >
          <ArrowLeft />
          Previous
        </Button>
        <button
          className="question-drawer-trigger"
          onClick={() => setNavigator(true)}
          aria-label="Open question navigator"
        >
          <LayoutGrid />
          <span>
            {answered}/{a.contexts.length} answered
          </span>
        </button>
        <span className="desktop-question-count">
          {answered} of {a.contexts.length} answered
        </span>
        {a.currentIndex === a.contexts.length - 1 ? (
          <Button disabled={busy} onClick={() => setConfirm(true)}>
            Review & submit <Check />
          </Button>
        ) : (
          <Button
            disabled={busy}
            onClick={() => void navigate(a.currentIndex + 1)}
          >
            Next <ArrowRight />
          </Button>
        )}
      </footer>
      <Dialog
        open={navigator}
        onOpenChange={setNavigator}
        title="Question navigator"
        description={`${answered} answered, ${a.contexts.length - answered} unanswered`}
        variant="drawer"
      >
        {grid}
        <Button
          disabled={busy}
          onClick={() => {
            setNavigator(false);
            setConfirm(true);
          }}
        >
          Review and submit
        </Button>
      </Dialog>
      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Ready to finish?"
        description="Your saved answers will be scored. You can review every explanation after submitting."
        showClose={false}
      >
        <div className="submit-counts">
          <div>
            <strong>{answered}</strong>
            <span>Answered</span>
          </div>
          <div>
            <strong>{a.contexts.length - answered}</strong>
            <span>Unanswered</span>
          </div>
          <div>
            <strong>{a.markedQuestionIds.length}</strong>
            <span>Marked</span>
          </div>
        </div>
        {answered < a.contexts.length ? (
          <p className="notice">
            Unanswered questions count toward the total and reduce accuracy.
          </p>
        ) : null}
        {submit.error ? (
          <p className="inline-alert" role="alert">
            {submit.error.message}
          </p>
        ) : null}
        <div className="dialog__actions">
          <DialogClose asChild>
            <Button emphasis="outline">Return to test</Button>
          </DialogClose>
          <Button
            busy={submit.isPending}
            disabled={Boolean(pending)}
            onClick={() => submit.mutate()}
          >
            Submit session
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
export function TestWorkspace() {
  return (
    <Suspense fallback={<FetchState loading />}>
      <TestContent />
    </Suspense>
  );
}
