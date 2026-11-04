"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import {
  Headphones,
  BookOpen,
  ArrowRight,
  Clock3,
  Check,
  ShieldCheck,
  RotateCcw,
  LockKeyhole,
} from "lucide-react";
import {
  PARTS,
  type Catalog,
  type Attempt,
  type Part,
  type Mode,
} from "@toeic/shared";
import { api } from "@/lib/api";
import { WorkspaceShell } from "./shell";
import { FetchState, useOverview } from "./common";
import { Button } from "@/components/ui/button";
function PracticeContent({ mock = false }: { mock?: boolean }) {
  const search = useSearchParams(),
    router = useRouter();
  const initialPart = search.get("part");
  const [mode, setMode] = useState<Mode>(
    mock ? "mock" : search.get("mode") === "quick" ? "quick" : "focused",
  );
  const [part, setPart] = useState<Part>(
    initialPart && initialPart in PARTS
      ? (initialPart as Part)
      : "incomplete-sentences",
  );
  const [count, setCount] = useState(0),
    [timed, setTimed] = useState(false),
    [immediate, setImmediate] = useState(true),
    [difficulty, setDifficulty] = useState("");
  const replay = search.get("replay") === "true";
  const filters = new URLSearchParams();
  if (mode === "focused") {
    if (replay) filters.set("replay", "true");
    if (difficulty) filters.set("difficulty", difficulty);
    if (search.get("skill")) filters.set("skill", search.get("skill")!);
  }
  const filterQuery = filters.toString();
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["catalog", filterQuery],
    queryFn: () =>
      api<Catalog>(
        "/assessments/blueprints" + (filterQuery ? "?" + filterQuery : ""),
      ),
  });
  const { data: overview } = useOverview();
  const selected =
    data?.parts.find((p) => p.id === part && p.count > 0) ||
    data?.parts.find((p) => p.count > 0);
  const activePart = selected?.id || part;
  const actualCount =
    mode === "mock"
      ? 100
      : mode === "quick"
        ? count === 24
          ? 24
          : 12
        : count && selected?.counts.includes(count)
          ? count
          : selected?.counts.find((n) => n >= 5) || selected?.counts[0] || 0;
  const start = useMutation({
    mutationFn: () =>
      api<Attempt>("/attempts", {
        method: "POST",
        body: JSON.stringify({
          mode,
          count: actualCount,
          ...(mode === "focused"
            ? {
                part: activePart,
                immediate,
                replay,
                ...(difficulty ? { difficulty } : {}),
                ...(search.get("skill") ? { skill: search.get("skill") } : {}),
              }
            : { timed }),
        }),
      }),
    onSuccess: (a) => router.push("/test?attempt=" + a.id),
  });
  return (
    <WorkspaceShell
      title={mock ? "Mock tests" : "Practice studio"}
      subtitle={mock ? "A FOCUSED ASSESSMENT" : "BUILD ONE SKILL AT A TIME"}
    >
      <FetchState
        loading={isPending}
        error={error}
        retry={() => void refetch()}
      />
      {data ? (
        <>
          <p className="page-description">
            {mock
              ? "A quiet space to put your Listening and Reading together."
              : "Choose your focus. Keep a comfortable pace. Make every question useful."}
          </p>
          {overview?.active.length ? (
            <div className="notice">
              <Clock3 aria-hidden="true" />
              <span>
                You have {overview.active.length} unfinished session
                {overview.active.length === 1 ? "" : "s"}. Starting another
                keeps your saved work.
              </span>
              <Link href={`/test?attempt=${overview.active[0].id}`}>
                Resume latest <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          ) : null}
          {replay ? (
            <div className="notice">
              <RotateCcw aria-hidden="true" />
              <span>
                Mistake replay selects unresolved mistakes and preserves their
                passage groups. Choose a part where you have mistakes.
              </span>
            </div>
          ) : null}
          {!mock ? (
            <div className="mode-tabs">
              <button
                onClick={() => {
                  setMode("focused");
                  setCount(0);
                }}
                aria-pressed={mode === "focused"}
              >
                <span className="mini-icon">
                  <BookOpen />
                </span>
                <div>
                  <strong>Focused practice</strong>
                  <small>One part. Room to learn.</small>
                </div>
                <span className="mode-indicator" />
              </button>
              <button
                onClick={() => {
                  setMode("quick");
                  setCount(12);
                }}
                aria-pressed={mode === "quick"}
              >
                <span className="mini-icon warm">
                  <Clock3 />
                </span>
                <div>
                  <strong>Quick test</strong>
                  <small>A balanced short assessment.</small>
                </div>
                <span className="mode-indicator" />
              </button>
            </div>
          ) : null}
          <div className="setup-layout">
            <section className="panel setup-panel">
              <div className="section-heading">
                <div>
                  <span className="step-label">01 / CONFIGURE</span>
                  <h2>
                    {mode === "focused"
                      ? "What would you like to work on?"
                      : mode === "quick"
                        ? "A little of both sections"
                        : "100 questions. One focused session."}
                  </h2>
                </div>
              </div>
              {mode === "focused" ? (
                <>
                  <div className="section-toggle" aria-label="Practice section">
                    <button
                      aria-pressed={PARTS[activePart].section === "listening"}
                      onClick={() => {
                        setPart("photographs");
                        setCount(0);
                        setDifficulty("");
                      }}
                    >
                      <Headphones aria-hidden="true" />
                      Listening
                    </button>
                    <button
                      aria-pressed={PARTS[activePart].section === "reading"}
                      onClick={() => {
                        setPart("incomplete-sentences");
                        setCount(0);
                        setDifficulty("");
                      }}
                    >
                      <BookOpen aria-hidden="true" />
                      Reading
                    </button>
                  </div>
                  <div className="part-picker">
                    {data.parts
                      .filter((p) => p.section === PARTS[activePart].section)
                      .map((p) => (
                        <button
                          key={p.id}
                          className={
                            p.id === activePart
                              ? "part-option selected"
                              : "part-option"
                          }
                          aria-pressed={p.id === activePart}
                          onClick={() => {
                            setPart(p.id);
                            setCount(0);
                            setDifficulty("");
                          }}
                        >
                          <span className="part-index">P{p.number}</span>
                          <span>
                            <strong>{p.label}</strong>
                            <small>{p.count} questions available</small>
                          </span>
                          {p.id === activePart ? (
                            <Check aria-hidden="true" />
                          ) : null}
                        </button>
                      ))}
                  </div>
                </>
              ) : (
                <div className="blueprint-sections">
                  <div>
                    <Headphones aria-hidden="true" />
                    <strong>Listening</strong>
                    <span>
                      {mode === "mock" ? 50 : actualCount / 2} questions
                    </span>
                  </div>
                  <div>
                    <BookOpen aria-hidden="true" />
                    <strong>Reading</strong>
                    <span>
                      {mode === "mock" ? 50 : actualCount / 2} questions
                    </span>
                  </div>
                </div>
              )}
              <div className="config-fields">
                {mode !== "mock" ? (
                  <label className="field">
                    <span>Question count</span>
                    <select
                      value={actualCount}
                      onChange={(e) => setCount(Number(e.target.value))}
                    >
                      {!actualCount ? (
                        <option value={0}>No matching question groups</option>
                      ) : null}
                      {(mode === "quick"
                        ? [12, 24]
                        : selected?.counts || []
                      ).map((n) => (
                        <option value={n} key={n}>
                          {n} questions
                        </option>
                      ))}
                    </select>
                    <small>Related questions stay together.</small>
                  </label>
                ) : null}
                {mode === "focused" ? (
                  <label className="field">
                    <span>Difficulty</span>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                    >
                      <option value="">All difficulties</option>
                      {selected?.difficulties.map((d) => (
                        <option key={d} value={d}>
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </option>
                      ))}
                    </select>
                    <small>Filters use the bank’s original metadata.</small>
                  </label>
                ) : null}
              </div>
              <div className="settings-section">
                <span className="step-label">02 / YOUR PACE</span>
                {mode === "focused" ? (
                  <label className="setting-row">
                    <div>
                      <strong>Immediate explanations</strong>
                      <p>
                        See feedback after each answer. Your answer is then
                        locked.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={immediate}
                      onChange={(e) => setImmediate(e.target.checked)}
                    />
                  </label>
                ) : mode === "quick" ? (
                  <label className="setting-row">
                    <div>
                      <strong>Use a timer</strong>
                      <p>
                        {actualCount} minutes. Saved answers submit when time
                        runs out.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={timed}
                      onChange={(e) => setTimed(e.target.checked)}
                    />
                  </label>
                ) : (
                  <div className="setting-row">
                    <div>
                      <strong>60-minute countdown</strong>
                      <p>
                        The server enforces the deadline, including time away
                        from the test.
                      </p>
                    </div>
                    <ShieldCheck aria-hidden="true" />
                  </div>
                )}
              </div>
              {start.error ? (
                <p className="inline-alert" role="alert">
                  {start.error.message}
                </p>
              ) : null}
              <div className="setup-start">
                <span>
                  {actualCount} questions ·{" "}
                  {mode === "mock"
                    ? "60 minutes"
                    : `About ${actualCount} minutes`}
                </span>
                <Button
                  busy={start.isPending}
                  disabled={!actualCount}
                  onClick={() => start.mutate()}
                >
                  Start{" "}
                  {mode === "focused"
                    ? "practice"
                    : mode === "quick"
                      ? "quick test"
                      : "mock test"}{" "}
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </section>
            <aside className="setup-aside">
              <div className="panel">
                <span className="step-label">BEFORE YOU BEGIN</span>
                <h2>A clear view of this session</h2>
                <ul className="session-rules">
                  <li>
                    <Clock3 />
                    <div>
                      <strong>
                        {mode === "mock"
                          ? "Timed simulation"
                          : timed
                            ? "Timed quick test"
                            : "At your pace"}
                      </strong>
                      <p>
                        {mode === "mock"
                          ? "A shortened simulation, independent of official ETS exams."
                          : timed
                            ? "A server-managed countdown for this assessment."
                            : "Take your time. There’s no countdown."}
                      </p>
                    </div>
                  </li>
                  <li>
                    <Headphones />
                    <div>
                      <strong>
                        {mode === "mock"
                          ? "One playback per audio group"
                          : "Replay and seek freely"}
                      </strong>
                      <p>
                        {mode === "mock"
                          ? "No replay, seeking, or pause. Resume preserves played audio."
                          : "Use headphones for a comfortable Listening experience."}
                      </p>
                    </div>
                  </li>
                  <li>
                    <BookOpen />
                    <div>
                      <strong>
                        {mode === "focused" && immediate
                          ? "Learn as you go"
                          : "Review after submission"}
                      </strong>
                      <p>
                        {mode === "focused" && immediate
                          ? "Explanations appear after you commit an answer."
                          : "Answer keys, explanations, and transcripts stay hidden until you finish."}
                      </p>
                    </div>
                  </li>
                  <li>
                    <Check />
                    <div>
                      <strong>Saved as you answer</strong>
                      <p>
                        {overview?.user.guest
                          ? "Your guest session is kept in this browser. Sign in to access it across devices."
                          : "Resume your saved progress from your account."}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              {mock ? (
                <div className="panel unavailable">
                  <LockKeyhole aria-hidden="true" />
                  <h3>Full-format simulation</h3>
                  <p>200 questions · 120 minutes</p>
                  <span className="tag">NOT AVAILABLE YET</span>
                  <p>
                    The current bank has 150 original questions. We’ll enable
                    the full format when every part has enough content.
                  </p>
                </div>
              ) : (
                <p className="aside-note">
                  Practice shows accuracy and skill breakdowns. No predicted
                  official score, and no invented progress.
                </p>
              )}
            </aside>
          </div>
        </>
      ) : null}
    </WorkspaceShell>
  );
}
export function PracticePage({ mock = false }: { mock?: boolean }) {
  return (
    <Suspense fallback={<FetchState loading />}>
      <PracticeContent mock={mock} />
    </Suspense>
  );
}
