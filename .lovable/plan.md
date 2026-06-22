## Goal
Fix the confusing save error on the attendee profile setup screen (`/event/$eventId/profile`) and make every field required except LinkedIn.

## Changes

### 1. `src/lib/profile-validation.ts` — tighten schema
Make these required (non-empty after trim) for attendees:
- `name` (already required)
- `role` — required, max 120
- `company` — required, max 120
- `location` — required, max 120
- `languages` — min 1
- `goal_tags` — min 3 (matches the existing "Pick 3+ for better matches" hint, promoted from suggestion to requirement)
- `looking_for` — required, max 500
- `give_back` — required, max 500
- `linkedin_handle` — stays optional/nullable

Each field gets a clear, human message (e.g. "Add your role", "Pick at least 3 goals", "Tell people what you're looking for").

### 2. `src/routes/_authenticated/event.$eventId.profile.tsx` — friendlier error UX
Replace the single generic toast with field-aware feedback on save:
- Run validation, collect issues, show the FIRST issue as a toast with the exact field label (e.g. "Add your company before continuing").
- Scroll to / focus the first invalid field so the user sees what's missing.
- Keep the existing LinkedIn normalize logic (still optional — empty input passes).
- Organizer flow is unaffected (this route only renders for attendees with a membership; organizers are redirected to `/event/$eventId/share` earlier in the loader).

### 3. Out of scope
- No DB/schema changes (columns stay nullable; enforcement is client-side validation only, matching the rest of the file).
- No changes to sign-out, auth, or the share screen.
- No visual redesign of the profile form — only the error messaging and required-field rules.

## Acceptance
- Attendee clicks "Find people" with empty fields → sees a clear toast naming the missing field, not a generic error.
- LinkedIn left blank → save succeeds (assuming all other fields filled).
- Any other field blank → save blocked with a specific message.
