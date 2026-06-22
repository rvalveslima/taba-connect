import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import {
  DEMO_MODE_ENABLED,
  DEMO_EVENT_ID,
  DEMO_ATTENDEE_ACCOUNT_ID,
  signInAsDemoAttendee,
} from "@/lib/demo-mode";

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
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const autoJoinedRef = useRef(false);

  async function refreshSession() {
    const { data } = await supabase.auth.getUser();
    setHasSession(!!data.user);
    setSessionEmail(data.user?.email ?? null);
    setSessionUserId(data.user?.id ?? null);
  }

  useEffect(() => {
    refreshSession();
  }, []);

  async function handleSignOutAndSwitch() {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      await refreshSession();
    } finally {
      setBusy(false);
    }
  }

  const isOrganizer = !!sessionUserId && sessionUserId === event.organizer_account_id;


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

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.href,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      // Tokens set directly — auto-join effect will pick it up.
      await refreshSession();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.href,
          data: name ? { name } : undefined,
        },
      });
      if (otpErr) throw otpErr;
      setMagicLinkSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send magic link.";
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

  async function handleDemoAttendee() {
    setError(null);
    setBusy(true);
    try {
      const ok = await signInAsDemoAttendee();
      if (!ok) return;
      await ensureMembershipAndGo(DEMO_ATTENDEE_ACCOUNT_ID, true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start demo.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const showDemoButton = DEMO_MODE_ENABLED && eventId === DEMO_EVENT_ID;

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
          {hasSession === null ? null : isOrganizer ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
                <p className="font-medium text-foreground">You're the organizer of this event.</p>
                <p className="mt-1 text-muted-foreground">
                  Attendees join with their own account. Sign out to test the attendee flow, or head back to your events.
                </p>
              </div>
              <button
                onClick={handleSignOutAndSwitch}
                disabled={busy}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Signing out…" : "Sign out & join as attendee"}
              </button>
              <Link
                to="/organizer"
                className="block w-full rounded-md border border-border px-4 py-2.5 text-center text-sm font-medium hover:bg-accent"
              >
                Back to your events
              </Link>
            </div>
          ) : hasSession ? (
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
              <p className="text-center text-xs text-muted-foreground">
                By joining, you agree to our{" "}
                <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
                  Terms & Code of Conduct
                </Link>.
              </p>
              <button
                onClick={handleSignOutAndSwitch}
                disabled={busy}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Use a different account
              </button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

          ) : magicLinkSent ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Check your inbox</h2>
              <p className="text-sm text-muted-foreground">
                We sent a magic link to <span className="font-medium text-foreground">{email}</span>.
                Open it on this device to finish joining the event.
              </p>
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Can't find it? Check your <span className="font-medium text-foreground">Spam</span> or{" "}
                <span className="font-medium text-foreground">Promotions</span> folder — the email comes from a
                generic no-reply address. For the most reliable sign-in, use{" "}
                <span className="font-medium text-foreground">Continue with Google</span>.
              </div>
              <button
                onClick={() => { setMagicLinkSent(false); setError(null); }}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-2xl font-semibold">Join this event</h2>
              <p className="mb-1 text-sm text-muted-foreground">
                Sign in to claim your spot. We'll set you up in seconds.
              </p>
              <p className="mb-5 text-xs text-muted-foreground">
                Google is the fastest way in.
              </p>

              {showDemoButton && (
                <div className="mb-5 rounded-md border border-primary/30 bg-primary/5 p-3">
                  <button
                    type="button"
                    onClick={handleDemoAttendee}
                    disabled={busy}
                    className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                  >
                    {busy ? "Starting demo…" : "I'm here for the demo →"}
                  </button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    One-click demo attendee — you'll fill a quick profile next.
                  </p>
                </div>
              )}

              <button
                onClick={handleGoogle}
                disabled={busy}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                Continue with Google
              </button>

              <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                or
                <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleMagicLink} className="space-y-3">
                <Field label="Your name (optional)">
                  <input
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
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={busy || !email}
                  className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
                >
                  {busy ? "Sending…" : "Email me a magic link instead"}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  Delivery can be slow — check Spam/Promotions.
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  By joining, you agree to our{" "}
                  <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
                    Terms & Code of Conduct
                  </Link>.
                </p>
              </form>
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
