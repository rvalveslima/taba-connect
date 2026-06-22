import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { overlapTags, INTEREST_TAGS } from "@/lib/interest-tags";
import { SharePanel } from "@/components/share-panel";
import { TabaLogo } from "@/components/taba-logo";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/route-fallbacks";

type DashboardSearch = {
  role?: string;
  company?: string;
  goal?: string;
  language?: string;
  open?: boolean;
};

export const Route = createFileRoute("/_authenticated/event/$eventId/")({
  head: () => ({ meta: [{ title: "Attendees — Taba" }] }),
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    role: typeof search.role === "string" ? search.role : undefined,
    company: typeof search.company === "string" ? search.company : undefined,
    goal: typeof search.goal === "string" ? search.goal : undefined,
    language: typeof search.language === "string" ? search.language : undefined,
    open: search.open === true || search.open === "true" ? true : undefined,
  }),
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} title="We couldn't load the attendees" />
  ),
  notFoundComponent: () => (
    <RouteNotFoundFallback title="Event not found" description="That event is no longer active." />
  ),
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

  // filters — backed by URL search params
  const search = Route.useSearch();
  const roleFilter = search.role ?? "all";
  const languageFilter = search.language ?? "all";
  const companyFilter = search.company ?? "all";
  const goalFilter = search.goal ?? "all";
  const openOnly = search.open === true;

  function setSearchParam(key: keyof DashboardSearch, value: string | boolean | undefined) {
    navigate({
      to: "/event/$eventId",
      params: { eventId },
      search: (prev: DashboardSearch) => {
        const next = { ...prev } as DashboardSearch;
        if (value === undefined || value === "all" || value === false) {
          delete next[key];
        } else {
          (next as any)[key] = value;
        }
        return next;
      },
      replace: true,
    });
  }
  const setRoleFilter = (v: string) => setSearchParam("role", v);
  const setLanguageFilter = (v: string) => setSearchParam("language", v);
  const setCompanyFilter = (v: string) => setSearchParam("company", v);
  const setGoalFilter = (v: string) => setSearchParam("goal", v);
  const setOpenOnly = (v: boolean) => setSearchParam("open", v);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const [{ data: ev }, { data: codeData }, { data: myAcc }, { data: myMem }, { data: rows }] = await Promise.all([
        supabase.from("events").select("name, organizer_account_id").eq("id", eventId).maybeSingle(),
        supabase.rpc("get_event_code", { _event_id: eventId }),
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
      const mine = myMem.goal_tags ?? [];
      if (mine.length === 0) {
        navigate({ to: "/event/$eventId/profile", params: { eventId }, replace: true });
        return;
      }
      setEventName(ev.name);
      setEventCode((codeData as string | null) ?? null);
      setIsOrganizer(ev.organizer_account_id === userData.user.id);

      setMyName(myAcc?.name ?? "");
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
    () => [
      { value: "en", label: "English" },
      { value: "fr", label: "French" },
      { value: "pt", label: "Portuguese" },
      { value: "es", label: "Spanish" },
      { value: "de", label: "German" },
    ],
    [],
  );
  const LANG_ALIASES: Record<string, string[]> = {
    en: ["en", "english"],
    fr: ["fr", "french", "français", "francais"],
    pt: ["pt", "portuguese", "português", "portugues"],
    es: ["es", "spanish", "español", "espanol"],
    de: ["de", "german", "deutsch"],
  };
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
    if (languageFilter !== "all") {
      const aliases = (LANG_ALIASES[languageFilter] ?? [languageFilter]).map((s) => s.toLowerCase());
      v = v.filter((a) => a.languages.some((l) => aliases.includes(l.toLowerCase())));
    }
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
            <TabaLogo height={44} />
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
            onClick={() => setOpenOnly(!openOnly)}
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

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>sorted by overlap ↓</span>
          {!loading && (
            <span>
              {visible.length === attendees.length
                ? `${attendees.length} ${attendees.length === 1 ? "attendee" : "attendees"}`
                : `${visible.length} of ${attendees.length} attendees`}
            </span>
          )}
        </div>

        {/* Attendee list */}
        {loading ? (
          <ul className="space-y-3" aria-busy="true" aria-label="Loading attendees">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-muted/70 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-muted/70 animate-pulse" />
                    <div className="h-3 w-2/3 rounded bg-muted/60 animate-pulse" />
                    <div className="mt-3 flex gap-1">
                      {Array.from({ length: OVERLAP_BAR_SEGMENTS }).map((_, j) => (
                        <span key={j} className="h-1.5 flex-1 rounded-full bg-muted/60 animate-pulse" />
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No attendees match these filters.</p>
            <button
              onClick={() => {
                setRoleFilter("all");
                setCompanyFilter("all");
                setGoalFilter("all");
                setLanguageFilter("all");
                setOpenOnly(false);
              }}
              className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
            >
              Clear all filters
            </button>
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
  options: Array<string | { value: string; label: string }>;
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

  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  const active = value !== "all";
  const activeLabel = normalized.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={ref} className="relative">
      <div
        className={`inline-flex items-center rounded-full border text-xs transition ${
          active
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-card text-foreground hover:border-foreground/40"
        }`}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5"
        >
          <span>{active ? `${label}: ${activeLabel}` : label}</span>
          {!active && (
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        {active && (
          <button
            onClick={() => onChange("all")}
            aria-label={`Clear ${label} filter`}
            className="pr-2.5 pl-1 py-1.5 opacity-80 hover:opacity-100"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 2l6 6M8 2l-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
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
          {normalized.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No options yet</p>
          )}
          {normalized.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-xs hover:bg-muted ${
                value === o.value ? "font-semibold" : ""
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
