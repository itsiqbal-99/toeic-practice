"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Headphones,
  BookOpen,
  Target,
  Check,
  Clock3,
  ChartNoAxesCombined,
  SlidersHorizontal,
  ClipboardCheck,
  Play,
  Bookmark,
} from "lucide-react";
import { PARTS, MODE_LABELS } from "@toeic/shared";
import { WorkspaceShell } from "./shell";
import {
  useOverview,
  FetchState,
  SectionHeading,
  Empty,
  MetricBar,
} from "./common";
import { dateLabel } from "@/lib/api";
const HistoryChart = dynamic(() => import("./history-chart"), {
  loading: () => <div className="chart-placeholder">Loading history…</div>,
  ssr: false,
});
export function Dashboard() {
  const { data, error, isPending, refetch } = useOverview(),
    [skillView, setSkillView] = useState<"parts" | "skills">("parts");
  return (
    <WorkspaceShell
      title="Learning overview"
      subtitle="YOUR PERSONAL WORKSPACE"
    >
      <FetchState
        loading={isPending}
        error={error}
        retry={() => void refetch()}
      />
      {data ? (
        <>
          <div className="overview-intro">
            <p>
              {data.completed
                ? "A closer look at your practice and what to work on next."
                : "A fresh workspace. Let’s find your starting point."}
            </p>
            <span className="date-stamp">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <section className="stat-grid" aria-label="Learning overview metrics">
            {[
              {
                label: "Completed sessions",
                value: data.completed,
                icon: Check,
                note: "Every session, in one place",
              },
              {
                label: "Questions practiced",
                value: data.practiced,
                icon: BookOpen,
                note: "Answered in completed sessions",
              },
              {
                label: "Overall accuracy",
                value: data.accuracy === null ? "—" : data.accuracy + "%",
                icon: Target,
                note: data.practiced
                  ? "Correct / all session questions"
                  : "Your first session will tell us",
              },
              {
                label: "This week",
                value: `${data.weeklyCount}`,
                icon: Clock3,
                note: `of ${data.preferences.weeklyTarget} questions · UTC week`,
              },
            ].map((s, i) => (
              <article className="stat-card" key={s.label}>
                <div className="stat-top">
                  <span>{s.label}</span>
                  <s.icon aria-hidden="true" />
                </div>
                <div className="stat-value">
                  {s.value}
                  <span className="stat-index">0{i + 1}</span>
                </div>
                <p>{s.note}</p>
                {i === 3 ? (
                  <div className="bar-track">
                    <span
                      style={{
                        width:
                          Math.min(
                            100,
                            (data.weeklyCount / data.preferences.weeklyTarget) *
                              100,
                          ) + "%",
                      }}
                    />
                  </div>
                ) : null}
              </article>
            ))}
          </section>
          {data.active.length ? (
            <section className="resume-card">
              <span className="resume-icon">
                <Play aria-hidden="true" />
              </span>
              <div>
                <p className="eyebrow">READY WHEN YOU ARE</p>
                <h2>{data.active[0].title}</h2>
                <p>
                  {data.active[0].answered} answered ·{" "}
                  {data.active[0].total - data.active[0].answered} remaining ·
                  Last active {dateLabel(data.active[0].updatedAt)}
                </p>
              </div>
              <Link
                className="button button--solid button--brand"
                href={`/test?attempt=${data.active[0].id}`}
              >
                Resume session <ArrowRight aria-hidden="true" />
              </Link>
            </section>
          ) : (
            <section className="first-session">
              <div className="first-session-copy">
                <span className="tag">
                  <span className="status-dot" /> {data.completed?"YOUR NEXT SESSION":"YOUR FIRST SESSION"}
                </span>
                <h2>{data.completed?"Check in with a quick test.":"Start with a short diagnostic."}</h2>
                <p>
                  {data.completed?"Twelve questions across Listening and Reading. Add a new result to your practice history.":"Twelve questions. Listening and Reading. A useful first look at where you are."}
                </p>
                <Link
                  href="/practice?mode=quick"
                  className="button button--solid button--brand"
                >
                  Take a quick test <ArrowRight aria-hidden="true" />
                </Link>
                <span className="first-session-meta">
                  12 questions <span>·</span> About 12 minutes <span>·</span> No
                  timer required
                </span>
              </div>
              <div className="diagnostic-art" aria-hidden="true">
                <div className="art-sheet">
                  <span>THE STARTING POINT</span>
                  <div className="art-head">
                    <Headphones />
                    <BookOpen />
                  </div>
                  <div className="art-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="art-footer">
                    01 <span>—</span> 12
                  </div>
                </div>
                <div className="art-sticker">
                  <Check />
                  <span>At your pace</span>
                </div>
              </div>
            </section>
          )}
          <div className="dashboard-grid">
            <section className="panel performance-panel">
              <SectionHeading
                title="Performance over time"
                detail="Your answers, turned into a clearer picture."
                href="/progress"
                link="Explore progress"
              />
              <HistoryChart history={data.history} />
            </section>
            <section className="panel next-panel">
              <div className="panel-kicker">
                <span className="mini-icon">
                  <SlidersHorizontal />
                </span>
                <span>THE NEXT STEP</span>
              </div>
              <h2>
                {data.recommendation
                  ? `Focus on Part ${PARTS[data.recommendation.part].number}`
                  : "A session that fits your day"}
              </h2>
              <p>
                {data.recommendation?.reason ||
                  "Choose a specific part for focused practice, or sample both sections with a quick test."}
              </p>
              <Link
                className="next-link"
                href={
                  data.recommendation
                    ? `/practice?part=${data.recommendation.part}${data.recommendation.skill ? "&skill=" + data.recommendation.skill : ""}`
                    : "/practice"
                }
              >
                {data.recommendation
                  ? "Practice this part"
                  : "Explore practice"}
                <ArrowUpRight aria-hidden="true" />
              </Link>
              <div className="next-divider" />
              <span className="small-label">LEARNING TARGET</span>
              <div className="target-row">
                <Target aria-hidden="true" />
                <div>
                  <strong>
                    {data.preferences.goal
                      ? `${data.preferences.goal}% accuracy`
                      : "Make it personal"}
                  </strong>
                  <p>
                    {data.preferences.goal
                      ? data.accuracy === null
                        ? "Complete a session to measure progress."
                        : `Currently at ${data.accuracy}% overall accuracy.`
                      : "Set an accuracy goal for your practice."}
                  </p>
                </div>
              </div>
              <Link href="/account" className="text-link">
                {data.preferences.goal ? "Edit target" : "Set a target"}{" "}
                <ArrowRight aria-hidden="true" />
              </Link>
            </section>
          </div>
          <div className="dashboard-grid">
            <section className="panel">
              <SectionHeading
                title="Your skill map"
                detail="Find the details that deserve your attention."
              />
              <div className="segmented">
                <button
                  aria-pressed={skillView === "parts"}
                  onClick={() => setSkillView("parts")}
                >
                  TOEIC parts
                </button>
                <button
                  aria-pressed={skillView === "skills"}
                  onClick={() => setSkillView("skills")}
                >
                  Skills
                </button>
              </div>
              {data[skillView].length ? (
                <div className="skill-list">
                  {data[skillView].map((m) => (
                    <Link
                      href={`/practice?${skillView === "parts" ? "part=" + m.key : "skill=" + m.key}`}
                      key={m.key}
                    >
                      <MetricBar metric={m} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="skill-empty">
                  <div className="skill-empty-row">
                    <span className="mini-icon">
                      <Headphones />
                    </span>
                    <span>Listening</span>
                    <div className="bar-track" />
                    <small>No data yet</small>
                  </div>
                  <div className="skill-empty-row">
                    <span className="mini-icon warm">
                      <BookOpen />
                    </span>
                    <span>Reading</span>
                    <div className="bar-track" />
                    <small>No data yet</small>
                  </div>
                  <p>
                    Answer a few questions to build your skill map.
                    Recommendations start at five answers per part.
                  </p>
                </div>
              )}
            </section>
            <section className="panel">
              <SectionHeading
                title="Recent activity"
                href="/review"
                link="See history"
              />
              {data.history.length ? (
                <div className="activity-list">
                  {data.history.slice(0, 4).map((h) => (
                    <Link
                      href={`/results?attempt=${h.attemptId}`}
                      key={h.attemptId}
                    >
                      <span className="activity-icon">
                        {h.mode === "mock" ? <ClipboardCheck /> : <BookOpen />}
                      </span>
                      <div>
                        <strong>{h.title}</strong>
                        <small>
                          {dateLabel(h.completedAt)} · {MODE_LABELS[h.mode]}
                        </small>
                      </div>
                      <strong>{h.accuracy}%</strong>
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty
                  icon={<Bookmark />}
                  title="A clean page"
                  description="Your completed sessions will appear here, with results and answers ready to revisit."
                />
              )}
            </section>
          </div>
          <div className="workspace-tip">
            <ChartNoAxesCombined aria-hidden="true" />
            <p>
              Practice results reflect this question bank. They are independent
              of official ETS scoring.
            </p>
            <Link href="/mock-tests">
              About mock tests <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </>
      ) : null}
    </WorkspaceShell>
  );
}
