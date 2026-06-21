# Taba — Project Context & Technical Plan

## What I understand

**Product.** Taba helps event attendees leave with 2–3 real connections instead of a stack of unused LinkedIn adds. Differentiation = depth over volume, attendee-controlled filtering, not algorithmic lead-gen. Brand thesis: "build your own village" — small, chosen, belonging-based.

**Personas.**
- **Tabitha (attendee, primary):** PMM, low-urgency career growth, dislikes initiating. Needs a clear, low-risk reason to spend her one approach on a specific person.
- **Nala (organizer, secondary, buyer):** runs a ~200-person cohort twice a year. Needs fast setup and basic proof connections happened (4 counts).

**In scope (hackathon, ~15h).**
- Attendee flow: join via code/link → build profile (persistent + event-specific) → filter/browse → match rationale → in-app message.
- Organizer flow (minimal): create event (generates code) → share access → results view with 4 counts.
- Marketing site: hero, village/Taba story, blurred pricing + waitlist, single "log in as attendee" CTA. **No organizer signup on the public site.**

**Explicitly out of scope (will not build or propose):** live "open to connect" toggling/AI inference, post-event follow-up tooling beyond messaging, approach-anxiety features, organizer analytics beyond the 4 counts, real payments, multi-event handling per attendee.

**Design.** Warm cream `#FAF6F0` base (never white), clay `#C97B4A` primary, cobalt `#3D63C9` accent, ink `#211C18` text. Moss green reserved **only** for "open to connect" status. Bauhaus-modern: geometric, flat, no gradients/shadows. Two distinct motifs — scattered-dots-with-three-connected (logo/brand only) and two overlapping circles, one outline + one filled (in-product, on attendee cards and match screens). Display: Poppins-style geometric. Body: Inter-style humanist.

## Technical plan

### Data model (already in place ✓)
The four-table schema from the previous step is the spine. Recap of intent:

```text
accounts ──< event_memberships >── events
                  │   │
                  │   └─< messages.recipient_membership_id
                  └─────< messages.sender_membership_id
```

- `accounts` = persistent identity (name, role, industry, languages, linkedin).
- `event_memberships` = the "this person, at this event" layer. **All event-specific stuff lives here**: `goal_tags`, `looking_for`, `give_back`, `open_to_connect`. This is what filtering/browsing reads from.
- `events` = one row per event, with the shareable `event_code`.
- `messages` = scoped by `event_id` + both membership ids, so DMs live inside an event context, not globally between accounts.

One small addition I'd propose **later, only when we wire the organizer flow**: an `events.organizer_account_id` (nullable) so the 4-count results view can be scoped to Nala's events. Not adding it now — flagging so you know it's coming.

### Auth approach (the important decision)

Two very different surfaces, handled differently:

**Attendees (Tabitha)** — Lovable Cloud email + password, plus Google sign-in (one tap is the whole point for low-friction event arrival). On first login, if the account has no `event_membership` for the active event code, we route them through "join event → build event profile." Account fields persist; the event-membership row is created fresh per event. No magic links for the hackathon — slower to demo, more failure modes.

**Organizers (Nala)** — same auth system, no separate role table needed for the hackathon. The distinction is purely "did this account create any events?" Whoever creates the event is its organizer (via the `organizer_account_id` we'll add). This avoids building an RBAC layer we won't have time to test. Organizers reach their dashboard through a direct URL (e.g. `/organizer`) — **not linked from the public marketing site**, per your scope.

**Marketing site visitors** — no auth. The single CTA goes to attendee login.

### RLS posture

Tables are currently RLS-enabled with no policies (locked). Once auth lands, policies (rough shape, for plan only):
- `accounts`: a user can read/write only their own row.
- `events`: anyone authenticated can read by `event_code` (needed to join); only the organizer can update/delete.
- `event_memberships`: a member can read all memberships for events they belong to (that's how browsing works), but only write their own row.
- `messages`: a member can read messages where they are sender or recipient, and insert only as themselves.

I'll write these alongside the auth wiring, not before.

### Page / route structure (TanStack Start, file-based)

Public marketing (no auth):
- `/` — hero, village story, blurred pricing + waitlist, "Log in as attendee" CTA.

Attendee app (under `_authenticated/`):
- `/join` — enter event code (or arrive via `/join?code=TF26`).
- `/profile/setup` — first-time account + event-membership profile builder.
- `/event` — browse + filter attendees (the main screen).
- `/event/attendee/$membershipId` — match rationale screen with the two-overlapping-circles motif.
- `/messages` and `/messages/$threadId` — in-app DM.

Organizer (under `_authenticated/`, direct URL only):
- `/organizer` — list of events + "create event" action.
- `/organizer/event/$id` — share link + 4-count results view.

Auth:
- `/auth` — managed by the integration; same screen for attendees and organizers.

### Build sequencing (rough order for the remaining ~15h)

1. Enable auth (email/password + Google), wire `_authenticated` gate, add `organizer_account_id` to `events`, write RLS policies.
2. Design tokens in `styles.css` (clay, cobalt, ink, cream, moss-as-status-only), Poppins + Inter, the two motifs as reusable SVG components.
3. Marketing `/` page.
4. Attendee flow end-to-end: join → profile setup → browse/filter → match page → message.
5. Organizer flow: create event + results view.
6. Polish + demo seed data.

### What I'm NOT doing

No realtime open-to-connect, no AI matching, no follow-up tooling, no payment integration, no organizer analytics beyond the 4 counts, no multi-event switching per attendee, no separate roles table, no magic links.

## What I need from you to start building

1. **Confirm the auth approach** (email/password + Google, single auth system for both personas, organizer = whoever creates an event).
2. **OK to add `organizer_account_id` to `events`** when we wire the organizer flow (won't touch the schema until then).
3. Anything in the page list above you'd cut or rename before we start.

Once you confirm, I'll start with step 1 (auth + RLS policies).
