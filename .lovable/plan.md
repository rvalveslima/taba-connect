## Fix the join link so it always lands attendees on sign-in

### 1. `src/routes/join.$eventId.tsx`
- Loader: also select `organizer_account_id` from `events`.
- On mount, capture the current user's id + email via `supabase.auth.getUser()`.
- Compute `isOrganizer = sessionUserId === event.organizer_account_id`.
- Render three states in the right-hand panel:
  - **Organizer (own link):** banner "You're the organizer of this event. Attendees join with their own account." with two buttons: **Sign out & join as attendee** (calls `supabase.auth.signOut()` then refreshes session state so the New/Existing tabs appear) and **Back to your events** (→ `/organizer`). No "Join the event" button.
  - **Signed in as a non-organizer:** keep today's one-click "Join the event" flow, plus a small "Use a different account" link that signs out and shows the auth tabs.
  - **Signed out:** unchanged — "New to Taba" / "I have an account" tabs (default = New, matches the screenshot).

### 2. Incognito → Lovable auth prompt
This happens because the project is not published; `id-preview--…lovable.app` always requires a Lovable login. We'll fix the join flow first; publishing is the last step you mentioned.

### Out of scope
No DB changes, no edits to organizer/share/profile/dashboard, no publish yet.

### Verification
- Organizer opens their own `/join/<id>` → banner, no auto-join.
- Click "Sign out & join as attendee" → sign-up tabs appear; create new email → profile → dashboard.
- Different signed-in user → one-click join still works.
- Logged out → screenshot's sign-up screen.