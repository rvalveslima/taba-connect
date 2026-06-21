import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold">Taba</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{email}</span>
            <button onClick={handleSignOut} className="rounded-md border border-border bg-background px-3 py-1.5 hover:bg-accent">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h2 className="mb-1 text-2xl font-semibold">Your events</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          You join an event via a link from the organizer (`/join/&lt;event-id&gt;`).
        </p>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              You haven't joined an event yet. Open the join link your organizer shared with you.
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
      </main>
    </div>
  );
}
