import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { overlapTags, INTEREST_TAGS } from "@/lib/interest-tags";
import { SharePanel } from "@/components/share-panel";
import { TabaLogo } from "@/components/taba-logo";

export const Route = createFileRoute("/_authenticated/event/$eventId/")({
  head: () => ({ meta: [{ title: "Attendees — Taba" }] }),
  component: DashboardPage,
});

type Attendee = {
  membership_id: string;
  account_id: string;
  name: string;
  role: string | null;
  company: string | null;
  industry: string | null;
  languages: string[];
  tags: string[];
  open_to_connect: boolean;
  overlap: string[];
};

const OVERLAP_BAR_SEGMENTS = 5;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

function lastInitial(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return "";
  return `${parts[parts.length - 1][0].toUpperCase()}.`;
}

function displayName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${lastInitial(name)}`;
}

function DashboardPage() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const [eventName, setEventName] = useState("");
  const [eventCode, setEventCode] = useState<string | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [myTags, setMyTags] = useState<string[]>([]);
  const [myName, setMyName] = useState<string>("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [openOnly, setOpenOnly] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const [{ data: ev }, { data: myAcc }, { data: myMem }, { data: rows }] = await Promise.all([
        supabase.from("events").select("name, event_code, organizer_account_id").eq("id", eventId).maybeSingle(),
        supabase.from("accounts").select("name").eq("id", userData.user.id).maybeSingle(),
        supabase
          .from("event_memberships")
          .select("goal_tags")
          .eq("event_id", eventId)
          .eq("account_id", userData.user.id)
          .maybeSingle(),
        supabase
          .from("event_memberships")
          .select("id, account_id, goal_tags, open_to_connect, accounts!inner(name, role, company, industry, languages)")
          .eq("event_id", eventId)
          .neq("account_id", userData.user.id),
      ]);

      if (!ev || !myMem) {
        navigate({ to: "/join/$eventId", params: { eventId }, replace: true });
        return;
      }
      setEventName(ev.name);
      setEventCode(ev.event_code ?? null);
      setIsOrganizer(ev.organizer_account_id === userData.user.id);
      setMyName(myAcc?.name ?? "");
      const mine = myMem.goal_tags ?? [];
      setMyTags(mine);

      const mapped: Attendee[] = (rows ?? []).map((r: any) => ({
        membership_id: r.id,
        account_id: r.account_id,
        name: r.accounts?.name ?? "Someone",
        role: r.accounts?.role ?? null,
        company: r.accounts?.company ?? null,
        industry: r.accounts?.industry ?? null,
        languages: r.accounts?.languages ?? [],
        tags: r.goal_tags ?? [],
        open_to_connect: r.open_to_connect,
        overlap: overlapTags(mine, r.goal_tags ?? []),
      }));
      setAttendees(mapped);
      setLoading(false);
    })();
  }, [eventId, navigate]);

  const roleOptions = useMemo(
    () => Array.from(new Set(attendees.map((a) => a.role).filter((v): v is string => !!v?.trim()))).sort(),
    [attendees],
  );
  const languageOptions = useMemo(
    () => Array.from(new Set(attendees.flatMap((a) => a.languages))).sort(),
    [attendees],
  );
  const companyOptions = useMemo(
    () => Array.from(new Set(attendees.map((a) => a.company).filter((v): v is string => !!v?.trim()))).sort(),
    [attendees],
  );
  const goalOptions = useMemo(() => {
    const present = new Set(attendees.flatMap((a) => a.tags));
    return INTEREST_TAGS.filter((t) => present.has(t));
  }, [attendees]);

  const visible = useMemo(() => {
    let v = attendees;
    if (roleFilter !== "all") v = v.filter((a) => (a.role ?? "").trim() === roleFilter);
    if (languageFilter !== "all") v = v.filter((a) => a.languages.includes(languageFilter));
    if (companyFilter !== "all") v = v.filter((a) => (a.company ?? "").trim() === companyFilter);
    if (goalFilter !== "all") v = v.filter((a) => a.tags.includes(goalFilter));
    if (openOnly) v = v.filter((a) => a.open_to_connect);
    return [...v].sort((a, b) => {
      if (b.overlap.length !== a.overlap.length) return b.overlap.length - a.overlap.length;
      return a.name.localeCompare(b.name);
    });
  }, [attendees, roleFilter, languageFilter, companyFilter, goalFilter, openOnly]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link to="/app">
            <TabaLogo height={22} />
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Link
              to="/event/$eventId/profile"
              params={{ eventId }}
              className="text-muted-foreground hover:text-foreground"
            >
              {myName || "You"}
            </Link>
            <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-6 space-y-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{eventName}</p>
          <h1 className="mt-1 flex items-baseline gap-3 font-heading text-4xl font-semibold tracking-tight">
            Attendees
            <span className="text-base font-normal text-muted-foreground">
              {attendees.length + 1} here
            </span>
          </h1>
        </div>

        {isOrganizer && <SharePanel eventId={eventId} eventCode={eventCode} />}

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill label="Role" value={roleFilter} onChange={setRoleFilter} options={roleOptions} />
          <FilterPill label="Company" value={companyFilter} onChange={setCompanyFilter} options={companyOptions} />
          <FilterPill label="Goal" value={goalFilter} onChange={setGoalFilter} options={goalOptions as unknown as string[]} />
          <FilterPill label="Language" value={languageFilter} onChange={setLanguageFilter} options={languageOptions} />
          <button
            onClick={() => setOpenOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
              openOnly
                ? "border-[color:var(--moss)] bg-[color:color-mix(in_oklab,var(--moss)_22%,transparent)] text-foreground"
                : "border-border bg-card text-foreground hover:border-foreground/40"
            }`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: openOnly ? "var(--moss)" : "var(--muted-foreground)" }}
            />
            Open only
          </button>
        </div>

        <p className="text-xs text-muted-foreground">sorted by overlap ↓</p>

        {/* Attendee list */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading attendees…</p>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No attendees match these filters.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((a) => (
              <li key={a.membership_id}>
                <AttendeeCard eventId={eventId} a={a} myTags={myTags} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function AttendeeCard({ eventId, a, myTags }: { eventId: string; a: Attendee; myTags: string[] }) {
  const filled = Math.min(a.overlap.length, OVERLAP_BAR_SEGMENTS);
  const maxPossible = Math.max(myTags.length, OVERLAP_BAR_SEGMENTS);
  // Build short summary tail like "goal · track · language" or "industry — not open"
  const summaryBits: string[] = [];
  if (a.overlap.length > 0) summaryBits.push(...a.overlap.slice(0, 3).map((t) => t.toLowerCase()));
  const tail = a.open_to_connect ? summaryBits.join(" · ") : `${summaryBits.join(" · ")}${summaryBits.length ? " — " : ""}not open`;

  return (
    <Link
      to="/event/$eventId/attendee/$membershipId"
      params={{ eventId, membershipId: a.membership_id }}
      className="block rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/40 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-heading text-base font-semibold"
          style={{
            background: "color-mix(in oklab, var(--primary) 22%, var(--card))",
            color: "var(--primary)",
          }}
        >
          {initials(a.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-heading text-base font-semibold leading-tight">
                {displayName(a.name)}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {[a.role, a.company].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <span
              className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full"
              style={{
                background: a.open_to_connect ? "var(--moss)" : "transparent",
                border: a.open_to_connect ? "none" : "1.5px solid var(--border)",
              }}
              aria-label={a.open_to_connect ? "Open to connect" : "Not open"}
            />
          </div>

          {/* Overlap progress bar */}
          <div className="mt-3 flex gap-1">
            {Array.from({ length: OVERLAP_BAR_SEGMENTS }).map((_, i) => {
              const on = i < filled;
              return (
                <span
                  key={i}
                  className="h-1.5 flex-1 rounded-full"
                  style={{
                    background: on ? "var(--cobalt)" : "color-mix(in oklab, var(--muted) 70%, transparent)",
                  }}
                />
              );
            })}
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{a.overlap.length} shared</span>
            {tail && <> · {tail}</>}
            {maxPossible > OVERLAP_BAR_SEGMENTS && a.overlap.length > OVERLAP_BAR_SEGMENTS && " ·"}
          </p>
        </div>
      </div>
    </Link>
  );
}

function FilterPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const active = value !== "all";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
          active
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-card text-foreground hover:border-foreground/40"
        }`}
      >
        <span>{active ? value : label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[12rem] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <button
            onClick={() => {
              onChange("all");
              setOpen(false);
            }}
            className={`block w-full px-3 py-2 text-left text-xs hover:bg-muted ${
              value === "all" ? "font-semibold" : ""
            }`}
          >
            All {label.toLowerCase()}s
          </button>
          {options.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No options yet</p>
          )}
          {options.map((o) => (
            <button
              key={o}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-xs hover:bg-muted ${
                value === o ? "font-semibold" : ""
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
