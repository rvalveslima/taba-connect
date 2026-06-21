import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type EventRow = {
  id: string;
  name: string;
  date_start: string | null;
  date_end: string | null;
  image_url: string | null;
  organizer_account_id: string | null;
};

export const Route = createFileRoute("/join/$eventId")({
  head: () => ({
    meta: [
      { title: "Join the event — Taba" },
      { name: "description", content: "Join your event on Taba and start making real connections." },
    ],
  }),
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("events")
      .select("id, name, date_start, date_end, image_url, organizer_account_id")
      .eq("id", params.eventId)
      .maybeSingle();
    if (error || !data) {
      throw redirect({ to: "/" });
    }
    return { event: data as EventRow };
  },
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: JoinPage,
});

function JoinPage() {
  const { event } = Route.useLoaderData();
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<"new" | "existing">("new");
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user);
      setSessionEmail(data.user?.email ?? null);
    });
  }, []);

  async function ensureMembershipAndGo(accountId: string) {
    // Idempotent: if a membership already exists for (account, event), just continue.
    const { data: existing } = await supabase
      .from("event_memberships")
      .select("id")
      .eq("event_id", eventId)
      .eq("account_id", accountId)
      .maybeSingle();

    if (!existing) {
      const { error: insertErr } = await supabase
        .from("event_memberships")
        .insert({ event_id: eventId, account_id: accountId, goal_tags: [] });
      if (insertErr) throw insertErr;
    }
    navigate({ to: "/event/$eventId/profile", params: { eventId }, replace: true });
  }

  async function handleNewAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { data: signUp, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.href,
          data: { name },
        },
      });
      if (signErr) throw signErr;
      if (!signUp.session) {
        // Try immediate sign-in (handles "already registered" or auto-confirm off path).
        const { error: pwErr } = await supabase.auth.signInWithPassword({ email, password });
        if (pwErr) throw new Error("Check your email to confirm your account, then come back to this link.");
      }
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Could not establish a session.");
      // Make sure name landed on the account (trigger seeds it from metadata).
      if (name) {
        await supabase.from("accounts").update({ name }).eq("id", userData.user.id);
      }
      await ensureMembershipAndGo(userData.user.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleExisting(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: pwErr } = await supabase.auth.signInWithPassword({ email, password });
      if (pwErr) throw pwErr;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Could not sign in.");
      await ensureMembershipAndGo(userData.user.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinAsCurrentUser() {
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      await ensureMembershipAndGo(userData.user.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not join.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const dateLine =
    event.date_start && event.date_end
      ? `${event.date_start} – ${event.date_end}`
      : event.date_start ?? "";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-5xl grid-cols-1 md:grid-cols-2">
        {/* Left: event context */}
        <aside className="relative flex flex-col justify-between overflow-hidden border-b border-border bg-primary p-8 text-primary-foreground md:border-b-0 md:border-r">
          {event.image_url && (
            <>
              <img
                src={event.image_url}
                alt={event.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-primary/70" />
            </>
          )}
          <div className="relative">
            <p className="text-sm uppercase tracking-[0.18em] opacity-80">You're joining</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">{event.name}</h1>
            {dateLine && <p className="mt-2 text-sm opacity-90">{dateLine}</p>}
          </div>
          <div className="relative mt-10 space-y-3 text-sm opacity-95">
            <p className="font-medium">Build your own village.</p>
            <p className="opacity-80">
              Two or three real connections — chosen, not collected.
            </p>
          </div>
        </aside>

        {/* Right: form */}
        <section className="flex flex-col justify-center p-8">
          {hasSession === null ? null : hasSession ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Join this event</h2>
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{sessionEmail}</span>.
              </p>
              <button
                onClick={handleJoinAsCurrentUser}
                disabled={busy}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Joining…" : "Join the event"}
              </button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          ) : (
            <>
              <div className="mb-6 flex gap-1 text-sm">
                <button
                  onClick={() => setAuthMode("new")}
                  className={`rounded-md px-3 py-1.5 font-medium transition ${
                    authMode === "new"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  New to Taba
                </button>
                <button
                  onClick={() => setAuthMode("existing")}
                  className={`rounded-md px-3 py-1.5 font-medium transition ${
                    authMode === "existing"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  I have an account
                </button>
              </div>

              {authMode === "new" ? (
                <form onSubmit={handleNewAccount} className="space-y-3">
                  <h2 className="mb-2 text-2xl font-semibold">Create your account</h2>
                  <Field label="Your name">
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input"
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="Password">
                    <input
                      required
                      type="password"
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input"
                      autoComplete="new-password"
                    />
                  </Field>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? "Joining…" : "Join the event"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleExisting} className="space-y-3">
                  <h2 className="mb-2 text-2xl font-semibold">Sign in to join</h2>
                  <Field label="Email">
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="Password">
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input"
                      autoComplete="current-password"
                    />
                  </Field>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? "Joining…" : "Sign in & join"}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: var(--foreground);
        }
        .input:focus {
          outline: 2px solid var(--ring);
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
