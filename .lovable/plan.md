## Problem

Clicking "Say hello on LinkedIn" inside the Lovable preview shows `www.linkedin.com refused to connect — ERR_BLOCKED_BY_RESPONSE`. Cause: the current handler uses `window.open(url, "_blank")`, which in a sandboxed preview iframe falls back to navigating the iframe itself. LinkedIn sends `X-Frame-Options: DENY`, so it refuses to render.

## Fix

Replace the `<button onClick={handleConnect}>` CTA with a real `<a href target="_blank" rel="noopener noreferrer">` styled the same way. Browsers route anchor clicks with `target="_blank"` to a new tab even from sandboxed iframes, bypassing the popup fallback.

### Behavior

1. CTA renders as an anchor when `linkedin_handle` is present:
   - `href = https://www.linkedin.com/in/{normalizedHandle}/`
   - `target = "_blank"`, `rel = "noopener noreferrer"`
   - `onClick` (does NOT call `preventDefault`) copies the suggested message to the clipboard and fires the existing "Message copied — paste in LinkedIn" toast. The navigation proceeds in parallel in a new tab.
2. On mobile, the same `linkedin.com/in/...` URL is intercepted by the installed LinkedIn app automatically — no extra deep-link scheme needed.
3. If `linkedin_handle` is missing, keep the current fallback: render as a `<button>` labeled "Copy message" that only copies to clipboard.

### Files

- `src/routes/_authenticated/event.$eventId.attendee.$membershipId.tsx` — swap the CTA element; keep clipboard + toast logic in the `onClick`. No other files change.

### Out of scope

- No new server functions, no LinkedIn API/connector (that's for publishing posts or reading the signed-in user's profile, not for opening someone else's public profile).
- No profile/onboarding changes — `linkedin_handle` is already collected and normalized.
- No analytics/click tracking.

### Verification

- In the preview, click the CTA on Alex T.'s card → new browser tab opens at `linkedin.com/in/alex-thompson`, toast says "Message copied".
- On a card with no LinkedIn handle, CTA reads "Copy message" and only copies.
