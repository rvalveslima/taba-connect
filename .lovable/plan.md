## Organizer flow (demo)

### 1. Entry point — "Join as organizer"
Replace the waitlist dialog wiring on the marketing page with a navigation to `/auth?as=organizer`. The nav, hero, and final CTA buttons all switch from `openWaitlist(...)` to a `<Link>`/`navigate` to that route. (The `WaitlistDialog` component stays in the codebase but is no longer mounted on the landing page.)

### 2. Auth page — organizer mode
Extend `src/routes/auth.tsx` to read `?as=organizer` from search params:
- Show a small banner: *"Demo access — use password `Tabaevent123`"*.
- Pre-fill the password field with `Tabaevent123`.
- On submit: try `signInWithPassword` first; if it fails with "Invalid login credentials", automatically `signUp` with the same email + password (no email confirmation required since the existing flow already handles a missing session). This makes any email work with the shared demo password.
- After success, redirect to `/event/new` instead of `/app`.

Non-organizer auth keeps current behavior (redirect to `/app`).

### 3. Create event page — add image
Update `src/routes/_authenticated/event.new.tsx`:
- Add an optional image upload field (file input, preview, max ~3MB, jpg/png/webp).
- Upload to a new public storage bucket `event-images` at path `${userId}/${eventId}-${timestamp}.{ext}`, save the public URL to `events.image_url`.
- Keep name + dates; hide the event code field (auto-generate silently — organizer doesn't need to see it for the demo).
- On success, redirect to a new share page `/event/$eventId/share` instead of the profile page.

### 4. Share page — link + QR
New route `src/routes/_authenticated/event.$eventId.share.tsx`:
- Header with event name, dates, and the cover image if uploaded.
- Reuse the existing `SharePanel` component (QR + copy link + event code).
- A "Done" / "Back to my events" link to `/app`.

### 5. Backend changes

**Migration** (`supabase--migration`):
- `ALTER TABLE public.events ADD COLUMN image_url text;`

**Storage bucket** (`supabase--storage_create_bucket`):
- `name: event-images`, `public: true`.
- RLS on `storage.objects`: anyone can `SELECT` from `event-images`; authenticated users can `INSERT`/`UPDATE`/`DELETE` objects where the first path segment equals their `auth.uid()`.

### Out of scope
- No new attendee-side changes — the existing join flow already handles the link/QR/code.
- Pricing-teaser waitlist form on the landing page stays as-is (it's separate from the organizer CTA).

### Files touched
- `src/routes/index.tsx` — swap CTA actions to navigate to `/auth?as=organizer`.
- `src/routes/auth.tsx` — organizer mode banner, prefilled password, sign-in-or-sign-up, conditional redirect.
- `src/routes/_authenticated/event.new.tsx` — image upload + redirect to share page, hide event code.
- `src/routes/_authenticated/event.$eventId.share.tsx` — new file.
- One migration + one storage bucket + storage RLS policies.