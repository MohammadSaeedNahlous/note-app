import type { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  error?: string;
  hint?: string;
};

export function FormField({ name, label, error, hint, ...inputProps }: FormFieldProps) {
  const id = `field-${name}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/60 focus-visible:ring-2 focus-visible:ring-foreground/20 aria-invalid:border-red-600 dark:aria-invalid:border-red-400"
        {...inputProps}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-foreground/60">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Always rendered so screen readers announce the message when it appears. */
export function FormError({ message }: { message: string | null }) {
  return (
    <p role="alert" className="text-sm text-red-600 empty:hidden dark:text-red-400">
      {message}
    </p>
  );
}

type SubmitButtonProps = { pending: boolean; label: string; pendingLabel: string };

export function SubmitButton({ pending, label, pendingLabel }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
