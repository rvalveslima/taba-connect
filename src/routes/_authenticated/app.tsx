import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TabaLogo } from "@/components/taba-logo";

const DEMO_EVENT_ID = "2bb9c0d4-1f73-4a89-9232-9eb65c2b99bf";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Your events — Taba" }] }),
  component: AppHome,
});

type EventRow = {
  membership_id: string;
  event_id: string;
  event_name: string;
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
      const { data: userData } = await supabase.auth.getUser();
      setEmail(userData.user?.email ?? null);
      if (!userData.user) return;

      const { data } = await supabase
        .from("event_memberships")
        .select("id, event_id, events!inner(name)")
        .eq("account_id", userData.user.id)
        .order("joined_at", { ascending: false });

      setRows(
        (data ?? []).map((r: any) => ({
          membership_id: r.id,
          event_id: r.event_id,
          event_name: r.events?.name ?? "Event",
        })),
      );
      setLoading(false);
    })();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function handleJoinByCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setCodeBusy(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id")
        .ilike("event_code", trimmed)
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <TabaLogo height={28} />
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{email}</span>
            <button onClick={handleSignOut} className="rounded-md border border-border bg-background px-3 py-1.5 hover:bg-accent">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        {/* Demo / join-by-code panel */}
        <section className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Try the attendee flow
          </p>
          <h2 className="mt-1 text-lg font-semibold">Jump into the demo event</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            For testing without an organizer. Walks you through profile → attendees → opener.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/join/$eventId"
              params={{ eventId: DEMO_EVENT_ID }}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Enter demo event (DEMO26)
            </Link>
            <form onSubmit={handleJoinByCode} className="flex flex-1 gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Or enter a code"
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
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-2xl font-semibold">Your events</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Events you've already joined.
          </p>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                You haven't joined an event yet. Try the demo above.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.membership_id}>
                  <Link
                    to="/event/$eventId"
                    params={{ eventId: r.event_id }}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-5 hover:border-foreground"
                  >
                    <span className="font-medium">{r.event_name}</span>
                    <span className="text-sm text-muted-foreground">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
