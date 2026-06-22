import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { TabaLogo } from "@/components/taba-logo";
import { toast } from "sonner";
import { friendlyError } from "@/lib/supabase-errors";
import { RouteErrorFallback } from "@/components/route-fallbacks";

export const Route = createFileRoute("/_authenticated/event/new")({
  head: () => ({ meta: [{ title: "Create event — Taba" }] }),
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback
      error={error}
      reset={reset}
      title="We couldn't open the create-event form"
    />
  ),
  component: CreateEventPage,
});


const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  date_start: z.string().optional().nullable(),
  date_end: z.string().optional().nullable(),
});

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleFile(file: File | null) {
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Use a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be smaller than 3MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const parsed = schema.safeParse({
        name,
        date_start: dateStart || null,
        date_end: dateEnd || null,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Check your inputs.");
      }
      if (parsed.data.date_start && parsed.data.date_end && parsed.data.date_end < parsed.data.date_start) {
        throw new Error("End date can't be before start date.");
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const userId = userData.user.id;

      const { data: ev, error: evErr } = await supabase
        .from("events")
        .insert({
          name: parsed.data.name,
          date_start: parsed.data.date_start,
          date_end: parsed.data.date_end,
          event_code: randomCode(),
          organizer_account_id: userId,
        })
        .select("id")
        .single();
      if (evErr) throw evErr;

      // Upload cover image if provided.
      if (imageFile) {
        const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/${ev.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("event-images")
          .upload(path, imageFile, { contentType: imageFile.type, upsert: false });
        if (upErr) {
          // Tag the error so the catch below can show an image-specific message.
          (upErr as { __source?: string }).__source = "image-upload";
          throw upErr;
        }
        const { data: signed, error: signErr } = await supabase.storage
          .from("event-images")
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
        if (signErr) {
          (signErr as { __source?: string }).__source = "image-upload";
          throw signErr;
        }
        await supabase.from("events").update({ image_url: signed.signedUrl }).eq("id", ev.id);
      }

      // Organizer is also a member so dashboard/share screens work.
      const { error: memErr } = await supabase
        .from("event_memberships")
        .insert({ event_id: ev.id, account_id: userId, goal_tags: [] });
      if (memErr) throw memErr;

      toast.success("Event created");
      navigate({ to: "/event/$eventId/share", params: { eventId: ev.id } });
    } catch (err) {
      const fromUpload = (err as { __source?: string } | null)?.__source === "image-upload";
      const fallback = fromUpload
        ? "Image upload failed — try a smaller file or a different image."
        : "Could not create event. Try again.";
      toast.error(friendlyError(err, fallback));
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link to="/organizer"><TabaLogo height={44} /></Link>
          <Link to="/organizer" className="text-sm text-muted-foreground hover:text-foreground">Cancel</Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Create your event</h1>
        <p className="mt-1 text-sm text-muted-foreground">Add the basics — you'll get a link and QR to share with attendees.</p>
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

          <Field label="Event image (optional)">
            <div className="space-y-3">
              {imagePreview && (
                <div className="overflow-hidden rounded-md border border-border">
                  <img src={imagePreview} alt="Event cover preview" className="h-48 w-full object-cover" />
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-accent"
              />
              <p className="text-xs text-muted-foreground">JPG, PNG, or WEBP. Max 3MB.</p>
            </div>
          </Field>

          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="mt-4 w-full rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Generate event link →"}
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
