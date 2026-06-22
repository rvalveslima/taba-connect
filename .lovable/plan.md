## Problem

You tried the magic link but no email arrived. It's not Gmail — your project has **no email sender domain configured**, so all auth emails (magic links, confirmations, password resets) are going through the default shared sender. That sender is:

- Heavily rate-limited (a handful of emails per hour for the whole project)
- Frequently filtered to spam or dropped by Gmail/Outlook
- Not brandable

This is why the magic link silently never showed up.

## Fix

Set up a proper email sender domain for the project, then scaffold branded auth email templates so magic-link, sign-up confirmation, and password-reset emails all send reliably from your own domain (e.g. `notify.yourdomain.com`).

### Steps

1. **Set up the email sender domain** — opens a dialog where you pick the subdomain (e.g. `notify.yourdomain.com`) and add the NS records at your DNS provider. Lovable handles SPF/DKIM/MX automatically once delegation is in place.
2. **Set up email infrastructure** — creates the send queue, retry/suppression tables, and the cron job that processes outgoing emails.
3. **Scaffold branded auth email templates** — generates the six auth email templates (magic link, signup confirmation, password reset, invite, email change, reauthentication) styled with Taba's branding (logo, primary color, fonts from `styles.css`). These replace the default plain-text emails.
4. **Verify** — once DNS verifies (can take up to ~72h, usually minutes), magic links from `/auth` and `/join/:eventId` will arrive in inboxes reliably.

### Meanwhile (workaround for testing)

Until the domain is verified, you can:
- Check your Gmail **Spam** and **Promotions** tabs for the magic link
- Wait a few minutes between retries (rate limit)
- Or temporarily test with the organizer email/password flow (`/auth?as=organizer`)

## Out of scope

- No changes to `/auth`, `/join`, or any sign-in UI — the magic-link code is already correct.
- No changes to RLS, DB schema, or app emails (only auth emails for now).
- We won't switch to a third-party provider like Resend/SendGrid unless you ask.

## What I need from you

The **root domain** you want to send from (e.g. `taba.app`, `mytaba.com`). Lovable will create a `notify.<your-domain>` subdomain for sending — your main site stays untouched. You'll need access to your DNS provider to paste 2 NS records.

If you don't own a domain yet, tell me and we'll plan that first.
