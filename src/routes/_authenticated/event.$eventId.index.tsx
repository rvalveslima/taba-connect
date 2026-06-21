import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { overlapTags } from "@/lib/interest-tags";

export const Route = createFileRoute("/_authenticated/event/$eventId/")({
  head: () => ({ meta: [{ title: "Attendees — Taba" }] }),
  component: DashboardPage,
});

type Attendee = {
  membership_id: string;
  account_id: string;
  name: string;
  role: string | null;
  industry: string | null;
  tags: string[];
  open_to_connect: boolean;
  overlap: string[];
};

function DashboardPage() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const [eventName, setEventName] = useState("");
  const [myTags, setMyTags] = useState<string[]>([]);
  const [myName, setMyName] = useState<string>("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const [{ data: ev }, { data: myAcc }, { data: myMem }, { data: rows }] = await Promise.all([
        supabase.from("events").select("name").eq("id", eventId).maybeSingle(),
        supabase.from("accounts").select("name").eq("id", userData.user.id).maybeSingle(),
        supabase
          .from("event_memberships")
          .select("goal_tags")
          .eq("event_id", eventId)
          .eq("account_id", userData.user.id)
          .maybeSingle(),
        supabase
          .from("event_memberships")
          .select("id, account_id, goal_tags, open_to_connect, accounts!inner(name, role, industry)")
          .eq("event_id", eventId)
          .neq("account_id", userData.user.id),
      ]);

      if (!ev || !myMem) {
        navigate({ to: "/join/$eventId", params: { eventId }, replace: true });
        return;
      }
      setEventName(ev.name);
      setMyName(myAcc?.name ?? "");
      const mine = myMem.goal_tags ?? [];
      setMyTags(mine);

      const mapped: Attendee[] = (rows ?? []).map((r: any) => ({
        membership_id: r.id,
        account_id: r.account_id,
        name: r.accounts?.name ?? "Someone",
        role: r.accounts?.role ?? null,
        industry: r.accounts?.industry ?? null,
        tags: r.goal_tags ?? [],
        open_to_connect: r.open_to_connect,
        overlap: overlapTags(mine, r.goal_tags ?? []),
      }));
      setAttendees(mapped);
      setLoading(false);
    })();
  }, [eventId, navigate]);

  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    attendees.forEach((a) => {
      if (a.role && a.role.trim()) set.add(a.role.trim());
    });
    return Array.from(set).sort();
  }, [attendees]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    attendees.forEach((a) => a.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [attendees]);

  const visible = useMemo(() => {
    let v = attendees;
    if (roleFilter !== "all") v = v.filter((a) => (a.role ?? "").trim() === roleFilter);
    if (tagFilter) v = v.filter((a) => a.tags.includes(tagFilter));
    // overlap-sort: most shared tags first; secondary sort by name for stable order
    return [...v].sort((a, b) => {
      if (b.overlap.length !== a.overlap.length) return b.overlap.length - a.overlap.length;
      return a.name.localeCompare(b.name);
    });
  }, [attendees, roleFilter, tagFilter]);

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

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="text-sm text-muted-foreground">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value="all">All roles</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <span className="ml-2 text-sm text-muted-foreground">Tag</span>
          <div className="flex flex-wrap gap-1">
            {tagFilter && (
              <button
                onClick={() => setTagFilter(null)}
                className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background"
              >
                {tagFilter} ✕
              </button>
            )}
            {!tagFilter &&
              allTags.slice(0, 8).map((t) => (
                <button
                  key={t}
                  onClick={() => setTagFilter(t)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:border-foreground"
                >
                  {t}
                </button>
              ))}
          </div>

          <span className="ml-auto text-xs text-muted-foreground">
            Sorted by shared tags with you ({myTags.length} on your profile)
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading attendees…</p>
        ) : visible.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No other attendees match this filter yet. Try clearing filters, or share the event link.
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
                        {[a.role, a.industry].filter(Boolean).join(" · ") || "—"}
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
                    <p className="mt-4 text-xs text-muted-foreground">No shared tags yet.</p>
                  )}

                  {a.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {a.tags
                        .filter((t) => !a.overlap.includes(t))
                        .slice(0, 4)
                        .map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                    </div>
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
