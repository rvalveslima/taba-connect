import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { TabaLogo } from "@/components/taba-logo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/event/new")({
  head: () => ({ meta: [{ title: "Create event — Taba" }] }),
  component: CreateEventPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  date_start: z.string().optional().nullable(),
  date_end: z.string().optional().nullable(),
  event_code: z
    .string()
    .trim()
    .max(20)
    .regex(/^[A-Za-z0-9-]*$/, "Letters, numbers, and dashes only"),
});

function randomCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function CreateEventPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [code, setCode] = useState(randomCode());
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const parsed = schema.safeParse({
        name,
        date_start: dateStart || null,
        date_end: dateEnd || null,
        event_code: code,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Check your inputs.");
      }
      if (parsed.data.date_start && parsed.data.date_end && parsed.data.date_end < parsed.data.date_start) {
        throw new Error("End date can't be before start date.");
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");

      const { data: ev, error: evErr } = await supabase
        .from("events")
        .insert({
          name: parsed.data.name,
          date_start: parsed.data.date_start,
          date_end: parsed.data.date_end,
          event_code: parsed.data.event_code || randomCode(),
          organizer_account_id: userData.user.id,
        })
        .select("id")
        .single();
      if (evErr) throw evErr;

      // Organizer is also a member so dashboard/share screens work.
      const { error: memErr } = await supabase
        .from("event_memberships")
        .insert({ event_id: ev.id, account_id: userData.user.id, goal_tags: [] });
      if (memErr) throw memErr;

      toast.success("Event created");
      navigate({ to: "/event/$eventId/profile", params: { eventId: ev.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create event.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link to="/app"><TabaLogo height={28} /></Link>
          <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground">Cancel</Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Create an event</h1>
        <p className="mt-1 text-sm text-muted-foreground">You'll get a link and QR to share with attendees.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Field label="Event name">
            <input
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TechForward 2026"
              className="input"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Start date">
              <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="input" />
            </Field>
            <Field label="End date">
              <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="input" />
            </Field>
          </div>
          <Field label="Event code">
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={20}
                className="input flex-1 uppercase tracking-widest"
              />
              <button
                type="button"
                onClick={() => setCode(randomCode())}
                className="rounded-md border border-border bg-background px-3 text-xs hover:bg-accent"
              >
                Regenerate
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Short code attendees can type as a fallback.</p>
          </Field>

          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="mt-4 w-full rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create event →"}
          </button>
        </form>
        <style>{`
          .input { width: 100%; border-radius: 0.375rem; border: 1px solid var(--border); background: var(--background); padding: 0.5rem 0.75rem; font-size: 0.875rem; color: var(--foreground); }
          .input:focus { outline: 2px solid var(--ring); outline-offset: 1px; }
        `}</style>
      </main>
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
