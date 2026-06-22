-- Revoke direct read access to events.event_code from all client roles
REVOKE SELECT (event_code) ON public.events FROM anon, authenticated;

-- Function: return the event_code only to the organizer or a member of the event
CREATE OR REPLACE FUNCTION public.get_event_code(_event_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.event_code
  FROM public.events e
  WHERE e.id = _event_id
    AND (
      e.organizer_account_id = auth.uid()
      OR public.is_event_member(e.id)
    );
$$;

REVOKE ALL ON FUNCTION public.get_event_code(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_code(uuid) TO authenticated;

-- Function: look up an event id by its code (no column read needed by client)
CREATE OR REPLACE FUNCTION public.find_event_by_code(_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.events
  WHERE event_code = upper(btrim(_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_event_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_event_by_code(text) TO authenticated;
