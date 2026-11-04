import Link from "next/link";
export default function Page() {
  return (
    <main className="standalone">
      <span className="eyebrow">404 / PAGE NOT FOUND</span>
      <h1>This page isn’t in your workspace.</h1>
      <p>Your practice sessions are still on your dashboard.</p>
      <Link href="/" className="button button--solid button--brand">
        Return to dashboard
      </Link>
    </main>
  );
}
