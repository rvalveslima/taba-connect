# Taba organizer marketing landing page

Replace the current placeholder `src/routes/index.tsx` with a full marketing page. No changes to attendee flow (`join/$eventId`, `_authenticated/event.*`, profile, filter, decision) or to Nala's dashboard routes/schema.

## Scope guardrails

- Only edits `src/routes/index.tsx` and adds a few small presentational components/assets.
- No new auth, no organizer signup flow, no event creation.
- "Join as organizer" and the pricing callout both open the same lightweight **waitlist email capture** (modal/inline form).
- No "join as attendee" entry point on this page.

## Waitlist capture (backend)

Minimal, isolated from existing schema:

- New migration: `public.organizer_waitlist` (`id uuid pk`, `email citext unique not null`, `source text` (e.g. `hero`, `pricing`, `final`), `created_at timestamptz default now()`).
- GRANT `INSERT` to `anon` + `authenticated`; `ALL` to `service_role`. RLS on. Single policy: `INSERT` allowed for anyone, no SELECT/UPDATE/DELETE to public.
- Client inserts via the existing `supabase` browser client. On unique-violation, show "You're already on the list" success state.
- No email sending in this phase — just store. (Confirmation emails can come later.)

## Page structure (`src/routes/index.tsx`)

Sections, in order, each as a clearly demarcated block with Bauhaus grid composition:

1. **Hero** — top nav (Taba logo only, no attendee login link). Headline carrying the contacts-vs-connections tension. Subhead about leaving with 2–3 real connections. Primary CTA "Join as organizer" → opens waitlist modal. Background composition uses primary geometric shapes (clay circle, cobalt triangle, ink grid lines) on cream.
2. **The problem** — names the LinkedIn-wall and post-event drop-off directly. Two-column geometric layout, big type.
3. **The village story** (centerpiece, largest vertical real estate) — Tupi etymology, relational meaning of "village," bridge to "build your own village," tie to research finding (common ground + openness before approach). Uses the `OverlapCircles` motif here as the visual anchor.
4. **How it works** — 3 numbered steps from attendee POV (join event → see common ground → start real conversation). Strict 3-column geometric grid, minimal copy.
5. **Who it's for** — 2–3 lines positioning against algorithmic matching and ongoing community platforms.
6. **Pricing teaser** — "Pricing for organizers — join the waitlist to be first to know." Email capture inline, same backend as hero CTA (source = `pricing`).
7. **Final CTA** — short declarative restatement of the village thesis, repeat "Join as organizer" button (source = `final`).
8. **Footer** — minimal: logo, copyright, contact email placeholder.

## Visual system

- Reuse existing tokens in `src/styles.css` (clay/cobalt/ink/cream, Poppins, Inter). No new color tokens needed.
- Bauhaus-meets-nature: bold primary shapes (circle/triangle/square), thick rules, asymmetric grid, generous whitespace; warmed with subtle grain/noise texture overlay and slightly organic shape placement (not perfectly aligned). No rounded-soft SaaS cards. No gradients beyond palette.
- Use existing `OverlapCircles` component in the village section (do **not** conflate with the logo dots motif).
- New small presentational components colocated in `src/components/marketing/`: `Hero`, `ProblemSection`, `VillageStory`, `HowItWorks`, `WhoItsFor`, `PricingTeaser`, `FinalCTA`, `MarketingFooter`, `WaitlistDialog` (shared modal using existing shadcn `Dialog` + `Input` + `Button`).

## SEO / head

Update the route's `head()` with marketing-focused title, description, OG title/description (text only; skip og:image for now per leaf-image rule unless we generate a hero image — defer).

## Technical details

- Route file: `src/routes/index.tsx` — keep `createFileRoute("/")`, add `head()` and replace the component.
- Waitlist insert: client-side `supabase.from('organizer_waitlist').insert({ email, source })` with zod email validation; toast on success/error via existing `sonner`.
- Migration via Supabase tool with proper GRANT + RLS per public-schema rules.
- No changes to `src/routes/auth.tsx`, `_authenticated/*`, `join.$eventId.tsx`, or `reset-password.tsx`.

## Out of scope (explicit)

- Organizer signup, event creation, organizer dashboard.
- Real pricing tiers.
- Email confirmation / drip to waitlist subscribers.
- Any attendee-facing entry from this page.
