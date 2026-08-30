import Link from "next/link";
import { FileWarning } from "lucide-react";

export function RecoveryState({ title, message }: { title: string; message: string }) {
  return (
    <main className="recovery-page">
      <section className="recovery-card" aria-labelledby="recovery-title">
        <FileWarning aria-hidden="true" />
        <p className="eyebrow">Practice Desk</p>
        <h1 id="recovery-title">{title}</h1>
        <p>{message}</p>
        <Link className="button button--solid button--brand" href="/">Return to start</Link>
      </section>
    </main>
  );
}
