import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TabaLogo } from "@/components/taba-logo";

export const Route = createFileRoute("/_authenticated/organizer")({
  head: () => ({ meta: [{ title: "Your events — Taba" }] }),
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

function OrganizerHome() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        setEmail(user?.email ?? null);
        if (!user) return;

        const { data: rows } = await supabase
          .from("events")
          .select("id, name, date_start, date_end, event_code, image_url, created_at")
          .eq("organizer_account_id", user.id)
          .order("created_at", { ascending: false });

        const list = rows ?? [];
        const counts = await Promise.all(
          list.map(async (ev) => {
            const { count } = await supabase
              .from("event_memberships")
              .select("id", { count: "exact", head: true })
              .eq("event_id", ev.id);
            return count ?? 0;
          }),
        );

        setEvents(list.map((ev, i) => ({ ...(ev as Omit<OrganizerEvent, "attendees">), attendees: counts[i] })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { as: "organizer" }, replace: true });
  }

  function formatDates(e: OrganizerEvent) {
    if (e.date_start && e.date_end) return `${e.date_start} – ${e.date_end}`;
    return e.date_start ?? "";
  }

  return (
    <div className="min-h-screen bg-background">
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
                      to="/event/$eventId"
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
      </main>
    </div>
  );
}
