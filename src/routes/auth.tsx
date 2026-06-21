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
  const [password, setPassword] = useState(isOrganizer ? ORGANIZER_DEMO_PASSWORD : "");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const postAuthTarget = isOrganizer ? "/event/new" : "/app";

  // If already signed in, send to home (or event creation in organizer flow).
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: postAuthTarget, replace: true });
    });
  }, [navigate, postAuthTarget]);

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
        </div>

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


        <button
          onClick={handleGoogle}
          disabled={loading}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

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
              {mode === "sign-in" && !isOrganizer && (
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
            {loading ? "…" : isOrganizer ? "Continue →" : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>

        {!isOrganizer && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "sign-in" ? "New to Taba?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setInfo(null);
                setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              }}
              className="font-medium text-foreground hover:underline"
            >
              {mode === "sign-in" ? "Create an account" : "Sign in"}
            </button>
          </p>
        )}

      </div>
    </div>
  );
}
