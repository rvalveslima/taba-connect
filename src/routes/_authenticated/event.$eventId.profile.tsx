import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { INTEREST_TAGS } from "@/lib/interest-tags";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/event/$eventId/profile")({
  head: () => ({ meta: [{ title: "Your profile — Taba" }] }),
  component: ProfilePage,
});

type Account = {
  id: string;
  name: string;
  role: string | null;
  industry: string | null;
};

type Membership = {
  id: string;
  goal_tags: string[] | null;
};

function ProfilePage() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const [eventName, setEventName] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      const [{ data: ev }, { data: acc }, { data: mem }] = await Promise.all([
        supabase.from("events").select("name").eq("id", eventId).maybeSingle(),
        supabase.from("accounts").select("id, name, role, industry").eq("id", userData.user.id).maybeSingle(),
        supabase
          .from("event_memberships")
          .select("id, goal_tags")
          .eq("event_id", eventId)
          .eq("account_id", userData.user.id)
          .maybeSingle(),
      ]);
      if (!ev || !mem) {
        // No membership for this event — bounce back to join.
        navigate({ to: "/join/$eventId", params: { eventId }, replace: true });
        return;
      }
      setEventName(ev.name);
      setAccount(acc as Account);
      setMembership(mem as Membership);
      setTags(mem.goal_tags ?? []);
    })();
  }, [eventId, navigate]);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!account || !membership) return;
    setSaving(true);
    try {
      const [{ error: accErr }, { error: memErr }] = await Promise.all([
        supabase
          .from("accounts")
          .update({
            name: account.name,
            role: account.role,
            industry: account.industry,
          })
          .eq("id", account.id),
        supabase
          .from("event_memberships")
          .update({ goal_tags: tags })
          .eq("id", membership.id),
      ]);
      if (accErr) throw accErr;
      if (memErr) throw memErr;
      toast.success("Profile saved");
      navigate({ to: "/event/$eventId", params: { eventId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (!account || !membership) {
    return <div className="min-h-screen bg-background p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/event/$eventId" params={{ eventId }} className="text-sm text-muted-foreground hover:underline">
            ← {eventName}
          </Link>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Your profile</span>
        </div>
      </header>

      <form onSubmit={handleSave} className="mx-auto max-w-3xl space-y-8 px-6 py-10">
        {/* Zone A — persistent identity */}
        <section className="rounded-lg border-2 border-foreground bg-card p-6">
          <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-2xl font-semibold">About you</h2>
              <p className="text-sm text-muted-foreground">
                Persistent — carries with you across every Taba event.
              </p>
            </div>
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Account</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Name">
              <input
                required
                value={account.name ?? ""}
                onChange={(e) => setAccount({ ...account, name: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Role">
              <input
                value={account.role ?? ""}
                onChange={(e) => setAccount({ ...account, role: e.target.value })}
                placeholder="e.g. Product Marketing Manager"
                className="input"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Industry / Company">
                <input
                  value={account.industry ?? ""}
                  onChange={(e) => setAccount({ ...account, industry: e.target.value })}
                  placeholder="e.g. SaaS, Acme Co."
                  className="input"
                />
              </Field>
            </div>
          </div>
        </section>

        {/* Zone B — event-scoped */}
        <section className="rounded-lg border-2 border-cobalt bg-card p-6">
          <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-2xl font-semibold" style={{ color: "var(--cobalt)" }}>
                For this event
              </h2>
              <p className="text-sm text-muted-foreground">
                Just for <span className="font-medium text-foreground">{eventName}</span>. Reset for each event you join.
              </p>
            </div>
            <span className="text-xs uppercase tracking-[0.16em]" style={{ color: "var(--cobalt)" }}>
              Event-only
            </span>
          </div>

          <p className="mb-3 text-sm font-medium">What do you want to talk about here?</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Pick anything that fits. Overlap with other attendees is how we rank who to introduce you to.
          </p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_TAGS.map((t) => {
              const on = tags.includes(t);
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    on
                      ? "border-cobalt bg-cobalt text-cobalt-foreground"
                      : "border-border bg-background text-foreground hover:border-foreground"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {tags.length} selected{tags.length < 3 && " — pick 3+ for better matches"}
          </p>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save & see attendees"}
          </button>
        </div>
      </form>

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
        .input:focus { outline: 2px solid var(--ring); outline-offset: 1px; }
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
