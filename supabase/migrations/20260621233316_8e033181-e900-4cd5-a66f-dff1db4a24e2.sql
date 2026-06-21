-- Restrict anon SELECT on events.event_code so anonymous visitors cannot enumerate join codes
REVOKE SELECT (event_code) ON public.events FROM anon;

-- Defense in depth: explicitly deny SELECT on organizer_waitlist for anon and authenticated
CREATE POLICY "waitlist_no_read_anon" ON public.organizer_waitlist
  AS RESTRICTIVE FOR SELECT TO anon USING (false);
CREATE POLICY "waitlist_no_read_authenticated" ON public.organizer_waitlist
  AS RESTRICTIVE FOR SELECT TO authenticated USING (false);