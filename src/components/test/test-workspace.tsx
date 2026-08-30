"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Bookmark, Check, ClipboardList, Headphones, Menu } from "lucide-react";
import { useTestSession } from "@/features/test/session-context";
import { PART_LABELS } from "@/features/test/config";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { RecoveryState } from "@/components/ui/recovery-state";
import { QuestionNavigator } from "./question-navigator";
import { QuestionRenderer } from "./question-renderer";

export function TestWorkspace() {
  const router = useRouter();
  const { hydrationStatus, activeSession, activeContexts, answerQuestion, toggleMark, goToQuestion, submitAttempt, persistenceWarning } = useTestSession();
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrationStatus === "ready" && activeSession && activeContexts.length) {
      document.getElementById("question-heading")?.focus();
    }
  }, [hydrationStatus, activeContexts.length, activeSession]);

  const totals = useMemo(() => {
    if (!activeSession) return { answered: 0, unanswered: 0, marked: 0 };
    const answered = activeContexts.filter(({ question }) => Boolean(activeSession.answers[question.id])).length;
    return { answered, unanswered: activeContexts.length - answered, marked: activeSession.markedQuestionIds.length };
  }, [activeContexts, activeSession]);

  if (hydrationStatus === "loading") return <LoadingState />;
  if (!activeSession || activeContexts.length !== 100) return <RecoveryState title="No active test was found" message="Start a new practice test or resume one saved in this browser." />;

  const context = activeContexts[activeSession.currentIndex];
  if (!context) return <RecoveryState title="This question is unavailable" message="The saved attempt does not match the current question bank." />;
  const marked = activeSession.markedQuestionIds.includes(context.question.id);
  const progress = ((activeSession.currentIndex + 1) / activeContexts.length) * 100;

  const navigate = (index: number) => {
    goToQuestion(index);
    setNavigatorOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const completeSubmission = () => {
    setSubmitting(true);
    const result = submitAttempt();
    if (result) router.replace("/results");
    else setSubmitting(false);
  };

  return (
    <main className="test-page">
      <header className="test-header">
        <div className="test-header__brand"><span className="wordmark__mark">PD</span><span>Practice Desk</span></div>
        <div className="test-header__candidate"><span>Candidate</span><strong>{activeSession.candidateName}</strong></div>
        <Button type="button" emphasis="outline" intent="neutral" className="mobile-navigator-trigger" onClick={() => setNavigatorOpen(true)}>
          <Menu aria-hidden="true" /> Questions
        </Button>
      </header>

      <div className="test-progress" role="progressbar" aria-label="Test progress" aria-valuemin={1} aria-valuemax={100} aria-valuenow={activeSession.currentIndex + 1}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="test-shell">
        <div className="test-main">
          <div className="question-meta">
            <div>
              <span className="section-badge">{context.unit.section === "listening" ? <Headphones aria-hidden="true" /> : <ClipboardList aria-hidden="true" />}{context.unit.section}</span>
              <span className="part-label">{PART_LABELS[context.unit.part]}</span>
            </div>
            <button type="button" className={`review-button ${marked ? "review-button--active" : ""}`} aria-pressed={marked} onClick={() => toggleMark(context.question.id)}>
              <Bookmark aria-hidden="true" /> {marked ? "Marked for review" : "Mark for review"}
            </button>
          </div>
          <h1 id="question-heading" className="sr-only" tabIndex={-1}>Question {context.index + 1}</h1>
          <p className="question-instruction">{context.unit.instruction}</p>
          {persistenceWarning ? <p className="inline-alert" role="status">Progress cannot be saved by this browser. Keep this tab open.</p> : null}
          <QuestionRenderer context={context} selectedChoice={activeSession.answers[context.question.id]} onAnswer={(choice) => answerQuestion(context.question.id, choice)} />
        </div>

        <aside className="test-sidebar">
          <div className="test-sidebar__heading">
            <div><span className="eyebrow">Answer sheet</span><strong>{totals.answered} of 100 answered</strong></div>
            <span className="mono">{Math.round(progress)}%</span>
          </div>
          <QuestionNavigator session={activeSession} contexts={activeContexts} onNavigate={navigate} />
          <Button type="button" emphasis="outline" intent="neutral" onClick={() => setSubmitOpen(true)}><Check aria-hidden="true" /> Review and submit</Button>
        </aside>
      </div>

      <footer className="test-actions">
        <Button type="button" emphasis="outline" intent="neutral" disabled={activeSession.currentIndex === 0} onClick={() => navigate(activeSession.currentIndex - 1)}>
          <ArrowLeft aria-hidden="true" /> Previous
        </Button>
        <div className="test-actions__status" aria-live="polite"><span>Question</span><strong className="mono">{activeSession.currentIndex + 1} / 100</strong></div>
        {activeSession.currentIndex === activeContexts.length - 1 ? (
          <Button type="button" onClick={() => setSubmitOpen(true)}>Review and submit <Check aria-hidden="true" /></Button>
        ) : (
          <Button type="button" onClick={() => navigate(activeSession.currentIndex + 1)}>Next <ArrowRight aria-hidden="true" /></Button>
        )}
      </footer>

      <Dialog open={navigatorOpen} onOpenChange={setNavigatorOpen} title="Question navigator" description={`${totals.answered} answered, ${totals.unanswered} unanswered`} variant="drawer">
        <QuestionNavigator session={activeSession} contexts={activeContexts} onNavigate={navigate} />
        <div className="dialog__actions dialog__actions--stacked"><Button type="button" onClick={() => { setNavigatorOpen(false); setSubmitOpen(true); }}>Review and submit</Button></div>
      </Dialog>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen} title="Submit your test?" description="Your answers will be scored and the attempt can no longer be changed." showClose={false}>
        <div className="submission-summary">
          <div><span>Answered</span><strong className="mono">{totals.answered}</strong></div>
          <div><span>Unanswered</span><strong className="mono">{totals.unanswered}</strong></div>
          <div><span>Marked</span><strong className="mono">{totals.marked}</strong></div>
          <div><span>Total</span><strong className="mono">100</strong></div>
        </div>
        {totals.unanswered > 0 ? <p className="submission-warning">You can submit with unanswered questions, but they will be scored as incorrect.</p> : null}
        <div className="dialog__actions">
          <DialogClose asChild><Button type="button" emphasis="outline" intent="neutral">Return to test</Button></DialogClose>
          <Button type="button" busy={submitting} onClick={completeSubmission}>Submit test</Button>
        </div>
      </Dialog>
    </main>
  );
}
