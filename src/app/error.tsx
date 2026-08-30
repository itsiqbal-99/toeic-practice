"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { document.title = "Page error — Practice Desk"; }, [error]);
  return (
    <main className="recovery-page">
      <section className="recovery-card">
        <p className="eyebrow">Practice Desk</p>
        <h1>This page could not be displayed</h1>
        <p>Your saved attempt has not been intentionally changed. Retry the page or return to the start.</p>
        <div className="dialog__actions">
          <Button type="button" onClick={reset}>Retry page</Button>
          <Link className="button button--outline button--neutral" href="/">Return to start</Link>
        </div>
      </section>
    </main>
  );
}
