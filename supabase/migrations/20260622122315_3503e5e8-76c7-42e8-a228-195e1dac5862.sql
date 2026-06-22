REVOKE EXECUTE ON FUNCTION public.find_event_by_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_event_code(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_event_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_my_membership(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.shares_event_with(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;