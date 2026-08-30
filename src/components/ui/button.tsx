import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";

type ButtonEmphasis = "solid" | "outline" | "ghost";
type ButtonIntent = "brand" | "neutral" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  emphasis?: ButtonEmphasis;
  intent?: ButtonIntent;
  busy?: boolean;
}

export function Button({
  className = "",
  emphasis = "solid",
  intent = "brand",
  busy = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button--${emphasis} button--${intent} ${className}`.trim()}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      <span className="button__content" aria-hidden={busy || undefined}>{children}</span>
      {busy ? (
        <>
          <span className="sr-only">{children}</span>
          <LoaderCircle className="button__spinner" aria-hidden="true" />
        </>
      ) : null}
    </button>
  );
}
