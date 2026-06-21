import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { overlapTags, INTEREST_TAGS } from "@/lib/interest-tags";
import { SharePanel } from "@/components/share-panel";

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
  const [goalFilters, setGoalFilters] = useState<string[]>([]);
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

  const anyFilter =
    roleFilter !== "all" || languageFilter !== "all" || companyFilter !== "all" || goalFilters.length > 0 || openOnly;

  const visible = useMemo(() => {
    let v = attendees;
    if (roleFilter !== "all") v = v.filter((a) => (a.role ?? "").trim() === roleFilter);
    if (languageFilter !== "all") v = v.filter((a) => a.languages.includes(languageFilter));
    if (companyFilter !== "all") v = v.filter((a) => (a.company ?? "").trim() === companyFilter);
    if (goalFilters.length > 0) v = v.filter((a) => goalFilters.every((g) => a.tags.includes(g)));
    if (openOnly) v = v.filter((a) => a.open_to_connect);
    return [...v].sort((a, b) => {
      if (b.overlap.length !== a.overlap.length) return b.overlap.length - a.overlap.length;
      return a.name.localeCompare(b.name);
    });
  }, [attendees, roleFilter, languageFilter, companyFilter, goalFilters, openOnly]);

  function toggleGoal(g: string) {
    setGoalFilters((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }
  function clearFilters() {
    setRoleFilter("all");
    setLanguageFilter("all");
    setCompanyFilter("all");
    setGoalFilters([]);
    setOpenOnly(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{eventName}</p>
            <h1 className="text-2xl font-semibold">Attendees</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Signed in as {myName}</span>
            <Link
              to="/event/$eventId/profile"
              params={{ eventId }}
              className="rounded-md border border-border bg-background px-3 py-1.5 hover:bg-accent"
            >
              Edit profile
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {isOrganizer && <SharePanel eventId={eventId} eventCode={eventCode} />}

        {/* Filters */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select label="Role" value={roleFilter} onChange={setRoleFilter} options={roleOptions} />
            <Select label="Language" value={languageFilter} onChange={setLanguageFilter} options={languageOptions} />
            <Select label="Company" value={companyFilter} onChange={setCompanyFilter} options={companyOptions} />

            <label className="ml-auto flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--primary)]"
              />
              Open to connect
            </label>

            {anyFilter && (
              <button onClick={clearFilters} className="text-xs text-muted-foreground underline hover:text-foreground">
                Clear filters
              </button>
            )}
          </div>

          {goalOptions.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-muted-foreground">Goals</span>
              {goalOptions.map((g) => {
                const on = goalFilters.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGoal(g)}
                    className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-foreground"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            Sorted by shared goals with you ({myTags.length} on your profile)
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading attendees…</p>
        ) : visible.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {anyFilter
                ? "No attendees match these filters."
                : "No other attendees yet. Share the event link above."}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((a) => (
              <li key={a.membership_id}>
                <Link
                  to="/event/$eventId/attendee/$membershipId"
                  params={{ eventId, membershipId: a.membership_id }}
                  className="group block h-full rounded-lg border border-border bg-card p-5 transition hover:border-foreground"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold leading-tight">{a.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {[a.role, a.company].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    {a.open_to_connect && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: "var(--moss)", color: "var(--moss-foreground)" }}
                      >
                        Open
                      </span>
                    )}
                  </div>

                  {a.overlap.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--cobalt)" }}>
                        {a.overlap.length} in common
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {a.overlap.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2 py-0.5 text-xs"
                            style={{ background: "var(--cobalt)", color: "var(--cobalt-foreground)" }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-muted-foreground">No shared goals yet.</p>
                  )}

                  {a.languages.length > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">{a.languages.join(" · ")}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Select({
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
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
      >
        <option value="all">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
