import type { Metadata } from "next";
import { ReviewDashboard } from "@/components/results/review-dashboard";

export const metadata: Metadata = { title: "Answer Review" };

export default function ReviewPage() {
  return <ReviewDashboard />;
}
