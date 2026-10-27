import { z } from "zod";

// Shared by the auth forms (client) and the Better Auth config (server).
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

const email = z.email("Enter a valid email address").trim().toLowerCase();

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name")
    .max(100, "Name must be at most 100 characters"),
  email,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters`),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** First Zod message per field, for inline form feedback. */
export function toFieldErrors<T>(error: z.ZodError<T>): FieldErrors<T> {
  const fieldErrors: Record<string, string | undefined> = {};
  for (const [key, messages] of Object.entries(z.flattenError(error).fieldErrors)) {
    fieldErrors[key] = (messages as string[] | undefined)?.[0];
  }
  return fieldErrors as FieldErrors<T>;
}

/** Maps Better Auth client errors to safe, user-facing messages. */
export function authErrorMessage(error: { code?: string; status: number }): string {
  if (error.status === 429) return "Too many attempts. Please wait a moment and try again.";
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Invalid email or password.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists.";
    case "PASSWORD_TOO_SHORT":
    case "PASSWORD_TOO_LONG":
      return `Password must be ${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD_LENGTH} characters.`;
    default:
      return "Something went wrong. Please try again.";
  }
}
