
CREATE OR REPLACE FUNCTION public.get_my_event_connections(_event_id uuid)
RETURNS TABLE(counterpart_membership_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH me AS (
    SELECT id
    FROM public.event_memberships
    WHERE event_id = _event_id AND account_id = auth.uid()
    LIMIT 1
  )
  SELECT DISTINCT m1.recipient_membership_id AS counterpart_membership_id
  FROM public.messages m1
  JOIN public.messages m2
    ON m2.event_id = m1.event_id
   AND m2.sender_membership_id = m1.recipient_membership_id
   AND m2.recipient_membership_id = m1.sender_membership_id
  WHERE m1.event_id = _event_id
    AND m1.sender_membership_id = (SELECT id FROM me);
$$;

GRANT EXECUTE ON FUNCTION public.get_my_event_connections(uuid) TO authenticated;
