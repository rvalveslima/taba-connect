import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { TabaLogo } from "@/components/taba-logo";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    as: typeof search.as === "string" ? search.as : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Taba" },
      { name: "description", content: "Sign in to your Taba account." },
    ],
  }),
  pendingComponent: () => null,
  component: AuthPage,
});

type Mode = "sign-in" | "sign-up";

const ORGANIZER_DEMO_PASSWORD = "Tabaevent123";

function AuthPage() {
  const navigate = useNavigate();
  const { as } = Route.useSearch();
  const isOrganizer = as === "organizer";
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Prefill the demo password on the client only (avoids SSR/CSR hydration mismatch).
  useEffect(() => {
    if (isOrganizer) {
      setPassword((prev) => (prev ? prev : ORGANIZER_DEMO_PASSWORD));
    }
  }, [isOrganizer]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const postAuthTarget = isOrganizer ? "/organizer" : "/app";

  // Track currently signed-in user (if any) so testers can switch accounts
  // without being silently redirected away from the sign-in form.
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleSwitchAccount() {
    await supabase.auth.signOut();
    setCurrentEmail(null);
    setInfo(null);
    setError(null);
  }

  function handleContinueAsCurrent() {
    navigate({ to: postAuthTarget, replace: true });
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (isOrganizer) {
        // Demo: try sign in first, auto sign-up on invalid credentials.
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          const msg = signInError.message.toLowerCase();
          if (msg.includes("invalid") || msg.includes("credentials")) {
            const { data, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: window.location.origin,
                data: { name: email.split("@")[0] },
              },
            });
            if (signUpError) throw signUpError;
            if (!data.session) {
              setInfo("Check your email to confirm your account, then come back to sign in.");
              return;
            }
          } else {
            throw signInError;
          }
        }
      } else if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: name || email.split("@")[0] },
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setInfo("Check your email to confirm your account, then sign in.");
          setMode("sign-in");
          setPassword("");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      navigate({ to: postAuthTarget, replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${postAuthTarget}`,
          data: name ? { name } : undefined,
        },
      });
      if (otpErr) throw otpErr;
      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send magic link.");
    } finally {
      setLoading(false);
    }
  }


  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetErr) throw resetErr;
      setInfo("Check your email for a reset link.");
      setForgotMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${postAuthTarget}`,
    });
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: postAuthTarget, replace: true });
  }


  if (forgotMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <Link to="/" className="inline-flex items-center justify-center">
              <TabaLogo height={32} />
            </Link>
            <h1 className="mt-4 text-2xl font-semibold">Reset password</h1>
            <p className="mt-1 text-sm text-muted-foreground">We'll email you a link to set a new one.</p>
          </div>
          <form onSubmit={handleForgot} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium" htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                autoComplete="email"
              />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <button
              type="button"
              onClick={() => { setForgotMode(false); setError(null); }}
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center justify-center">
            <TabaLogo height={32} />
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">
            {isOrganizer
              ? "Organizer sign in"
              : mode === "sign-in"
                ? "Sign in"
                : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isOrganizer
              ? "Sign in to create your event."
              : mode === "sign-in"
                ? "Welcome back to your village."
                : "Start building your village."}
          </p>
          {!isOrganizer && (
            <p className="mt-2 text-xs text-muted-foreground">
              Google is the fastest way in.
            </p>
          )}
        </div>

        {currentEmail && (
          <div className="mb-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm" role="status">
            <p className="text-foreground">
              Signed in as <span className="font-medium">{currentEmail}</span>.
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <button type="button" onClick={handleContinueAsCurrent} className="font-medium text-primary hover:underline">
                Continue as {currentEmail.split("@")[0]} →
              </button>
              <button type="button" onClick={handleSwitchAccount} className="text-muted-foreground hover:text-foreground hover:underline">
                Sign out and use a different account
              </button>
            </div>
          </div>
        )}

        {isOrganizer && (
          <div className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground" role="status">
            Demo access — use any email with password{" "}
            <span className="font-mono font-semibold">Tabaevent123</span>.
          </div>
        )}

        {info && (
          <div className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground" role="status">
            {info}
          </div>
        )}

        {!isOrganizer && magicLinkSent ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Check your inbox</h2>
            <p className="text-sm text-muted-foreground">
              We sent a magic link to <span className="font-medium text-foreground">{email}</span>.
              Open it on this device to finish signing in.
            </p>
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Can't find it? Check your <span className="font-medium text-foreground">Spam</span> or{" "}
              <span className="font-medium text-foreground">Promotions</span> folder — the email comes from a generic
              no-reply address. For the most reliable sign-in, use{" "}
              <span className="font-medium text-foreground">Continue with Google</span>.
            </div>
            <button
              type="button"
              onClick={() => { setMagicLinkSent(false); setError(null); }}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className={
                isOrganizer
                  ? "mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                  : "mb-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              }
            >
              Continue with Google
            </button>

            <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>

            {isOrganizer ? (
              <>
                <form onSubmit={handleEmail} className="space-y-3">
                  {mode === "sign-up" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium" htmlFor="name">
                        Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        autoComplete="name"
                      />
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-xs font-medium" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-baseline justify-between">
                      <label className="block text-xs font-medium" htmlFor="password">Password</label>
                      {mode === "sign-in" && (
                        <button
                          type="button"
                          onClick={() => { setForgotMode(true); setError(null); setInfo(null); }}
                          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? "…" : "Continue →"}
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium" htmlFor="magic-email">
                    Email
                  </label>
                  <input
                    id="magic-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    autoComplete="email"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                >
                  {loading ? "Sending…" : "Email me a magic link instead"}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  We'll email you a one-tap link. Delivery can be slow — check Spam/Promotions.
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
