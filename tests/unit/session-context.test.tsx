import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TestSessionProvider, useTestSession } from "@/features/test/session-context";

function SessionProbe() {
  const session = useTestSession();
  const first = session.activeContexts[0];
  return (
    <div>
      <span data-testid="status">{session.hydrationStatus}</span>
      <span data-testid="candidate">{session.activeSession?.candidateName ?? "none"}</span>
      <span data-testid="answer">{first && session.activeSession?.answers[first.question.id] ? "answered" : "empty"}</span>
      <button type="button" onClick={() => session.startAttempt("Taylor Reed")}>start</button>
      <button type="button" onClick={() => first && session.answerQuestion(first.question.id, "A")}>answer</button>
    </div>
  );
}

describe("TestSessionProvider", () => {
  beforeEach(() => window.localStorage.clear());

  it("creates, updates, and persists an attempt through the shared owner", async () => {
    const user = userEvent.setup();
    render(<TestSessionProvider><SessionProbe /></TestSessionProvider>);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ready"));
    await user.click(screen.getByRole("button", { name: "start" }));
    expect(screen.getByTestId("candidate")).toHaveTextContent("Taylor Reed");
    await user.click(screen.getByRole("button", { name: "answer" }));
    expect(screen.getByTestId("answer")).toHaveTextContent("answered");
    expect(window.localStorage.length).toBeGreaterThan(0);
  });
});
