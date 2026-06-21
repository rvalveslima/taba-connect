import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TabaLogo } from "@/components/taba-logo";

const DEMO_EVENT_ID = "2bb9c0d4-1f73-4a89-9232-9eb65c2b99bf";
const ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Your events — Taba" }] }),
  component: AppHome,
});

type EventRow = {
  membership_id: string;
  event_id: string;
  event_name: string;
  date_start: string | null;
  date_end: string | null;
  joined_at: string;
  profile_complete: boolean;
};

function AppHome() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        setEmail(userData.user?.email ?? null);
        if (!userData.user) return;

        const { data } = await supabase
          .from("event_memberships")
          .select("id, event_id, goal_tags, joined_at, events!inner(name, date_start, date_end)")
          .eq("account_id", userData.user.id)
          .order("joined_at", { ascending: false });

        setRows(
          (data ?? []).map((r: any) => ({
            membership_id: r.id,
            event_id: r.event_id,
            event_name: r.events?.name ?? "Event",
            date_start: r.events?.date_start ?? null,
            date_end: r.events?.date_end ?? null,
            joined_at: r.joined_at,
            profile_complete: Array.isArray(r.goal_tags) && r.goal_tags.length > 0,
          })),
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function handleJoinByCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setCodeBusy(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id")
        .eq("event_code", trimmed)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error(`No event found for code "${trimmed}".`);
        return;
      }
      navigate({ to: "/join/$eventId", params: { eventId: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not look up event.");
    } finally {
      setCodeBusy(false);
    }
  }

  const now = Date.now();
  const current = rows.find((r) => now - new Date(r.joined_at).getTime() < ACTIVE_WINDOW_MS);
  const past = rows.filter((r) => r !== current);

  function eventHref(r: EventRow) {
    return r.profile_complete
      ? { to: "/event/$eventId" as const, params: { eventId: r.event_id } }
      : { to: "/event/$eventId/profile" as const, params: { eventId: r.event_id } };
  }

  function formatDates(r: EventRow) {
    if (r.date_start && r.date_end) return `${r.date_start} – ${r.date_end}`;
    return r.date_start ?? "";
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <TabaLogo height={44} />
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{email}</span>
            <button onClick={handleSignOut} className="rounded-md border border-border bg-background px-3 py-1.5 hover:bg-accent">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {current && (
              <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <div className="p-7">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-80">Happening now</p>
                  <h2 className="mt-2 font-heading text-3xl font-semibold leading-tight">{current.event_name}</h2>
                  {formatDates(current) && <p className="mt-1 text-sm opacity-90">{formatDates(current)}</p>}
                  <Link
                    {...eventHref(current)}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:opacity-90"
                  >
                    {current.profile_complete ? "Open event" : "Complete your profile"} →
                  </Link>
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-1 text-2xl font-semibold">{past.length > 0 ? "Past events" : "Your events"}</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                {past.length > 0 ? "Events you've joined before." : "You haven't joined any past events yet."}
              </p>

              {past.length === 0 && !current ? (
                <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    No events yet. Use a code below or follow an invite link.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {past.map((r) => (
                    <li key={r.membership_id}>
                      <Link
                        {...eventHref(r)}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-5 hover:border-foreground"
                      >
                        <div>
                          <p className="font-medium">{r.event_name}</p>
                          {formatDates(r) && (
                            <p className="text-xs text-muted-foreground">{formatDates(r)}</p>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">Open →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-dashed border-border bg-card/50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Join or host</p>
                <Link
                  to="/event/new"
                  className="rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
                >
                  + Create event
                </Link>
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <form onSubmit={handleJoinByCode} className="flex flex-1 gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter event code"
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={codeBusy || !code.trim()}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                  >
                    Join
                  </button>
                </form>
                <Link
                  to="/join/$eventId"
                  params={{ eventId: DEMO_EVENT_ID }}
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Try the demo event
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
