"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Clock3,
  Target,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { MODE_LABELS, comparisonKey, type Result } from "@toeic/shared";
import { api, dateLabel, timeLabel } from "@/lib/api";
import { WorkspaceShell } from "@/components/workspace/shell";
import {
  FetchState,
  MetricBar,
  SectionHeading,
  useOverview,
} from "@/components/workspace/common";
function ResultContent() {
  const id = useSearchParams().get("attempt") || "";
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["result", id],
    queryFn: () => api<Result>("/attempts/" + id + "/results"),
    enabled: Boolean(id),
  });
  const { data: overview } = useOverview();
  const previous = overview?.history.find(
    (h) =>
      data &&
      h.attemptId !== id &&
      comparisonKey(h) === comparisonKey(data) &&
      !h.imported &&
      h.completedAt < data.completedAt,
  );
  return (
    <WorkspaceShell
      title="Session results"
      subtitle="A CLOSER LOOK AT YOUR ANSWERS"
      action={
        <Link className="button button--outline" href="/practice">
          New session <ArrowUpRight />
        </Link>
      }
    >
      {!id ? (
        <div className="error-state">
          <h2>Select a completed session</h2>
          <Link className="text-link" href="/review">
            Open your review library <ArrowRight />
          </Link>
        </div>
      ) : (
        <FetchState
          loading={isPending}
          error={error}
          retry={() => void refetch()}
        />
      )}
      {data ? (
        <>
          <div className="result-meta">
            <span className="tag">
              <Check />
              {data.imported ? "IMPORTED RESULT" : "SESSION COMPLETE"}
            </span>
            <span>
              {dateLabel(data.completedAt)} · {MODE_LABELS[data.mode]}
            </span>
          </div>
          <section className="result-overview">
            <div className="result-score">
              <span className="step-label">ACCURACY</span>
              <strong>
                {data.accuracy}
                <small>%</small>
              </strong>
              <span>
                {data.correct} correct out of {data.totalQuestions}
              </span>
            </div>
            <div className="result-summary">
              <h2>{data.title}</h2>
              <p>
                {data.mode === "focused"
                  ? "A record of your focused practice. Use the explanations to understand what you missed."
                  : "Your assessment is saved. Review your answers, then choose one area to work on next."}
              </p>
              <div className="result-counts">
                <div>
                  <span className="count-dot correct" />
                  <strong>{data.correct}</strong>
                  <span>Correct</span>
                </div>
                <div>
                  <span className="count-dot incorrect" />
                  <strong>{data.incorrect}</strong>
                  <span>Incorrect</span>
                </div>
                <div>
                  <span className="count-dot unanswered" />
                  <strong>{data.unanswered}</strong>
                  <span>Unanswered</span>
                </div>
              </div>
              <Link
                href={`/results/review?attempt=${id}`}
                className="button button--solid button--brand"
              >
                Review answers <ArrowRight />
              </Link>
            </div>
          </section>
          <div className="result-footnote">
            <Clock3 />
            <span>
              {data.imported
                ? "Elapsed time was not recorded by the original app."
                : timeLabel(data.elapsedSeconds) +
                  " elapsed, including time away from the session."}
            </span>
            <span>
              Accuracy is correct answers ÷ all questions. Unanswered questions
              are included.
            </span>
          </div>
          <div className="dashboard-grid">
            <section className="panel">
              <SectionHeading title="Listening & Reading" />
              {data.sections.map((m) => (
                <MetricBar metric={m} key={m.key} />
              ))}
              {previous ? (
                <div className="comparison-note">
                  <Target />
                  <p>
                    {data.accuracy === previous.accuracy
                      ? "The same accuracy as"
                      : `${Math.abs(Math.round((data.accuracy - previous.accuracy) * 10) / 10)} percentage points ${data.accuracy > previous.accuracy ? "higher" : "lower"} than`}{" "}
                    your previous {data.totalQuestions}-question{" "}
                    {MODE_LABELS[data.mode].toLowerCase()} on{" "}
                    {dateLabel(previous.completedAt)}.{" "}
                    {data.mode === "focused"
                      ? "Practice content varies, so this is descriptive only."
                      : ""}
                  </p>
                </div>
              ) : (
                <p className="fine-print">
                  A previous session with the same mode and question count is
                  needed for a comparison.
                </p>
              )}
            </section>
            <section className="panel">
              <SectionHeading title="By TOEIC part" />
              {data.parts.map((m) => (
                <Link href={"/practice?part=" + m.key} key={m.key}>
                  <MetricBar metric={m} />
                </Link>
              ))}
            </section>
          </div>
          <section className="panel">
            <SectionHeading
              title="Skills in this session"
              detail="Small samples describe these questions, not your overall proficiency."
            />
            <div className="skills-grid">
              {data.skills.map((m) => (
                <MetricBar metric={m} key={m.key} />
              ))}
            </div>
          </section>
          <div className="workspace-tip">
            <BookOpen />
            <p>
              These are independent practice results. We do not convert accuracy
              into an official or predicted TOEIC score.
            </p>
            <Link href="/review">
              Open review library <ArrowRight />
            </Link>
          </div>
        </>
      ) : null}
    </WorkspaceShell>
  );
}
export function ResultDashboard() {
  return (
    <Suspense fallback={<FetchState loading />}>
      <ResultContent />
    </Suspense>
  );
}
