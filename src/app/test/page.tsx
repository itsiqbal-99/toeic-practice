import type { Metadata } from "next";
import { TestWorkspace } from "@/components/test/test-workspace";

export const metadata: Metadata = { title: "Active Test" };

export default function TestPage() {
  return <TestWorkspace />;
}
