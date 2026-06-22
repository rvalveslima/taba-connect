## Goal

Add a "Questions or feedback?" form to the bottom of the organizer dashboard (`src/routes/_authenticated/organizer.tsx`), below the events list. Only signed-in organizers see it.

## UI (matches your screenshot)

A collapsible card sitting under the events list, expanded by default:

- Header row: chat-bubble icon + "Questions or feedback?" title + chevron toggle
- `Subject (optional)` — single-line input, max 120 chars
- `Write your message here…` — textarea, required, 1–2000 chars
- Peach `Send message` button with paper-plane icon, disabled while submitting
- On success: collapse the form and show an inline "Thanks — we read every message." confirmation; toast on failure
- Styled with the dashboard's existing tokens (cream card, peach primary) so it fits the page

Validation with zod (trim + length limits), errors shown inline.

## Backend (Lovable Cloud)

New table `public.feedback_messages`:
- `subject` (text, nullable)
- `message` (text, required)
- `account_id` (uuid, references the signed-in organizer)
- `user_agent` (text, nullable) — for spam triage
- standard `id`, `created_at`

Access rules (plain English):
- Only signed-in users can submit a message, and the row is always recorded against their own account.
- Nobody can read, edit, or delete messages from the app — you'll view them in the backend table.
- Length limits (subject ≤120, message 1–2000) enforced at the database level so the rules can't be bypassed from the client.

Submission path: a `createServerFn` (`src/lib/feedback.functions.ts`) protected by `requireSupabaseAuth`. It re-validates with zod and inserts the row using the user-scoped Supabase client, so RLS applies. No edge function needed.

The email isn't asked in the form — we already know who sent it via `account_id`, and you can join to `accounts` / `auth.users` in the backend if you want to reply.

## Out of scope

- No admin UI to read messages (view them in the backend table).
- No email notification on submission (can add later via Brevo/Lovable Emails if you want).
- Homepage and attendee views are unchanged.

## Files

- new: `src/lib/feedback.functions.ts` — server function for submission
- new: `src/components/organizer/feedback-card.tsx` — the collapsible form
- edited: `src/routes/_authenticated/organizer.tsx` — render the card below the events list
- new migration: `feedback_messages` table + GRANTs + RLS policy + length checks
