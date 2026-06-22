REVOKE EXECUTE ON FUNCTION public.is_my_membership(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.shares_event_with(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_event_member(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_event_code(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.find_event_by_code(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;

GRANT EXECUTE ON FUNCTION public.is_my_membership(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_event_with(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_event_by_code(text) TO authenticated;