"use client";
import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartNoAxesCombined } from "lucide-react";
import {
  MODE_LABELS,
  comparisonKey,
  type Result,
  type Mode,
} from "@toeic/shared";
import { dateLabel } from "@/lib/api";
import { Empty } from "./common";
export default function HistoryChart({ history }: { history: Result[] }) {
  const [mode, setMode] = useState<Mode>("quick");
  const [cohort, setCohort] = useState("");
  const matching = history.filter((h) => h.mode === mode && !h.imported);
  const options = [
    ...new Map(matching.map((h) => [comparisonKey(h), h])).entries(),
  ];
  const selectedKey = options.some(([key]) => key === cohort)
    ? cohort
    : options[0]?.[0];
  const data = matching
    .filter((h) => comparisonKey(h) === selectedKey)
    .slice(0, 12)
    .reverse()
    .map((h, i) => ({
      name: `${i + 1} · ${dateLabel(h.completedAt)}`,
      Listening: h.sections.find((s) => s.key === "listening")?.accuracy,
      Reading: h.sections.find((s) => s.key === "reading")?.accuracy,
    }));
  return (
    <>
      <div className="segmented" aria-label="Compare sessions">
        {(["quick", "mock", "focused"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} aria-pressed={m === mode}>
            {m === "focused" ? "Practice" : MODE_LABELS[m]}
          </button>
        ))}
      </div>
      {options.length ? (
        <label className="field chart-cohort">
          <span>Session configuration</span>
          <select
            value={selectedKey}
            onChange={(e) => setCohort(e.target.value)}
          >
            {options.map(([key, h]) => (
              <option key={key} value={key}>
                {h.totalQuestions} questions ·{" "}
                {h.mode === "focused"
                  ? h.parts.map((p) => p.label).join(", ")
                  : MODE_LABELS[h.mode]}
                {h.immediate ? " · Immediate feedback" : ""}
                {h.mode === "quick"
                  ? h.timed
                    ? " · Timed"
                    : " · Untimed"
                  : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {data.length ? (
        <>
          <div
            className="chart-wrap"
            role="img"
            aria-label="Listening and reading accuracy across recent sessions"
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={data}
                margin={{ top: 20, right: 20, bottom: 0, left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 6"
                  vertical={false}
                  stroke="#E5E7ED"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#687184" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#687184" }}
                  tickFormatter={(v) => v + "%"}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    borderColor: "#E5E7ED",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="linear"
                  dataKey="Listening"
                  stroke="#4258D6"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  isAnimationActive={false}
                />
                <Line
                  type="linear"
                  dataKey="Reading"
                  stroke="#AB6240"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <details className="chart-data">
            <summary>View chart data</summary>
            <table>
              <caption>Session accuracy</caption>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Listening</th>
                  <th>Reading</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.name}>
                    <td>{d.name}</td>
                    <td>{d.Listening ?? "—"}%</td>
                    <td>{d.Reading ?? "—"}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      ) : (
        <div className="chart-empty">
          <div className="chart-grid" aria-hidden="true">
            <span>100%</span>
            <span>50%</span>
            <span>0%</span>
          </div>
          <Empty
            icon={<ChartNoAxesCombined />}
            title="Your progress starts here"
            description="Complete a session to see your actual Listening and Reading accuracy over time."
          />
        </div>
      )}
      <p className="fine-print">
        Only sessions with the same mode, question count, parts and feedback
        policy share a line. Content varies; these points describe practice, not
        an official TOEIC estimate. Imported results are excluded.
      </p>
    </>
  );
}
