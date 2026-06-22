import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TabaLogo } from "@/components/taba-logo";
import { SharePanel } from "@/components/share-panel";

export const Route = createFileRoute("/_authenticated/event/$eventId/share")({
  head: () => ({ meta: [{ title: "Share your event — Taba" }] }),
  component: ShareEventPage,
});

type EventRow = {
  id: string;
  name: string;
  date_start: string | null;
  date_end: string | null;
  event_code: string | null;
  image_url: string | null;
};

function ShareEventPage() {
  const { eventId } = Route.useParams();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, name, date_start, date_end, event_code, image_url")
        .eq("id", eventId)
        .maybeSingle();
      setEvent((data as EventRow) ?? null);
      setLoading(false);
    })();
  }, [eventId]);

  function formatDates(e: EventRow) {
    if (e.date_start && e.date_end) return `${e.date_start} – ${e.date_end}`;
    return e.date_start ?? "";
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link to="/organizer" className="text-sm text-muted-foreground hover:text-foreground">← Your events</Link>
          <Link to="/organizer"><TabaLogo height={36} /></Link>
          <Link to="/organizer" className="text-sm text-muted-foreground hover:text-foreground">Done</Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-10 space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !event ? (
          <p className="text-sm text-muted-foreground">Event not found.</p>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {event.image_url && (
                <img src={event.image_url} alt={event.name} className="h-48 w-full object-cover" />
              )}
              <div className="p-6">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Your event is live</p>
                <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">{event.name}</h1>
                {formatDates(event) && (
                  <p className="mt-1 text-sm text-muted-foreground">{formatDates(event)}</p>
                )}
              </div>
            </div>

            <SharePanel eventId={event.id} eventCode={event.event_code} />

            <div className="flex flex-wrap gap-3">
              <Link
                to="/app"
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
              >
                Back to my events
              </Link>
              <Link
                to="/event/new"
                className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-accent"
              >
                + Create another event
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
