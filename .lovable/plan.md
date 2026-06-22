
# Fix the event_code leak (Option A — quick lock-down)

Demo sign-in is **not** the cause and stays exactly as-is. The leak comes from `events.events_select_authenticated USING (true)` + `events.events_select_anon USING (true)`, which let any signed-in (or anonymous) user `SELECT event_code` from every row.

Goal: `event_code` is readable **only** by an event's organizer and existing members. Everything else about an event (name, dates, image) stays publicly readable so the `/join/:eventId` share page keeps working.

## Where event_code is read today

| File | Purpose | Allowed after fix? |
|---|---|---|
| `routes/_authenticated/organizer.tsx` | Organizer dashboard lists their own events with the code | ✅ organizer is owner |
| `routes/_authenticated/event.$eventId.share.tsx` | Organizer share screen shows the code | ✅ organizer is owner |
| `routes/_authenticated/event.$eventId.index.tsx` | Event home shows the code to members | ✅ caller is a member |
| `routes/_authenticated/app.tsx` (`handleJoinByCode`) | Logged-in user types a code to find the event | ✅ via RPC below |
| `routes/join.$eventId.tsx` (loader) | Public join page reads name/image/dates by id | ✅ doesn't touch `event_code` |

## Database changes (single migration)

1. **Revoke column-level read on `event_code`** from `anon` and `authenticated`:
   ```sql
   REVOKE SELECT (event_code) ON public.events FROM anon, authenticated;
   ```
   Other columns (`id, name, date_start, date_end, image_url, organizer_account_id, created_at`) stay readable under the existing row policies, so the public join page and the in-app dashboards keep working.

2. **`get_event_code(_event_id uuid) returns text`** — `SECURITY DEFINER`, returns the code only if `auth.uid()` is the organizer or a member; otherwise returns `null`.
   - Used by: `organizer.tsx` (map over event ids), `event.$eventId.share.tsx`, `event.$eventId.index.tsx`.

3. **`find_event_by_code(_code text) returns uuid`** — `SECURITY DEFINER`, normalizes input (trim + upper), looks up the event id, returns it (or `null`). No column read needed by the client.
   - Used by: `app.tsx` `handleJoinByCode`.

4. Grant `EXECUTE` on both functions to `authenticated`. `find_event_by_code` is auth-only (matches today's behavior — the join-by-code form is on the authenticated `/app` route).

## Frontend changes

- `routes/_authenticated/organizer.tsx` — drop `event_code` from the `select(...)`, then for each event call `supabase.rpc("get_event_code", { _event_id: ev.id })` (or one batched call if we add a plural variant later). Show the code as before.
- `routes/_authenticated/event.$eventId.share.tsx` — same pattern: select without `event_code`, then `rpc("get_event_code", ...)` for the share panel.
- `routes/_authenticated/event.$eventId.index.tsx` — same: separate RPC call for the code shown to members.
- `routes/_authenticated/app.tsx` `handleJoinByCode` — replace the `from("events").select("id").eq("event_code", trimmed)` query with `supabase.rpc("find_event_by_code", { _code: trimmed })`. Toast copy: "No event found for code '<CODE>'." unchanged on `null`.
- `routes/join.$eventId.tsx` — no change (already doesn't read `event_code`).

## Verification

- Sign in as **demo attendee** → confirm join-by-code still works → confirm `supabase.from('events').select('event_code')` returns rows with `event_code: null` (column revoked).
- Sign in as **demo organizer** → confirm dashboard and share screen still display the code.
- Public `/join/:eventId` page loads name + image without auth.
- Add a quick psql check: `SELECT has_column_privilege('authenticated', 'public.events', 'event_code', 'SELECT')` → `false`.

## Out of scope

- Demo mode (kept exactly as-is).
- The other audit items (#2–#10): handled in follow-up turns.
- Locking `events_select_authenticated` row-policy to "members only" — keeping the broad row read is what lets the public join page and code-lookup keep their current UX without a bigger refactor.
