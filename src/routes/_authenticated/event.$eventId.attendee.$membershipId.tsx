import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { overlapTags } from "@/lib/interest-tags";
import { OverlapCircles } from "@/components/overlap-circles";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/event/$eventId/attendee/$membershipId")({
  head: () => ({ meta: [{ title: "Reach out — Taba" }] }),
  component: DecisionPage,
});

type Profile = {
  membership_id: string;
  name: string;
  role: string | null;
  industry: string | null;
  tags: string[];
  open_to_connect: boolean;
};

function DecisionPage() {
  const { eventId, membershipId } = Route.useParams();
  const navigate = useNavigate();

  const [eventName, setEventName] = useState("");
  const [me, setMe] = useState<{ name: string; tags: string[]; membership_id: string } | null>(null);
  const [them, setThem] = useState<Profile | null>(null);
  const [overlap, setOverlap] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [thread, setThread] = useState<{ id: string; body: string; sent_at: string; mine: boolean }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const [{ data: ev }, { data: meAcc }, { data: myMem }, { data: theirRow }] = await Promise.all([
        supabase.from("events").select("name").eq("id", eventId).maybeSingle(),
        supabase.from("accounts").select("name").eq("id", userData.user.id).maybeSingle(),
        supabase
          .from("event_memberships")
          .select("id, goal_tags")
          .eq("event_id", eventId)
          .eq("account_id", userData.user.id)
          .maybeSingle(),
        supabase
          .from("event_memberships")
          .select("id, goal_tags, open_to_connect, accounts!inner(name, role, industry)")
          .eq("id", membershipId)
          .maybeSingle(),
      ]);

      if (!ev || !myMem || !theirRow) {
        navigate({ to: "/event/$eventId", params: { eventId }, replace: true });
        return;
      }

      setEventName(ev.name);
      const mineTags = myMem.goal_tags ?? [];
      setMe({ name: meAcc?.name ?? "", tags: mineTags, membership_id: myMem.id });

      const t: Profile = {
        membership_id: theirRow.id,
        name: (theirRow as any).accounts?.name ?? "Someone",
        role: (theirRow as any).accounts?.role ?? null,
        industry: (theirRow as any).accounts?.industry ?? null,
        tags: theirRow.goal_tags ?? [],
        open_to_connect: theirRow.open_to_connect,
      };
      setThem(t);

      const ov = overlapTags(mineTags, t.tags);
      setOverlap(ov);

      // Prefill suggested message
      const firstName = t.name.split(" ")[0];
      const opener = ov[0]
        ? `Hey ${firstName} — saw we're both into ${ov[0]}${
            ov[1] ? ` and ${ov[1]}` : ""
          }. Would love a quick chat about it while we're here.`
        : `Hey ${firstName} — noticed your profile and would love to connect while we're at ${ev.name}.`;
      setBody(opener);
    })();
  }, [eventId, membershipId, navigate]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !them || !body.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        event_id: eventId,
        sender_membership_id: me.membership_id,
        recipient_membership_id: them.membership_id,
        body: body.trim(),
      });
      if (error) throw error;
      toast.success(`Message sent to ${them.name.split(" ")[0]}`);
      navigate({ to: "/event/$eventId", params: { eventId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  if (!me || !them) {
    return <div className="min-h-screen bg-background p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/event/$eventId" params={{ eventId }} className="text-sm text-muted-foreground hover:underline">
            ← Back to attendees
          </Link>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{eventName}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Header — give it space */}
        <section className="mb-12 text-center">
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">{them.name}</h1>
          <p className="mt-3 text-base text-muted-foreground">
            {[them.role, them.industry].filter(Boolean).join(" · ") || "—"}
          </p>
          {them.open_to_connect && (
            <span
              className="mt-4 inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{ background: "var(--moss)", color: "var(--moss-foreground)" }}
            >
              Open to connect
            </span>
          )}
        </section>

        {/* The "in common" moment — payoff screen for the motif */}
        <section className="mb-10 rounded-xl border-2 border-foreground bg-card p-8">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
            <OverlapCircles count={overlap.length} />
            <div className="flex-1">
              {overlap.length > 0 ? (
                <>
                  <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--cobalt)" }}>
                    Common ground
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold leading-snug">
                    You both are into{" "}
                    <span style={{ color: "var(--cobalt)" }}>
                      {overlap.slice(0, 3).join(", ")}
                      {overlap.length > 3 && ` +${overlap.length - 3}`}
                    </span>
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {overlap.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-3 py-1 text-sm"
                        style={{ background: "var(--cobalt)", color: "var(--cobalt-foreground)" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">No overlap yet</p>
                  <h2 className="mt-2 text-2xl font-semibold leading-snug">
                    You don't share tags yet — reach out if their profile resonates anyway.
                  </h2>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Their tags for context */}
        {them.tags.length > 0 && (
          <section className="mb-10">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              What {them.name.split(" ")[0]} wants to talk about
            </p>
            <div className="flex flex-wrap gap-2">
              {them.tags.map((t) => (
                <span
                  key={t}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    overlap.includes(t)
                      ? "border-cobalt text-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Message */}
        <form onSubmit={handleSend} className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold">Send a quick opener</h3>
            <p className="text-xs text-muted-foreground">Pre-filled — tweak it before sending.</p>
          </div>
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex justify-end gap-3">
            <Link
              to="/event/$eventId"
              params={{ eventId }}
              className="rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Not now
            </Link>
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send message"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
