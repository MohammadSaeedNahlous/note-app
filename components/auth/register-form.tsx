"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import {
  authErrorMessage,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  registerSchema,
  toFieldErrors,
  type FieldErrors,
} from "@/lib/auth-schema";
import { FormError, FormField, SubmitButton } from "./form-field";

type RegisterInput = { name: string; email: string; password: string };

export function RegisterForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterInput>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = registerSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    setFormError(null);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});

    startTransition(async () => {
      // autoSignIn is on, so a successful sign-up also creates the session.
      const { error } = await authClient.signUp.email(parsed.data);
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
      <FormField name="name" label="Name" autoComplete="name" required error={fieldErrors.name} />
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
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        maxLength={MAX_PASSWORD_LENGTH}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        error={fieldErrors.password}
      />
      <FormError message={formError} />
      <SubmitButton pending={pending} label="Create account" pendingLabel="Creating account…" />
    </form>
  );
}
