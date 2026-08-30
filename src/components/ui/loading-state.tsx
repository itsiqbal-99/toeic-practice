import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading your test…" }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
