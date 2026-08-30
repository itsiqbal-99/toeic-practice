"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Headphones, RotateCcw, ShieldCheck } from "lucide-react";
import { useTestSession } from "@/features/test/session-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { TextField } from "@/components/ui/text-field";

export function LandingClient() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    hydrationStatus,
    activeSession,
    startAttempt,
    clearCorruptData,
    persistenceWarning,
  } = useTestSession();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (hydrationStatus === "loading")
    return <LoadingState label="Preparing the practice desk…" />;

  const begin = () => {
    const candidateName = name.trim();
    if (!candidateName) {
      setError("Enter your name to begin the practice test.");
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    if (activeSession) {
      setReplaceOpen(true);
      return;
    }
    setBusy(true);
    startAttempt(candidateName);
    router.push("/test");
  };

  const replace = () => {
    setBusy(true);
    startAttempt(name.trim());
    setReplaceOpen(false);
    router.push("/test");
  };

  return (
    <main className="landing">
      <header className="landing__nav">
        <a
          className="wordmark"
          href="#main-content"
          aria-label="Practice Desk home"
        >
          <span className="wordmark__mark">TP</span>
          <span>TOEIC Practice</span>
        </a>
        <span className="landing__nav-note">
          Independent English assessment
        </span>
      </header>

      <section
        id="main-content"
        className="landing__hero"
        aria-labelledby="landing-title"
      >
        <div className="landing__intro">
          <p className="eyebrow">Listening + Reading</p>
          <h1 id="landing-title">A focused test of your workplace English.</h1>
          <p className="landing__lede">
            Complete a full 100-question practice assessment, then see an
            estimated score and a clear breakdown of where you are strongest.
          </p>
          <div className="test-specs" aria-label="Test overview">
            <div>
              <strong>100</strong>
              <span>questions</span>
            </div>
            <div>
              <strong>50 / 50</strong>
              <span>listening / reading</span>
            </div>
            <div>
              <strong>60–75</strong>
              <span>minutes suggested</span>
            </div>
          </div>
        </div>

        <aside className="candidate-card" aria-labelledby="candidate-heading">
          <div className="candidate-card__header">
            <p className="eyebrow">Candidate briefing</p>
            <span className="candidate-card__status">
              <span /> Ready
            </span>
          </div>
          <h2 id="candidate-heading">Start your practice test</h2>
          <p>
            Your progress is saved on this device. There is no enforced time
            limit.
          </p>

          {hydrationStatus === "corrupt" ? (
            <div className="inline-alert" role="alert">
              <strong>Saved data could not be restored.</strong>
              <span>Clear it to start with a fresh practice desk.</span>
              <Button
                type="button"
                emphasis="outline"
                intent="neutral"
                onClick={clearCorruptData}
              >
                Clear saved data
              </Button>
            </div>
          ) : null}

          {persistenceWarning ? (
            <p className="inline-alert" role="status">
              This browser blocked local storage. You can continue, but
              refreshing may lose progress.
            </p>
          ) : null}

          {activeSession ? (
            <div className="resume-card">
              <div>
                <span>Test in progress</span>
                <strong>{activeSession.candidateName}</strong>
                <small>Question {activeSession.currentIndex + 1} of 100</small>
              </div>
              <Button type="button" onClick={() => router.push("/test")}>
                Resume test <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          ) : null}

          <form
            className="start-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              begin();
            }}
          >
            <TextField
              ref={inputRef}
              id="candidate-name"
              name="candidateName"
              label={
                activeSession
                  ? "Or start with a different name"
                  : "Candidate name"
              }
              placeholder="Enter your name"
              autoComplete="name"
              value={name}
              maxLength={80}
              error={error}
              onChange={(event) => {
                setName(event.target.value);
                if (error && event.target.value.trim()) setError("");
              }}
            />
            <Button type="submit" busy={busy}>
              {activeSession ? "Start a new test" : "Start practice test"}{" "}
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
          <p className="privacy-note">
            <ShieldCheck aria-hidden="true" /> No account. Your name and answers
            stay in this browser.
          </p>
        </aside>
      </section>

      <section
        className="landing__instructions"
        aria-labelledby="before-heading"
      >
        <div>
          <p className="eyebrow">Before you begin</p>
          <h2 id="before-heading">Settle in, then work at your own pace.</h2>
        </div>
        <ol>
          <li>
            <Headphones aria-hidden="true" />
            <span>
              <strong>Use headphones</strong> Listening audio never starts
              automatically.
            </span>
          </li>
          <li>
            <RotateCcw aria-hidden="true" />
            <span>
              <strong>Move freely</strong> Return to any question and mark items
              for review.
            </span>
          </li>
          <li>
            <ShieldCheck aria-hidden="true" />
            <span>
              <strong>Review deliberately</strong> You will see unanswered
              totals before final submission.
            </span>
          </li>
        </ol>
      </section>

      <Dialog
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        title="Start a new test?"
        description={`This will replace ${activeSession?.candidateName ?? "the current candidate"}’s saved progress on this device.`}
        showClose={false}
      >
        <div className="dialog__actions">
          <DialogClose asChild>
            <Button type="button" emphasis="outline" intent="neutral">
              Keep current test
            </Button>
          </DialogClose>
          <Button type="button" intent="danger" onClick={replace}>
            Start new test
          </Button>
        </div>
      </Dialog>
    </main>
  );
}
