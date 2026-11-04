"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone">
      <h1>This page couldn’t load.</h1>
      <p>
        Your saved sessions are kept on the server. Try again or return to your
        dashboard.
      </p>
      <button className="button button--solid button--brand" onClick={reset}>
        Try again
      </button>
      <Link className="text-link" href="/">
        Return to dashboard
      </Link>
    </main>
  );
}
