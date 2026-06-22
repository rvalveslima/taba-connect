## Plan — bigger animated logo + scroll motion on the homepage

Scoped to the homepage (`src/routes/index.tsx`) and the logo component (`src/components/taba-logo.tsx`). No new dependencies, no changes to other routes, no backend/data changes — so nothing else can break.

## How I'll keep this safe

- **No new libraries.** Pure CSS keyframes + a tiny `useInView` hook using the browser's `IntersectionObserver`. Framer Motion is unnecessary for what you're asking and adds bundle weight.
- **Logo component stays backward-compatible.** The animation is opt-in via a new prop (`animateConnect?: boolean`, default `false`). Every other place the logo is used today (nav, `/auth`, `/join`) renders exactly as it does now.
- **Scroll animations degrade gracefully.** If an element isn't observed yet, it starts in its final visible state — so even if JS fails or the observer doesn't fire, content is still readable. Also honors `prefers-reduced-motion` → animations are skipped for users who've opted out.

## Change 1 — Logo

### `src/components/taba-logo.tsx`
- Add prop `animateConnect?: boolean` (default false).
- When true, on mount:
  - The 3 triad dots fade/scale-in first (~250ms each, staggered).
  - The 3 connecting lines then "draw in" using `stroke-dasharray` / `stroke-dashoffset` animation (~600ms total).
  - The 6 ambient dots fade in last at low opacity (~400ms).
- Total intro ≈ 1.3s, then settles into the static design.
- Animation runs once per page load — no repeat on re-render.
- Add a tiny continuous "breathing" pulse on the center bottom dot (~3s loop, very subtle) so the logo feels alive after the intro.

### `src/routes/index.tsx` — Hero
- Render a large `<TabaLogo height={120} animateConnect />` above the eyebrow ("For event organizers") at the top of the hero column. On mobile, scale down to ~80px.
- Nav logo stays at its current 32px height (no animation there — only the hero one plays the intro, to avoid double-playing).

## Change 2 — Scroll-triggered motion

### New file: `src/hooks/use-in-view.ts`
~25 lines. `useInView(ref, { rootMargin, once })` returns a boolean. Uses `IntersectionObserver`. If the observer API isn't available (or `prefers-reduced-motion` is set), returns `true` immediately so content shows.

### New file: `src/components/marketing/reveal.tsx`
Tiny wrapper `<Reveal variant="fade-up" | "fade" | "scale-in" | "slide-left" | "slide-right" delay={n}>`. Applies a class that triggers the matching CSS keyframe when the element enters the viewport. Replaces nothing — it just wraps.

### CSS keyframes (added once to `src/styles.css`)
- `reveal-fade-up` (translateY 24px → 0, opacity 0 → 1, 700ms ease-out)
- `reveal-scale-in` (scale 0.85 → 1, opacity 0 → 1, 800ms)
- `reveal-slide-left` / `reveal-slide-right` (translateX ±40px → 0, 800ms)
- `float-slow` (translateY ±8px loop, 6s) — for ambient geometric shapes
- `drift-slow` (translateX/Y small loop, 8s, different phase) — for the big circles
- `spin-very-slow` (360° in 60s, linear) — applied subtly to one CobaltTriangle
- All wrapped in `@media (prefers-reduced-motion: reduce) { ... animation: none }`.

### Where motion goes in `index.tsx`
- **Hero geometric shapes** (`ClayCircle`, `CobaltTriangle`, `InkSquare`): add `float-slow` / `drift-slow` / `spin-very-slow` continuous loops. These are decorative — already `pointer-events-none`. Looped from page load.
- **Section reveals**: wrap each section's headline + body in `<Reveal variant="fade-up">`; geometric shapes in each section get `<Reveal variant="scale-in" delay={200}>`.
- **VillageStory big circles**: add `drift-slow` loops; the OverlapCircles diagram gets `scale-in` on enter.
- **HowItWorks cards**: stagger reveal — card 1 delay 0ms, card 2 delay 120ms, card 3 delay 240ms (fade-up).
- **PricingTeaser card**: fade-up on enter.
- **FinalCTA**: fade-up headline, scale-in button.

## Out of scope
- No changes to copy or layout structure.
- No changes outside the homepage and the logo component.
- No design-system token changes (colors stay identical).
- No changes to the waitlist form behavior.

## Risk summary
- Logo: new prop is opt-in; existing 4 usages untouched → no regression risk.
- Scroll motion: if the observer ever misbehaves, content defaults to visible. Reduced-motion users get a static page.
- Bundle size impact: ~1.5 KB (one hook + one wrapper + CSS).

Ready to build when you approve.
