## Goal
Run a multi-layered audit of the project to surface bugs, broken flows, security issues, and unclear error messages — then triage the findings with you before fixing anything.

## What I'll run

### 1. Automated scans (parallel, read-only)
- **Security scan** (`security--run_security_scan`) — RLS gaps, exposed columns, missing policies on public tables.
- **Database linter** (`supabase--linter`) — config issues, permissive policies, unindexed FKs.
- **TypeScript/build check** — review the current build output for type errors and unresolved imports.
- **Dependency scan** — high/critical vulnerabilities in npm packages.
- **Runtime + console logs review** — recent client errors and warnings from the preview.
- **Auth logs review** — recent failed sign-ins or auth errors via analytics query.

### 2. End-to-end flow walkthrough (Playwright, headless)
Drive the live preview and screenshot each step so we can see exactly where things break or where copy is confusing:
- Landing → organizer demo sign-in → create event → share screen → sign out
- Landing → `/auth` → attendee demo sign-in → join flow → profile setup (try invalid + valid saves to verify the new error copy) → event home
- Magic-link path on `/auth` (request only, no inbox check)
- Sign-out destinations for both roles

### 3. Static code review pass
Focused read of the highest-risk surfaces for unclear errors / broken flows:
- All `toast.error(...)` and `throw new Error(...)` call sites — flag any generic "Something went wrong" style messages.
- All route loaders for missing `errorComponent` / `notFoundComponent`.
- Server functions / route guards for unauthenticated edge cases.

## Deliverable
A single triaged report grouped by severity (Blocker / Bug / Confusing UX / Nit) with:
- What I observed (with screenshot or log reference)
- Where it lives (file:line)
- Suggested fix

**No code changes in this pass** — once you see the report, you pick what to fix and I'll do it in follow-up turns.

## Out of scope
- SEO scan (separate flow, ask if you want it too).
- Visual/design redesign.
- Performance profiling.
