
-- Revoke default PUBLIC EXECUTE on all SECURITY DEFINER helpers, then grant narrowly.

REVOKE EXECUTE ON FUNCTION public.get_event_public_info(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.find_event_by_code(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_event_code(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_event_member(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_my_membership(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.shares_event_with(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Public join flow needs anon access to fetch basic event info before sign-in.
GRANT EXECUTE ON FUNCTION public.get_event_public_info(uuid) TO anon, authenticated;

-- These are only used after sign-in.
GRANT EXECUTE ON FUNCTION public.find_event_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_code(uuid) TO authenticated;

-- RLS helper functions are called from policies as the current user.
GRANT EXECUTE ON FUNCTION public.is_event_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_membership(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_event_with(uuid) TO authenticated;

-- handle_new_user is a trigger function on auth.users; no EXECUTE grant needed.
