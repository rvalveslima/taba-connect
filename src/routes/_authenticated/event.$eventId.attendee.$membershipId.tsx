import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  company: string | null;
  industry: string | null;
  languages: string[];
  linkedin_handle: string | null;
  tags: string[];
  looking_for: string | null;
  give_back: string | null;
  open_to_connect: boolean;
};

type Me = {
  name: string;
  membership_id: string;
  tags: string[];
  industry: string | null;
  languages: string[];
};

const LANG_LABEL: Record<string, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}
function lastInitial(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return "";
  return `${parts[parts.length - 1][0].toUpperCase()}.`;
}
function displayName(name: string) {
  const fn = firstName(name);
  const li = lastInitial(name);
  return li ? `${fn} ${li}` : fn;
}
function langLabel(code: string) {
  return LANG_LABEL[code.toLowerCase()] ?? code.toUpperCase();
}

function commonGroundBullets(me: Me, them: Profile, overlap: string[]): string[] {
  const bullets: string[] = [];
  if (overlap.length > 0) {
    const shown = overlap.slice(0, 2).join(" and ");
    bullets.push(
      overlap.length === 1
        ? `Both here for ${shown}`
        : `Both focused on ${shown}${overlap.length > 2 ? ` +${overlap.length - 2} more` : ""}`,
    );
  }
  const sharedLangs = (me.languages ?? []).filter((l) =>
    (them.languages ?? []).some((tl) => tl.toLowerCase() === l.toLowerCase()),
  );
  const nonEnglish = sharedLangs.find((l) => l.toLowerCase() !== "en");
  if (nonEnglish) {
    bullets.push(`Both speak ${langLabel(nonEnglish)}`);
  } else if (sharedLangs.length > 0) {
    bullets.push(`Both speak ${langLabel(sharedLangs[0])}`);
  }
  if (me.industry && them.industry && me.industry.toLowerCase() === them.industry.toLowerCase()) {
    bullets.push(`Both in ${them.industry}`);
  }
  return bullets.slice(0, 3);
}

function differenceBullet(me: Me, them: Profile): string | null {
  if (me.industry && them.industry && me.industry.toLowerCase() !== them.industry.toLowerCase()) {
    return `Ask how ${firstName(them.name)} navigates ${them.industry} — different from your world in ${me.industry}.`;
  }
  if (them.role) {
    return `Ask what a typical week looks like as ${them.role}.`;
  }
  return null;
}

function buildOpener(me: Me, them: Profile, overlap: string[]): string {
  const fn = firstName(them.name);
  const sharedLang = (me.languages ?? []).find(
    (l) =>
      l.toLowerCase() !== "en" &&
      (them.languages ?? []).some((tl) => tl.toLowerCase() === l.toLowerCase()),
  );
  const langBit = sharedLang ? ` (and both ${langLabel(sharedLang)} speakers)` : "";
  if (overlap.length > 0) {
    const focus = overlap.slice(0, 2).join(" and ");
    return `Hi ${fn} — saw we're both focused on ${focus}${langBit}. Would love to swap notes while we're here. Coffee?`;
  }
  return `Hi ${fn} — your profile caught my eye${langBit}. Free for a quick coffee while we're here?`;
}

