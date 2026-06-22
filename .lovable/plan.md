## Add "Delete account" for attendees

Lets a signed-in attendee permanently delete their account from the app home (`/app`). Removes their auth user, which cascades to their `accounts` row, all `event_memberships`, `messages`, and `feedback_messages`.

### UX

In `src/routes/_authenticated/app.tsx`, next to the existing "Sign out" button in the header, add a subtle "Delete account" link (muted/destructive text, not a primary button).

Clicking opens an `AlertDialog` confirmation:
- Title: "Delete your account?"
- Body: "This permanently deletes your profile, all event memberships, and your messages. This can't be undone."
- Requires typing `DELETE` into an input to enable the destructive action (prevents accidental taps).
- Cancel / "Delete account" buttons.

On confirm: call a new server function, then sign out locally and navigate to `/` with a success toast.

### Backend

New server function `deleteMyAccount` in `src/lib/account.functions.ts`:
- Uses `.middleware([requireSupabaseAuth])` to identify the caller.
- Loads `supabaseAdmin` inside the handler (`await import("@/integrations/supabase/client.server")`).
- Calls `supabaseAdmin.auth.admin.deleteUser(context.userId)`.
- Returns `{ ok: true }`. FK cascade removes the rest.

No new migration needed — `accounts.id` already cascades from `auth.users`, and the existing membership/message tables cascade from `accounts` / `auth.users`.

### Files

- `src/lib/account.functions.ts` — new server function.
- `src/routes/_authenticated/app.tsx` — header button + AlertDialog + handler that calls the server fn, then `supabase.auth.signOut()` and `navigate({ to: "/" })`.

### Out of scope

- Organizer-only delete flow (organizers may own events with other attendees; needs separate product decision — flag if the user wants that next).
- 30-day soft-delete / undo window.
- Re-auth prompt (relies on the typed-`DELETE` confirmation instead).