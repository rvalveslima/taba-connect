import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TabaLogo } from "@/components/taba-logo";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/route-fallbacks";

export const Route = createFileRoute("/_authenticated/event/$eventId/overview")({
  head: () => ({ meta: [{ title: "Event overview — Taba" }] }),
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} title="We couldn't load this event" />
  ),
  notFoundComponent: () => (
    <RouteNotFoundFallback title="Event not found" description="That event is no longer active." />
  ),
  component: EventOverviewPage,
});

type EventRow = {
  name: string;
  date_start: string | null;
  date_end: string | null;
  image_url: string | null;
  organizer_account_id: string | null;
};

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return "Dates TBD";
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`;
  return fmt((start ?? end)!);
}

function EventOverviewPage() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [eventCode, setEventCode] = useState<string | null>(null);
  const [attendees, setAttendees] = useState(0);
  const [openToConnect, setOpenToConnect] = useState(0);
  const [connections, setConnections] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const [{ data: ev }, { data: code }, { count }, { count: openCount }, { data: connCount }] = await Promise.all([
          supabase
            .from("events")
            .select("name, date_start, date_end, image_url, organizer_account_id")
            .eq("id", eventId)
            .maybeSingle(),
          supabase.rpc("get_event_code", { _event_id: eventId }),
          supabase
            .from("event_memberships")
            .select("id", { count: "exact", head: true })
            .eq("event_id", eventId),
          supabase
            .from("event_memberships")
            .select("id", { count: "exact", head: true })
            .eq("event_id", eventId)
            .eq("open_to_connect", true),
          supabase.rpc("get_event_connection_count", { _event_id: eventId }),
        ]);

        if (!ev) {
          navigate({ to: "/organizer", replace: true });
          return;
        }
        if (ev.organizer_account_id !== userData.user.id) {
          navigate({ to: "/event/$eventId", params: { eventId }, replace: true });
          return;
        }

        setEvent(ev as EventRow);
        setEventCode((code as string | null) ?? null);
        setAttendees(count ?? 0);
        setOpenToConnect(openCount ?? 0);
        setConnections(typeof connCount === "number" ? connCount : 0);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, navigate]);


  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/organizer">
            <TabaLogo height={44} />
          </Link>
          <Link
            to="/organizer"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← All events
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !event ? (
          <p className="text-sm text-muted-foreground">Event not found.</p>
        ) : (
          <>
            <section className="overflow-hidden rounded-3xl border border-border bg-card">
              <div className="h-56 w-full bg-muted sm:h-72">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-sm text-primary">
                    No cover image yet
                  </div>
                )}
              </div>
              <div className="space-y-3 p-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Event
                </p>
                <h1 className="font-heading text-3xl font-semibold tracking-tight">
                  {event.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{formatDateRange(event.date_start, event.date_end)}</span>
                  {eventCode && (
                    <span className="font-mono uppercase tracking-wide">
                      code {eventCode}
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Attendees joined"
                value={attendees.toLocaleString()}
                hint={`${attendees} member${attendees === 1 ? "" : "s"}`}
              />
              <StatCard
                label="Open to connect"
                value={
                  attendees > 0
                    ? `${Math.round((openToConnect / attendees) * 100)}%`
                    : "—"
                }
                hint={`${openToConnect} of ${attendees}`}
              />
              <StatCard
                label="Connections made"
                value={connections.toLocaleString()}
                hint={
                  connections === 0
                    ? "Connections appear as attendees start real conversations"
                    : `${connections} two-way conversation${connections === 1 ? "" : "s"}`
                }
              />
            </section>

            <section className="flex flex-wrap gap-3">
              <Link
                to="/event/$eventId/share"
                params={{ eventId }}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Share event
              </Link>
            </section>

          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-heading text-4xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
