import type { Metadata } from "next";
import { ResultDashboard } from "@/components/results/result-dashboard";

export const metadata: Metadata = { title: "Score Report" };

export default function ResultsPage() {
  return <ResultDashboard />;
}
