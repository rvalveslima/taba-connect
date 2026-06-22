## Yes — Lovable Cloud handles this end-to-end

Lovable Email is built into Lovable Cloud (which this project already uses). No third-party service, no API keys, no extra billing setup. You'll use **`notify.taba-connecting.com`** as the sender subdomain — your main site at `taba-connecting.com` stays untouched.

## Steps I'll run

1. **Open the email setup dialog** — you enter `notify.taba-connecting.com`. Lovable gives you 2 NS records to paste at your DNS provider (wherever `taba-connecting.com` is registered). Lovable then auto-manages SPF/DKIM/MX inside that subdomain.
2. **Set up email infrastructure** — creates the send queue, retry logic, suppression list, and cron job that processes outgoing emails.
3. **Scaffold branded auth email templates** — generates the 6 auth templates (magic link, signup confirmation, password reset, invite, email change, reauthentication), styled with Taba's logo and brand colors from `styles.css`.
4. **You add the NS records** at your registrar. DNS usually verifies in minutes (can take up to 72h).
5. Once verified, magic links from `/auth` and `/join/:eventId` arrive reliably from `notify.taba-connecting.com`.

## While DNS verifies

- Check Gmail **Spam** / **Promotions** for any pending magic link
- Or test the organizer path: `/auth?as=organizer` (email + password `Tabaevent123`)

## Out of scope

- No changes to `/auth`, `/join`, or any sign-in UI — the magic-link code is correct.
- No app emails (transactional) yet — only auth emails. We can add app emails later if you want booking confirmations, etc.
- No DB/RLS changes.

## What I need from you

Confirm you have access to the DNS settings for `taba-connecting.com` (at whatever registrar you bought it from — Namecheap, GoDaddy, Cloudflare, etc.) so you can paste the 2 NS records once Lovable shows them.
