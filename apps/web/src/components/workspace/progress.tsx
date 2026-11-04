"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Target, ArrowUpRight, BookOpen, RotateCcw } from "lucide-react";
import { MODE_LABELS, type HistoryPage } from "@toeic/shared";
import { WorkspaceShell } from "./shell";
import {
  useOverview,
  FetchState,
  SectionHeading,
  MetricBar,
  Empty,
} from "./common";
import { api, dateLabel } from "@/lib/api";
import { Button } from "@/components/ui/button";
const HistoryChart = dynamic(() => import("./history-chart"), { ssr: false });
export function ProgressPage({ review = false }: { review?: boolean }) {
  const { data, error, isPending, refetch } = useOverview(),
    [filter, setFilter] = useState("all");
  const history = useInfiniteQuery({
    queryKey: ["history", filter],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api<HistoryPage>(
        `/attempts?offset=${pageParam}&limit=20${filter === "all" ? "" : "&mode=" + filter}`,
      ),
    getNextPageParam: (page) =>
      page.offset + page.items.length < page.total
        ? page.offset + page.limit
        : undefined,
  });
  const sessions = history.data?.pages.flatMap((p) => p.items) || [];
  return (
    <WorkspaceShell
      title={review ? "Review library" : "My progress"}
      subtitle={review ? "RETURN TO WHAT MATTERS" : "A RECORD OF YOUR PRACTICE"}
    >
      <FetchState
        loading={isPending}
        error={error}
        retry={() => void refetch()}
      />
      {data ? (
        <>
          <p className="page-description">
            {review
              ? "Every session has something to teach you. Revisit your answers or try your unresolved mistakes."
              : "See what is changing, with real results and clearly labeled samples."}
          </p>
          {review ? (
            <section className="replay-banner">
              <span className="mini-icon warm">
                <RotateCcw />
              </span>
              <div>
                <h2>Give your mistakes another look.</h2>
                <p>
                  Replay questions whose most recent answer was incorrect. A
                  correct replay removes them from the unresolved set.
                </p>
              </div>
              <Link
                href="/practice?replay=true"
                className="button button--outline"
              >
                Practice mistakes <ArrowUpRight />
              </Link>
            </section>
          ) : (
            <>
              <div className="dashboard-grid">
                <section className="panel">
                  <SectionHeading
                    title="Performance history"
                    detail="Compare like-for-like assessments."
                  />
                  <HistoryChart history={data.history} />
                </section>
                <section className="panel">
                  <SectionHeading title="Your target" />
                  {data.preferences.goal ? (
                    <>
                      <div className="goal-value">
                        {data.accuracy ?? "—"}
                        <small>% / {data.preferences.goal}%</small>
                      </div>
                      <p>Overall accuracy against your personal target.</p>
                      <div className="bar-track">
                        <span
                          style={{
                            width:
                              Math.min(
                                100,
                                ((data.accuracy || 0) / data.preferences.goal) *
                                  100,
                              ) + "%",
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <Empty
                      icon={<Target />}
                      title="Choose a useful target"
                      description="Set a personal accuracy goal in your account."
                      action={
                        <Link className="text-link" href="/account">
                          Set your target <ArrowUpRight />
                        </Link>
                      }
                    />
                  )}
                </section>
              </div>
              <div className="dashboard-grid">
                <section className="panel">
                  <SectionHeading title="By TOEIC part" />
                  {data.parts.length ? (
                    data.parts.map((m) => (
                      <Link href={"/practice?part=" + m.key} key={m.key}>
                        <MetricBar metric={m} />
                      </Link>
                    ))
                  ) : (
                    <Empty
                      icon={<BookOpen />}
                      title="No part results yet"
                      description="Complete your first session to see the breakdown."
                    />
                  )}
                </section>
                <section className="panel">
                  <SectionHeading
                    title="By skill"
                    detail="Accuracy includes unanswered questions."
                  />
                  {data.skills.length ? (
                    data.skills.map((m) => <MetricBar metric={m} key={m.key} />)
                  ) : (
                    <Empty
                      icon={<Target />}
                      title="Skills need observations"
                      description="Grammar, vocabulary, inference, and more will appear as you practice."
                    />
                  )}
                </section>
              </div>
            </>
          )}
          <section className="panel history-panel">
            <SectionHeading
              title="Session history"
              detail="Your completed sessions, with results and explanations."
            />
            <div className="segmented">
              {["all", "focused", "quick", "mock"].map((m) => (
                <button
                  key={m}
                  aria-pressed={filter === m}
                  onClick={() => setFilter(m)}
                >
                  {m === "all"
                    ? "All sessions"
                    : MODE_LABELS[m as keyof typeof MODE_LABELS]}
                </button>
              ))}
            </div>
            <FetchState
              loading={history.isPending}
              error={history.error}
              retry={() => void history.refetch()}
            />
            {sessions.length ? (
              <div className="history-list">
                {sessions.map((h) => (
                  <Link
                    key={h.attemptId}
                    href={`/${review ? "results/review" : "results"}?attempt=${h.attemptId}`}
                  >
                    <span className="history-date">
                      {dateLabel(h.completedAt)}
                    </span>
                    <div>
                      <strong>{h.title}</strong>
                      <small>
                        {MODE_LABELS[h.mode]} · {h.totalQuestions} questions
                        {h.imported ? " · Imported" : ""}
                      </small>
                    </div>
                    <span>
                      <strong>{h.accuracy}%</strong>
                      <small>{h.correct} correct</small>
                    </span>
                    <ArrowUpRight aria-hidden="true" />
                  </Link>
                ))}
              </div>
            ) : !history.isPending && !history.error ? (
              <Empty
                icon={<BookOpen />}
                title="Your history is a fresh page"
                description="Complete a practice session to save your results and unlock answer review."
                action={
                  <Link
                    href="/practice"
                    className="button button--solid button--brand"
                  >
                    Start a session <ArrowUpRight />
                  </Link>
                }
              />
            ) : null}
            {history.hasNextPage ? (
              <Button
                emphasis="outline"
                busy={history.isFetchingNextPage}
                onClick={() => void history.fetchNextPage()}
              >
                Load older sessions
              </Button>
            ) : null}
          </section>
        </>
      ) : null}
    </WorkspaceShell>
  );
}
