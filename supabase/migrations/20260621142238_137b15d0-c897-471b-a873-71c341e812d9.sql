
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_event_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_my_membership(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.shares_event_with(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_event_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_membership(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_event_with(uuid) TO authenticated;
