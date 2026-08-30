"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, BookOpenCheck, Headphones, RotateCcw, Target } from "lucide-react";
import { useTestSession } from "@/features/test/session-context";
import { PROFICIENCY_DESCRIPTIONS } from "@/features/test/config";
import { LoadingState } from "@/components/ui/loading-state";
import { RecoveryState } from "@/components/ui/recovery-state";

function MetricBar({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="metric-bar">
      <div className="metric-bar__label"><span>{label}</span><strong className="mono">{value}%</strong></div>
      <div className="metric-bar__track" role="meter" aria-label={`${label} accuracy`} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${value}%` }} />
      </div>
      <small>{detail}</small>
    </div>
  );
}

export function ResultDashboard() {
  const { hydrationStatus, latestResult } = useTestSession();
  if (hydrationStatus === "loading") return <LoadingState label="Calculating your score report…" />;
  if (!latestResult) return <RecoveryState title="No score report was found" message="Complete a practice test to create your score report." />;

  return (
    <main className="results-page">
      <header className="results-header">
        <Link className="wordmark" href="/"><span className="wordmark__mark">PD</span><span>Practice Desk</span></Link>
        <span className="results-header__label">Candidate score report</span>
      </header>

      <section className="score-hero" aria-labelledby="results-heading">
        <div className="score-hero__intro">
          <p className="eyebrow">Assessment complete</p>
          <h1 id="results-heading">Your practice score report</h1>
          <p>Candidate <strong>{latestResult.candidateName}</strong> · Completed {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(latestResult.completedAt))}</p>
        </div>
        <div className="score-display" aria-label={`Estimated score ${latestResult.estimatedScore} out of 990`}>
          <span>Estimated score</span>
          <strong className="mono">{latestResult.estimatedScore}</strong>
          <small>out of 990 · unofficial estimate</small>
          <div className="score-scale" aria-hidden="true"><i style={{ left: `${(latestResult.estimatedScore / 990) * 100}%` }} /></div>
        </div>
        <div className="ability-card">
          <span>Current ability range</span>
          <strong>{latestResult.abilityBand}</strong>
          <p>{PROFICIENCY_DESCRIPTIONS[latestResult.abilityBand]}</p>
        </div>
      </section>

      <section className="score-stats" aria-label="Score summary">
        <div><Headphones aria-hidden="true" /><span>Listening</span><strong className="mono">{latestResult.listeningScore}</strong><small>out of 495</small></div>
        <div><BookOpenCheck aria-hidden="true" /><span>Reading</span><strong className="mono">{latestResult.readingScore}</strong><small>out of 495</small></div>
        <div><Target aria-hidden="true" /><span>Correct</span><strong className="mono">{latestResult.correct}</strong><small>{latestResult.incorrect} incorrect</small></div>
        <div><BarChart3 aria-hidden="true" /><span>Accuracy</span><strong className="mono">{latestResult.accuracy}%</strong><small>{latestResult.unanswered} unanswered</small></div>
      </section>

      <section className="performance-section" aria-labelledby="performance-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Performance profile</p><h2 id="performance-heading">Where your answers landed</h2></div>
          <p>Accuracy reflects this practice attempt, not an official score conversion.</p>
        </div>
        <div className="performance-grid">
          {latestResult.categoryMetrics.map((metric) => (
            <MetricBar key={metric.key} label={metric.label} value={metric.accuracy} detail={`${metric.correct} of ${metric.total} correct`} />
          ))}
        </div>
      </section>

      <section className="results-actions">
        <div><p className="eyebrow">Next step</p><h2>Turn the score into a study plan.</h2><p>Review every answer, including transcripts for listening questions and explanations for each choice.</p></div>
        <div>
          <Link className="button button--solid button--brand" href="/results/review">Review answers <ArrowRight aria-hidden="true" /></Link>
          <Link className="button button--outline button--neutral" href="/"><RotateCcw aria-hidden="true" /> Start another test</Link>
        </div>
      </section>
    </main>
  );
}
