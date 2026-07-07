
-- 1. is_admin flag on accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 2. Admin-read policy on organizer_waitlist
CREATE POLICY "Admins can view waitlist"
ON public.organizer_waitlist
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = auth.uid() AND a.is_admin = true
  )
);

-- 3. Real connections metric
CREATE OR REPLACE FUNCTION public.get_event_connection_count(_event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::int FROM (
    SELECT DISTINCT
      LEAST(m1.sender_membership_id, m1.recipient_membership_id) AS a,
      GREATEST(m1.sender_membership_id, m1.recipient_membership_id) AS b
    FROM public.messages m1
    JOIN public.messages m2
      ON m2.event_id = m1.event_id
     AND m2.sender_membership_id = m1.recipient_membership_id
     AND m2.recipient_membership_id = m1.sender_membership_id
    WHERE m1.event_id = _event_id
      AND (
        EXISTS (SELECT 1 FROM public.events e WHERE e.id = _event_id AND e.organizer_account_id = auth.uid())
        OR public.is_event_member(_event_id)
      )
  ) pairs;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_connection_count(uuid) TO authenticated;
