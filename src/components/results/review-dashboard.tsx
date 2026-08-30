"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, CircleAlert, Headphones, Minus } from "lucide-react";
import { useTestSession } from "@/features/test/session-context";
import { PART_LABELS } from "@/features/test/config";
import { LoadingState } from "@/components/ui/loading-state";
import { RecoveryState } from "@/components/ui/recovery-state";
import type { QuestionContext } from "@/features/test/types";

type Filter = "all" | "incorrect" | "unanswered";

function ReviewStimulus({ context }: { context: QuestionContext }) {
  const stimulus = context.unit.stimulus;
  if (stimulus.kind === "audio" || stimulus.kind === "image-audio") {
    return (
      <details className="review-transcript">
        <summary><Headphones aria-hidden="true" /> View listening transcript</summary>
        <pre>{stimulus.transcript}</pre>
      </details>
    );
  }
  if (stimulus.kind === "passage") {
    return <div className="review-passage"><strong>{stimulus.title}</strong><p>{stimulus.body}</p></div>;
  }
  if (stimulus.kind === "documents") {
    return <div className="review-documents">{stimulus.documents.map((document) => <div key={document.title}><span>{document.label}</span><strong>{document.title}</strong><p>{document.body}</p></div>)}</div>;
  }
  return null;
}

export function ReviewDashboard() {
  const { hydrationStatus, latestResult, resultContexts } = useTestSession();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (!latestResult) return [];
    return resultContexts.filter(({ question }) => {
      const answer = latestResult.answers[question.id];
      if (filter === "unanswered") return !answer;
      if (filter === "incorrect") return Boolean(answer) && answer !== question.correctChoiceId;
      return true;
    });
  }, [filter, latestResult, resultContexts]);

  if (hydrationStatus === "loading") return <LoadingState label="Opening your answer review…" />;
  if (!latestResult || resultContexts.length !== 100) return <RecoveryState title="Answer review is unavailable" message="The score report or its question set could not be restored." />;

  const filterCounts: Record<Filter, number> = {
    all: resultContexts.length,
    incorrect: latestResult.incorrect,
    unanswered: latestResult.unanswered,
  };

  return (
    <main className="review-page">
      <header className="review-header">
        <Link href="/results" className="back-link"><ArrowLeft aria-hidden="true" /> Score report</Link>
        <div><span className="eyebrow">Answer review</span><strong>{latestResult.candidateName}</strong></div>
      </header>

      <section className="review-intro" aria-labelledby="review-heading">
        <div><h1 id="review-heading">Understand every answer.</h1><p>Listening transcripts are available here, after submission. Explanations focus on the evidence or language rule behind the answer.</p></div>
        <div className="review-filters" aria-label="Filter reviewed answers">
          {(["all", "incorrect", "unanswered"] as Filter[]).map((item) => (
            <button type="button" key={item} className={filter === item ? "review-filter--active" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>
              {item === "all" ? "All answers" : item[0].toUpperCase() + item.slice(1)} <span className="mono">{filterCounts[item]}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="review-list" aria-live="polite">
        {filtered.length === 0 ? (
          <div className="review-empty"><Check aria-hidden="true" /><h2>No questions in this filter</h2><p>Choose another filter to continue reviewing your attempt.</p></div>
        ) : filtered.map((context) => {
          const answer = latestResult.answers[context.question.id];
          const correct = answer === context.question.correctChoiceId;
          return (
            <article className={`review-card ${correct ? "review-card--correct" : "review-card--incorrect"}`} key={context.question.id}>
              <header>
                <div><span className="mono">Question {context.index + 1}</span><strong>{PART_LABELS[context.unit.part]}</strong></div>
                <span className="review-outcome">{correct ? <Check aria-hidden="true" /> : answer ? <CircleAlert aria-hidden="true" /> : <Minus aria-hidden="true" />}{correct ? "Correct" : answer ? "Incorrect" : "Unanswered"}</span>
              </header>
              <ReviewStimulus context={context} />
              <h2>{context.question.prompt}</h2>
              <div className="review-choices">
                {context.question.choices.map((choice) => {
                  const isCorrect = choice.id === context.question.correctChoiceId;
                  const isSelected = choice.id === answer;
                  return <div key={choice.id} className={`${isCorrect ? "review-choice--correct" : ""} ${isSelected && !isCorrect ? "review-choice--selected-wrong" : ""}`}><span className="mono">{choice.id}</span><p>{choice.text}</p>{isCorrect ? <small>Correct answer</small> : isSelected ? <small>Your answer</small> : null}</div>;
                })}
              </div>
              <div className="explanation"><span>Why</span><p>{context.question.explanation}</p></div>
            </article>
          );
        })}
      </div>
      <div className="review-footer"><Link className="button button--outline button--neutral" href="/results"><ArrowLeft aria-hidden="true" /> Back to score report</Link></div>
    </main>
  );
}
