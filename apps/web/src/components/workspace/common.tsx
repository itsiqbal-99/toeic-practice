"use client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, RotateCcw, LoaderCircle } from "lucide-react";
import Link from "next/link";
import type { Overview, Metric } from "@toeic/shared";
import { api } from "@/lib/api";
export const useOverview = () =>
  useQuery({
    queryKey: ["overview"],
    queryFn: () => api<Overview>("/dashboard/overview"),
  });
export function FetchState({
  loading,
  error,
  retry,
}: {
  loading?: boolean;
  error?: Error | null;
  retry?: () => void;
}) {
  return loading ? (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" aria-hidden="true" />
      <span>Opening your workspace…</span>
      <div className="skeleton-lines">
        <i />
        <i />
        <i />
      </div>
    </div>
  ) : error ? (
    <div className="error-state" role="alert">
      <AlertCircle aria-hidden="true" />
      <h2>We couldn’t load this yet</h2>
      <p>{error.message}</p>
      {retry ? (
        <button className="button button--outline" onClick={retry}>
          <RotateCcw aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </div>
  ) : null;
}
export function MetricBar({ metric }: { metric: Metric }) {
  return (
    <div className="metric-bar">
      <div>
        <span>{metric.label}</span>
        <strong>
          {metric.accuracy}%{" "}
          <small>
            · {metric.correct}/{metric.total}
          </small>
        </strong>
      </div>
      <div className="bar-track">
        <span style={{ width: metric.accuracy + "%" }} />
      </div>
      {metric.total < 5 ? (
        <small className="sample-note">
          Early sample · at least 5 answers needed for a recommendation
        </small>
      ) : null}
    </div>
  );
}
export function SectionHeading({
  title,
  detail,
  href,
  link,
}: {
  title: string;
  detail?: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {detail ? <p>{detail}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="text-link">
          {link || "View all"}
          <ArrowRight aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
export function Empty({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
