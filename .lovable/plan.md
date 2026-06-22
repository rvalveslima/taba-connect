## Plan — Export waitlist as CSV

One-off export. No code or DB changes.

1. Query `public.organizer_waitlist` for all rows (`email`, `source`, `created_at`), ordered by signup date.
2. Write the result to `/mnt/documents/waitlist.csv`.
3. Surface it as a downloadable artifact in the chat.

That's it — repeat the steps whenever you want a fresh export.
