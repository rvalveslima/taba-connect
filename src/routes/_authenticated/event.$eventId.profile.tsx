import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { INTEREST_TAGS } from "@/lib/interest-tags";
import { profileSchema, normalizeLinkedin } from "@/lib/profile-validation";
import { toast } from "sonner";
import { TabaLogo } from "@/components/taba-logo";

export const Route = createFileRoute("/_authenticated/event/$eventId/profile")({
  head: () => ({ meta: [{ title: "Your profile — Taba" }] }),
  component: ProfilePage,
});

type Account = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  location: string | null;
  linkedin_handle: string | null;
  languages: string[] | null;
};

const COMMON_LANGUAGES = [
  "English", "Português", "Español", "Français", "Deutsch", "Italiano",
  "Nederlands", "中文", "日本語", "한국어", "العربية", "हिन्दी",
];

type Membership = {
  id: string;
  goal_tags: string[] | null;
  looking_for: string | null;
  give_back: string | null;
  open_to_connect: boolean;
};

function ProfilePage() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const [eventName, setEventName] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState("");
  const [giveBack, setGiveBack] = useState("");
  const [openToConnect, setOpenToConnect] = useState(true);
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
        supabase
          .from("accounts")
          .select("id, name, role, company, location, linkedin_handle, languages")
          .eq("id", userData.user.id)
          .maybeSingle(),
        supabase
          .from("event_memberships")
          .select("id, goal_tags, looking_for, give_back, open_to_connect")
          .eq("event_id", eventId)
          .eq("account_id", userData.user.id)
          .maybeSingle(),
      ]);
      if (!ev || !mem) {
        navigate({ to: "/join/$eventId", params: { eventId }, replace: true });
        return;
      }
      setEventName(ev.name);
      const accWithLangs = {
        ...(acc as Account),
        languages: (acc as Account)?.languages?.length ? (acc as Account).languages : ["English"],
      };
      setAccount(accWithLangs);
      setMembership(mem as Membership);
      setTags(mem.goal_tags ?? []);
      setLookingFor(mem.looking_for ?? "");
      setGiveBack(mem.give_back ?? "");
      setOpenToConnect(mem.open_to_connect ?? true);
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
      let linkedinNormalized: string | null;
      try {
        linkedinNormalized = normalizeLinkedin(account.linkedin_handle);
      } catch (linkedinErr) {
        throw linkedinErr;
      }

      const parsed = profileSchema.safeParse({
        name: account.name,
        role: account.role,
        company: account.company,
        location: account.location,
        linkedin_handle: linkedinNormalized,
        languages: account.languages ?? [],
        goal_tags: tags,
        looking_for: lookingFor,
        give_back: giveBack,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Please check your inputs.");
      }
      const v = parsed.data;

      const [{ error: accErr }, { error: memErr }] = await Promise.all([
        supabase
          .from("accounts")
          .update({
            name: v.name,
            role: v.role || null,
            company: v.company || null,
            location: v.location || null,
            linkedin_handle: v.linkedin_handle || null,
            languages: v.languages,
          })
          .eq("id", account.id),
        supabase
          .from("event_memberships")
          .update({
            goal_tags: v.goal_tags,
            looking_for: v.looking_for || null,
            give_back: v.give_back || null,
            open_to_connect: openToConnect,
          })
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
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <Link to="/event/$eventId" params={{ eventId }} className="text-sm text-muted-foreground hover:underline">
            ← {eventName || "Back"}
          </Link>
          <TabaLogo height={24} />
        </div>
      </header>

      <form onSubmit={handleSave} className="mx-auto max-w-2xl space-y-6 px-5 py-8 pb-32">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Set up your profile</h1>

        {/* Zone A — Account */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-heading text-lg font-semibold">You</h2>
            <span className="text-[11px] text-muted-foreground">↻ reused across events</span>
          </div>

          <div className="space-y-4">
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
            <Field label="Company">
              <input
                value={account.company ?? ""}
                onChange={(e) => setAccount({ ...account, company: e.target.value })}
                placeholder="e.g. TechForward"
                className="input"
              />
            </Field>
            <Field label="Location">
              <input
                value={account.location ?? ""}
                onChange={(e) => setAccount({ ...account, location: e.target.value })}
                placeholder="e.g. Lisbon, Portugal"
                className="input"
              />
            </Field>
            <Field label="LinkedIn">
              <div className="flex items-stretch overflow-hidden rounded-md border border-border bg-background focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ring">
                <span className="flex items-center bg-muted px-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  in
                </span>
                <input
                  value={account.linkedin_handle ?? ""}
                  onChange={(e) => setAccount({ ...account, linkedin_handle: e.target.value })}
                  placeholder="/your-handle  or full URL"
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none"
                />
              </div>
            </Field>
            <Field label="Languages">
              <LanguagesPicker
                value={account.languages ?? ["English"]}
                onChange={(langs) => setAccount({ ...account, languages: langs })}
              />
            </Field>
          </div>
        </section>

        {/* Zone B — Event-scoped */}
        <section
          className="rounded-2xl border-2 p-5 shadow-sm"
          style={{ borderColor: "var(--primary)", background: "color-mix(in oklab, var(--primary) 6%, var(--card))" }}
        >
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-heading text-lg font-semibold" style={{ color: "var(--primary)" }}>
              {account.company ? `At ${account.company}` : `For ${eventName}`}
            </h2>
            <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--primary)" }}>
              this event only
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Your goals here</p>
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
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary/60"
                      }`}
                    >
                      {t} {on && "✓"}
                    </button>
                  );
                })}
              </div>
              {tags.length < 3 && (
                <p className="mt-2 text-xs text-muted-foreground">Pick 3+ for better matches.</p>
              )}
            </div>

            <Field label="I'm looking for ↓">
              <input
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                placeholder="e.g. A path into PM leadership"
                className="input"
              />
            </Field>

            <Field label="I can give back ↑">
              <input
                value={giveBack}
                onChange={(e) => setGiveBack(e.target.value)}
                placeholder="e.g. PMM strategy & positioning"
                className="input"
              />
            </Field>

            <label className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: openToConnect ? "var(--primary)" : "var(--muted-foreground)" }}
                />
                Open to connect
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={openToConnect}
                onClick={() => setOpenToConnect((v) => !v)}
                className="relative h-6 w-11 rounded-full transition"
                style={{ background: openToConnect ? "var(--primary)" : "var(--muted)" }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                  style={{ left: openToConnect ? "calc(100% - 1.375rem)" : "0.125rem" }}
                />
              </button>
            </label>
          </div>
        </section>
      </form>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-5 py-3">
          <button
            onClick={handleSave}
            disabled={saving}
            aria-label="Save profile and find people"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-base font-semibold text-[var(--background)] transition hover:opacity-90 disabled:opacity-50"
          >
            <span>{saving ? "Saving…" : "Find people"}</span>
            {!saving && <span aria-hidden="true">→</span>}
          </button>
        </div>
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
        .input:focus { outline: 2px solid var(--ring); outline-offset: 1px; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">{label}</span>
      {children}
    </label>
  );
}

function LanguagesPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (langs: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  function remove(lang: string) {
    onChange(value.filter((l) => l !== lang));
  }
  function add(lang: string) {
    const v = lang.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setDraft("");
    setAdding(false);
  }

  const suggestions = COMMON_LANGUAGES.filter((l) => !value.includes(l));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((lang) => (
          <span
            key={lang}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-sm"
          >
            {lang}
            <button
              type="button"
              onClick={() => remove(lang)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${lang}`}
            >
              ×
            </button>
          </span>
        ))}
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            + add
          </button>
        ) : (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(draft);
              } else if (e.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
            onBlur={() => {
              if (draft.trim()) add(draft);
              else setAdding(false);
            }}
            placeholder="Type a language…"
            className="rounded-full border border-border bg-background px-3 py-1 text-sm outline-none focus:border-foreground"
          />
        )}
      </div>
      {adding && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.slice(0, 8).map((s) => (
            <button
              type="button"
              key={s}
              onMouseDown={(e) => {
                e.preventDefault();
                add(s);
              }}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-foreground hover:text-background"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
