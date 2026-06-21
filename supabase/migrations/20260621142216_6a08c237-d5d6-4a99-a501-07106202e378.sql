
-- 1. Link accounts.id to auth.users.id
ALTER TABLE public.accounts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Auto-create an account row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.accounts (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Add organizer reference to events
ALTER TABLE public.events
  ADD COLUMN organizer_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- 4. Helper functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_event_member(_event_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_memberships
    WHERE event_id = _event_id AND account_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_my_membership(_membership_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_memberships
    WHERE id = _membership_id AND account_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_event_with(_other uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_memberships m1
    JOIN public.event_memberships m2 ON m1.event_id = m2.event_id
    WHERE m1.account_id = auth.uid() AND m2.account_id = _other
  );
$$;

-- 5. RLS policies

-- accounts: own + fellow event members
CREATE POLICY "accounts_select_self_or_shared_event"
  ON public.accounts FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.shares_event_with(id));

CREATE POLICY "accounts_insert_self"
  ON public.accounts FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "accounts_update_self"
  ON public.accounts FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- events: any signed-in user can look up; only organizer mutates
CREATE POLICY "events_select_authenticated"
  ON public.events FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "events_insert_as_organizer"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (organizer_account_id = auth.uid());

CREATE POLICY "events_update_organizer"
  ON public.events FOR UPDATE TO authenticated
  USING (organizer_account_id = auth.uid())
  WITH CHECK (organizer_account_id = auth.uid());

CREATE POLICY "events_delete_organizer"
  ON public.events FOR DELETE TO authenticated
  USING (organizer_account_id = auth.uid());

-- event_memberships: members of an event see all its memberships; only own row writable
CREATE POLICY "memberships_select_if_event_member"
  ON public.event_memberships FOR SELECT TO authenticated
  USING (public.is_event_member(event_id));

CREATE POLICY "memberships_insert_self"
  ON public.event_memberships FOR INSERT TO authenticated
  WITH CHECK (account_id = auth.uid());

CREATE POLICY "memberships_update_self"
  ON public.event_memberships FOR UPDATE TO authenticated
  USING (account_id = auth.uid()) WITH CHECK (account_id = auth.uid());

CREATE POLICY "memberships_delete_self"
  ON public.event_memberships FOR DELETE TO authenticated
  USING (account_id = auth.uid());

-- messages: only sender or recipient can read; only sender can insert
CREATE POLICY "messages_select_participant"
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_my_membership(sender_membership_id) OR public.is_my_membership(recipient_membership_id));

CREATE POLICY "messages_insert_as_sender"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (public.is_my_membership(sender_membership_id));
