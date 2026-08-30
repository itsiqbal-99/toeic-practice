"use client";

import { TestSessionProvider } from "@/features/test/session-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <TestSessionProvider>{children}</TestSessionProvider>;
}
