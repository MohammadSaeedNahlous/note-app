"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, loginSchema, toFieldErrors, type FieldErrors } from "@/lib/auth-schema";
import { FormError, FormField, SubmitButton } from "./form-field";

type LoginInput = { email: string; password: string };

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginInput>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    setFormError(null);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});

    startTransition(async () => {
      const { error } = await authClient.signIn.email(parsed.data);
      if (error) {
        setFormError(authErrorMessage(error));
        return;
      }
      router.replace("/notes");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        error={fieldErrors.email}
      />
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        error={fieldErrors.password}
      />
      <FormError message={formError} />
      <SubmitButton pending={pending} label="Log in" pendingLabel="Logging in…" />
    </form>
  );
}
