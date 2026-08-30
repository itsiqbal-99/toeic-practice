import { forwardRef, type InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, id, className = "", ...props },
  ref,
) {
  const fieldId = id ?? `field-${props.name ?? "input"}`;
  const descriptionId = `${fieldId}-description`;
  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={fieldId}>{label}</label>
      <input
        ref={ref}
        id={fieldId}
        className="field__input"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error || hint ? descriptionId : undefined}
        {...props}
      />
      <div id={descriptionId} className={`field__message ${error ? "field__message--error" : ""}`} aria-live="polite">
        {error ?? hint ?? "\u00a0"}
      </div>
    </div>
  );
});
