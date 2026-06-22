## Plan — Option B + emphasize Google

Keep Lovable's default sender for magic links (no domain setup), reorder the attendee `/auth` and `/join/:eventId` UI so **Google is the primary call-to-action**, and add a small "check spam/promotions" note after a magic link is sent.

## Changes

### 1. `src/routes/auth.tsx` (attendee branch only — organizer branch untouched)
- Make **Continue with Google** the primary button: full-width, primary color (currently it's a secondary outline button).
- Move the `or` divider + email field + "Email me a magic link" below Google, styled as the secondary path (outline button, smaller emphasis).
- Add subtitle copy under the header: "Google is the fastest way in."
- In the "Check your inbox" success panel after submitting the magic link, add a muted note:
  > Can't find it? Check your **Spam** or **Promotions** folder. The email comes from a generic Lovable address.

### 2. `src/routes/join.$eventId.tsx`
- Same reorder: Google primary button on top, magic-link form below as the secondary option.
- Same "check spam/promotions" note in the post-submit confirmation panel.

### 3. No other changes
- Organizer flow (`/auth?as=organizer`) stays exactly as-is (email + password).
- No domain/email-infrastructure setup.
- No DB, RLS, route, or backend changes.
- No copy changes to marketing site or `/app`.

## Out of scope

- Setting up `notify.taba-connecting.com` (deferred until you have a domain).
- Branded email templates (requires custom domain first).
- Removing the magic-link option entirely (keeping it as a fallback for users without Google).
