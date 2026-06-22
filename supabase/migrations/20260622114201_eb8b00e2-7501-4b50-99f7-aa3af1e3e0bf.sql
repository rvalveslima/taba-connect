
-- 1. Lock down event_code from authenticated as well (already revoked from anon)
REVOKE SELECT (event_code) ON public.events FROM authenticated;

-- 2. Replace permissive SELECT policies on events with membership-scoped policy
DROP POLICY IF EXISTS events_select_anon ON public.events;
DROP POLICY IF EXISTS events_select_authenticated ON public.events;

CREATE POLICY events_select_member_or_organizer
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    organizer_account_id = auth.uid()
    OR public.is_event_member(id)
  );

-- 3. Public-info RPC for the join/share preview (safe columns only, no event_code)
CREATE OR REPLACE FUNCTION public.get_event_public_info(_event_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  date_start date,
  date_end date,
  image_url text,
  organizer_account_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.name, e.date_start, e.date_end, e.image_url, e.organizer_account_id
  FROM public.events e
  WHERE e.id = _event_id;
$$;

REVOKE ALL ON FUNCTION public.get_event_public_info(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_public_info(uuid) TO anon, authenticated;

-- 4. Tighten SECURITY DEFINER lookup functions: authenticated only
REVOKE ALL ON FUNCTION public.get_event_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_event_code(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.find_event_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_event_by_code(text) TO authenticated;
