// Maps raw Supabase / network errors to friendly user-facing copy.
// Always logs the raw error to the console for debugging.

type MaybePostgrestError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
  name?: string;
};

export type FriendlyErrorOptions = {
  // Override the message used when a 23505 unique_violation is detected
  // (e.g. "You've already joined this event.").
  uniqueViolation?: string;
};

function asPgError(err: unknown): MaybePostgrestError | null {
  if (err && typeof err === "object") return err as MaybePostgrestError;
  return null;
}

function getMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  const pg = asPgError(err);
  if (pg?.message) return pg.message;
  if (typeof err === "string") return err;
  return "";
}

function isNetworkError(err: unknown, msg: string): boolean {
  if (err instanceof TypeError) return true;
  const lower = msg.toLowerCase();
  return (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed") ||
    (typeof navigator !== "undefined" && navigator && navigator.onLine === false)
  );
}

export function friendlyError(
  err: unknown,
  fallback: string,
  options: FriendlyErrorOptions = {},
): string {
  // Always log the raw error so devs can debug.
  // eslint-disable-next-line no-console
  console.error(err);

  const pg = asPgError(err);
  const code = pg?.code ?? "";
  const msg = getMessage(err);
  const lower = msg.toLowerCase();

  // Network / offline
  if (isNetworkError(err, msg)) {
    return "Network hiccup — check your connection and try again.";
  }

  // Postgrest / Postgres codes
  if (code === "23505") {
    return options.uniqueViolation ?? "Looks like that already exists.";
  }
  if (code === "23503") {
    return "We couldn't find that event anymore. It may have been removed.";
  }
  if (
    code === "42501" ||
    lower.includes("row-level security") ||
    lower.includes("row level security") ||
    lower.includes("permission denied")
  ) {
    return "You don't have permission to do that.";
  }
  if (code === "PGRST116") {
    return "Couldn't find what you were looking for.";
  }

  // Supabase Auth messages
  if (lower.includes("invalid login credentials")) {
    return "That email and password don't match.";
  }
  if (lower.includes("user already registered")) {
    return "An account with that email already exists — try signing in.";
  }
  if (lower.includes("email rate limit") || lower.includes("rate limit")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email first — check your inbox.";
  }
  if (lower.includes("password should be at least")) {
    return "Use a longer password (at least 6 characters).";
  }
  if (lower.includes("for security purposes")) {
    // e.g. "For security purposes, you can only request this after 60 seconds."
    return "Please wait a moment before trying again.";
  }

  return fallback;
}