function DecisionPage() {
  const { eventId, membershipId } = Route.useParams();
  const navigate = useNavigate();

  const [me, setMe] = useState<Me | null>(null);
  const [them, setThem] = useState<Profile | null>(null);
  const [overlap, setOverlap] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const [{ data: meAcc }, { data: myMem }, { data: theirRow }] = await Promise.all([
        supabase
          .from("accounts")
          .select("name, industry, languages")
          .eq("id", userData.user.id)
          .maybeSingle(),
        supabase
          .from("event_memberships")
          .select("id, goal_tags")
          .eq("event_id", eventId)
          .eq("account_id", userData.user.id)
          .maybeSingle(),
        supabase
          .from("event_memberships")
          .select(
            "id, goal_tags, open_to_connect, looking_for, give_back, accounts!inner(name, role, company, industry, languages, linkedin_handle)",
          )
          .eq("id", membershipId)
          .maybeSingle(),
      ]);

      if (!myMem || !theirRow) {
        navigate({ to: "/event/$eventId", params: { eventId }, replace: true });
        return;
      }

      const mineTags = myMem.goal_tags ?? [];
      const meObj: Me = {
        name: meAcc?.name ?? "",
        membership_id: myMem.id,
        tags: mineTags,
        industry: meAcc?.industry ?? null,
        languages: meAcc?.languages ?? [],
      };
      setMe(meObj);

      const acc = (theirRow as any).accounts ?? {};
      const t: Profile = {
        membership_id: theirRow.id,
        name: acc.name ?? "Someone",
        role: acc.role ?? null,
        company: acc.company ?? null,
        industry: acc.industry ?? null,
        languages: acc.languages ?? [],
        linkedin_handle: acc.linkedin_handle ?? null,
        tags: theirRow.goal_tags ?? [],
        looking_for: theirRow.looking_for ?? null,
        give_back: theirRow.give_back ?? null,
        open_to_connect: theirRow.open_to_connect,
      };
      setThem(t);

      const ov = overlapTags(mineTags, t.tags);
      setOverlap(ov);
      setMessage(buildOpener(meObj, t, ov));
    })();
  }, [eventId, membershipId, navigate]);

  const bullets = useMemo(
    () => (me && them ? commonGroundBullets(me, them, overlap) : []),
    [me, them, overlap],
  );
  const askAbout = useMemo(
    () => (me && them ? differenceBullet(me, them) : null),
    [me, them],
  );

  async function handleConnect() {
    if (!them) return;
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Message copied — paste in LinkedIn");
    } catch {
      // ignore
    }
    if (them.linkedin_handle) {
      const handle = them.linkedin_handle.replace(/^@/, "").replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "").replace(/\/$/, "");
      window.open(`https://www.linkedin.com/in/${handle}/`, "_blank", "noopener,noreferrer");
    }
  }

  if (!me || !them) {
    return <div className="min-h-screen bg-background p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  const fn = firstName(them.name);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center px-6 py-4">
          <Link
            to="/event/$eventId"
            params={{ eventId }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-6 py-10">
        {/* Identity */}
        <section className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {fn[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold leading-tight">{displayName(them.name)}</h1>
              {them.open_to_connect && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: "var(--moss)", color: "var(--moss-foreground)" }}
                >
                  open
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[them.role, them.company, them.industry].filter(Boolean).join(" · ") || "—"}
            </p>
            {them.languages.length > 0 && (
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                {them.languages.map((l) => l.toUpperCase()).join(" · ")}
              </p>
            )}
          </div>
        </section>

        {/* Overlap motif */}
        <section className="flex flex-col items-center">
          <OverlapCircles count={overlap.length} />
          <div className="mt-2 flex w-36 justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>you</span>
            <span>{fn}</span>
          </div>
        </section>

        {/* Common ground */}
        {bullets.length > 0 && (
          <section
            className="rounded-xl border border-border p-5"
            style={{ background: "var(--cream, hsl(var(--muted)))" }}
          >
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--cobalt)" }}>
              {bullets.length} things in common
            </p>
            <ul className="mt-3 space-y-2">
              {bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--cobalt)" }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Wants / Gives */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Wants ↘
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              {them.looking_for?.trim() || <span className="text-muted-foreground">—</span>}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Gives ↗
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              {them.give_back?.trim() || <span className="text-muted-foreground">—</span>}
            </p>
          </div>
        </section>

        {/* One thing to ask about */}
        {askAbout && (
          <section
            className="rounded-xl border-2 p-5"
            style={{ borderColor: "var(--mustard, #E8C547)", background: "color-mix(in oklab, var(--mustard, #E8C547) 14%, transparent)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">One thing to ask about</p>
            <p className="mt-2 text-sm leading-relaxed">{askAbout}</p>
          </section>
        )}

        {/* Suggested message */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Suggested message
            </p>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {editing ? "done" : "edit ✎"}
            </button>
          </div>
          {editing ? (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="mt-3 w-full resize-none rounded-md border border-border bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{message}</p>
          )}
        </section>

        {/* CTA */}
        <button
          type="button"
          onClick={handleConnect}
          className="w-full rounded-full px-6 py-4 text-base font-semibold transition hover:opacity-90"
          style={{ background: "var(--cobalt)", color: "var(--cobalt-foreground)" }}
        >
          {them.linkedin_handle ? `Say hello on LinkedIn` : `Copy message`}
        </button>
      </main>
    </div>
  );
}
