import "server-only";
import type { BetterAuthOptions } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "./auth-schema";
import { db } from "./db";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

// Kept separate from `auth` so migrations can run before betterAuth() starts its schema check.
export const authOptions = {
  database: db,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL,
  trustedOrigins: [baseURL],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
    autoSignIn: true,
  },
  plugins: [nextCookies()], // must stay last
} satisfies BetterAuthOptions;
