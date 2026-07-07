import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TabaLogo } from "@/components/taba-logo";
import { DEMO_ORGANIZER_EMAIL } from "@/lib/demo-mode";
import { RouteErrorFallback } from "@/components/route-fallbacks";
import { FeedbackCard } from "@/components/organizer/feedback-card";

export const Route = createFileRoute("/_authenticated/organizer")({
  head: () => ({ meta: [{ title: "Your events — Taba" }] }),
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} title="We couldn't load your events" />
  ),
  component: OrganizerHome,
});


type OrganizerEvent = {
  id: string;
  name: string;
  date_start: string | null;
  date_end: string | null;
  event_code: string | null;
  image_url: string | null;
  created_at: string;
  attendees: number;
};

type WaitlistRow = {
  id: string;
  email: string;
  source: string | null;
  open_to_chat: boolean;
  created_at: string;
};

function OrganizerHome() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        setEmail(user?.email ?? null);
        if (!user) return;

        const [{ data: rows }, { data: acct }] = await Promise.all([
          supabase
            .from("events")
            .select("id, name, date_start, date_end, image_url, created_at")
            .eq("organizer_account_id", user.id)
            .order("created_at", { ascending: false }),
          supabase.from("accounts").select("is_admin").eq("id", user.id).maybeSingle(),
        ]);

        const admin = !!acct?.is_admin;
        setIsAdmin(admin);

        const list = rows ?? [];
        const enriched = await Promise.all(
          list.map(async (ev) => {
            const [{ count }, { data: codeData }] = await Promise.all([
              supabase
                .from("event_memberships")
                .select("id", { count: "exact", head: true })
                .eq("event_id", ev.id),
              supabase.rpc("get_event_code", { _event_id: ev.id }),
            ]);
            return {
              ...(ev as Omit<OrganizerEvent, "attendees" | "event_code">),
              attendees: count ?? 0,
              event_code: (codeData as string | null) ?? null,
            };
          }),
        );

        setEvents(enriched);

        if (admin) {
          const { data: wl } = await supabase
            .from("organizer_waitlist")
            .select("id, email, source, open_to_chat, created_at")
            .order("created_at", { ascending: false });
          setWaitlist((wl ?? []) as WaitlistRow[]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  function formatDates(e: OrganizerEvent) {
    if (e.date_start && e.date_end) return `${e.date_start} – ${e.date_end}`;
    return e.date_start ?? "";
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <TabaLogo height={44} />
          <div className="flex items-center gap-3 text-sm">
            {email && <span className="hidden text-muted-foreground sm:inline">{email}</span>}
            <button
              onClick={handleSignOut}
              className="rounded-md border border-border bg-background px-3 py-1.5 hover:bg-accent"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">
        {email === DEMO_ORGANIZER_EMAIL && (
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 text-sm">
            <p className="font-semibold text-foreground">👋 You're in the demo.</p>
            <p className="mt-1 text-muted-foreground">
              Open <span className="font-medium text-foreground">Shebuilds</span> below, then click{" "}
              <span className="font-medium text-foreground">Share</span> to grab the attendee join link and try the attendee experience on your phone.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Your events</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything you've created with {email ?? "this account"}.
            </p>
          </div>
          <Link
            to="/event/new"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
          >
            + Create new event
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-base font-medium">No events yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first event to get a shareable link and QR code for attendees.
            </p>
            <Link
              to="/event/new"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              + Create your first event
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground/40"
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="h-24 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:h-20 sm:w-28">
                    {ev.image_url ? (
                      <img src={ev.image_url} alt={ev.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs text-primary">
                        No cover
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-lg font-semibold">{ev.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {formatDates(ev) && <span>{formatDates(ev)}</span>}
                      {ev.event_code && (
                        <span className="font-mono uppercase tracking-wide">code {ev.event_code}</span>
                      )}
                      <span>
                        {ev.attendees} attendee{ev.attendees === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      to="/event/$eventId/share"
                      params={{ eventId: ev.id }}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                    >
                      Share
                    </Link>
                    <Link
                      to="/event/$eventId/overview"
                      params={{ eventId: ev.id }}
                      className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {isAdmin && (
          <section className="space-y-3">
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Early-access signups
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {waitlist.length} signup{waitlist.length === 1 ? "" : "s"} from the marketing page.
              </p>
            </div>
            {waitlist.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
                No signups yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {waitlist.map((w) => (
                  <li
                    key={w.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">{w.email}</span>
                        {w.open_to_chat && (
                          <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                            open to chat
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        {w.source && <span>source: {w.source}</span>}
                        <span>{new Date(w.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <FeedbackCard />
      </main>
    </div>
  );
}
