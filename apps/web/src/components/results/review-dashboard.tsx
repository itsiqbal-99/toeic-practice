"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Bookmark,
  RotateCcw,
} from "lucide-react";
import { PARTS, type Attempt } from "@toeic/shared";
import { api } from "@/lib/api";
import { WorkspaceShell } from "@/components/workspace/shell";
import { FetchState, Empty } from "@/components/workspace/common";
import { StimulusView } from "@/components/test/question-renderer";
function ReviewContent() {
  const id = useSearchParams().get("attempt") || "";
  const [filter, setFilter] = useState("all"),
    [part, setPart] = useState("all"),
    [skill, setSkill] = useState("all"),
    [index, setIndex] = useState(0);
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["review", id],
    queryFn: () => api<Attempt>("/attempts/" + id + "/review"),
    enabled: Boolean(id),
  });
  const contexts =
    data?.contexts.filter(
      (c) =>
        (part === "all" || c.unit.part === part) &&
        (skill === "all" || c.question.skills.includes(skill)) &&
        (filter === "all" ||
          (filter === "marked" &&
            data.markedQuestionIds.includes(c.question.id)) ||
          (filter === "unanswered" && !data.answers[c.question.id]) ||
          (filter === "incorrect" &&
            Boolean(data.answers[c.question.id]) &&
            data.answers[c.question.id] !== c.question.correctChoiceId)),
    ) || [];
  const current = contexts[Math.min(index, contexts.length - 1)];
  const update = (fn: () => void) => {
    fn();
    setIndex(0);
  };
  return (
    <WorkspaceShell
      title="Answer review"
      subtitle="UNDERSTAND THE DETAILS"
      action={
        <Link
          href={`/results?attempt=${id}`}
          className="button button--outline"
        >
          <ArrowLeft />
          Back to results
        </Link>
      }
    >
      {!id ? (
        <div className="error-state">
          <h2>Select a session to review</h2>
          <Link href="/review" className="text-link">
            Open review library <ArrowRight />
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
          <div className="review-filters">
            <div className="segmented">
              {["all", "incorrect", "unanswered", "marked"].map((f) => (
                <button
                  key={f}
                  onClick={() => update(() => setFilter(f))}
                  aria-pressed={filter === f}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="review-selects">
              <label className="sr-only" htmlFor="review-part">
                Filter by part
              </label>
              <select
                id="review-part"
                value={part}
                onChange={(e) => update(() => setPart(e.target.value))}
              >
                <option value="all">All parts</option>
                {[...new Set(data.contexts.map((c) => c.unit.part))].map(
                  (p) => (
                    <option value={p} key={p}>
                      Part {PARTS[p].number} · {PARTS[p].label}
                    </option>
                  ),
                )}
              </select>
              <label className="sr-only" htmlFor="review-skill">
                Filter by skill
              </label>
              <select
                id="review-skill"
                value={skill}
                onChange={(e) => update(() => setSkill(e.target.value))}
              >
                <option value="all">All skills</option>
                {[
                  ...new Set(data.contexts.flatMap((c) => c.question.skills)),
                ].map((s) => (
                  <option value={s} key={s}>
                    {s.replaceAll("-", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="review-position">
            <span>
              {contexts.length} matching question
              {contexts.length === 1 ? "" : "s"}
            </span>
            {current ? (
              <span>
                {Math.min(index, contexts.length - 1) + 1} of {contexts.length}
              </span>
            ) : null}
          </div>
          {current ? (
            <article className="review-card">
              <header>
                <span className="tag">
                  PART {PARTS[current.unit.part].number} · QUESTION{" "}
                  {current.index + 1}
                </span>
                <span className="review-status">
                  {data.markedQuestionIds.includes(current.question.id) ? (
                    <Bookmark aria-label="Marked for review" />
                  ) : null}
                  {!data.answers[current.question.id] ? (
                    "Unanswered"
                  ) : data.answers[current.question.id] ===
                    current.question.correctChoiceId ? (
                    <>
                      <Check />
                      Correct
                    </>
                  ) : (
                    <>
                      <X />
                      Incorrect
                    </>
                  )}
                </span>
              </header>
              <div
                className={
                  ["passage", "documents"].includes(current.unit.stimulus.kind)
                    ? "review-layout reading"
                    : "review-layout"
                }
              >
                <StimulusView key={current.unit.id} context={current} review />
                <div>
                  <h2>{current.question.prompt}</h2>
                  <div className="review-choices">
                    {current.question.choices.map((c) => (
                      <div
                        key={c.id}
                        className={
                          "review-choice " +
                          (c.id === current.question.correctChoiceId
                            ? "is-correct "
                            : "") +
                          (c.id === data.answers[current.question.id]
                            ? "is-yours"
                            : "")
                        }
                      >
                        <span className="choice-letter">{c.id}</span>
                        <span>{c.text}</span>
                        <small>
                          {c.id === current.question.correctChoiceId
                            ? "Correct answer"
                            : ""}
                          {c.id === data.answers[current.question.id]
                            ? c.id === current.question.correctChoiceId
                              ? " · Your answer"
                              : "Your answer"
                            : ""}
                        </small>
                      </div>
                    ))}
                  </div>
                  <div className="explanation">
                    <span className="step-label">WHY THIS ANSWER</span>
                    <p>{current.question.explanation}</p>
                  </div>
                  <div className="skill-tags">
                    {current.question.skills.map((s) => (
                      <Link
                        href={`/practice?part=${current.unit.part}&skill=${s}`}
                        key={s}
                      >
                        {s.replaceAll("-", " ")}
                        <ArrowRight />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <Empty
              icon={<Check />}
              title="Nothing in this view"
              description="Try another filter to see more of your answers."
            />
          )}
          <div className="review-navigation">
            <button
              className="button button--outline"
              disabled={index <= 0}
              onClick={() => setIndex(index - 1)}
            >
              <ArrowLeft />
              Previous answer
            </button>
            <Link
              className="text-link"
              href={`/practice?replay=true${current ? "&part=" + current.unit.part : ""}`}
            >
              <RotateCcw />
              Practice mistakes
            </Link>
            <button
              className="button button--solid button--brand"
              disabled={!current || index >= contexts.length - 1}
              onClick={() => {
                setIndex(index + 1);
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
            >
              Next answer
              <ArrowRight />
            </button>
          </div>
        </>
      ) : null}
    </WorkspaceShell>
  );
}
export function ReviewDashboard() {
  return (
    <Suspense fallback={<FetchState loading />}>
      <ReviewContent />
    </Suspense>
  );
}
