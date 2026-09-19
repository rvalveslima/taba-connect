-- Prevent non-admin users from changing is_admin on accounts
CREATE OR REPLACE FUNCTION public.protect_is_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If is_admin is unchanged, allow the update
  IF NEW.is_admin IS NOT DISTINCT FROM OLD.is_admin THEN
    RETURN NEW;
  END IF;
  -- Allow the change only if the requester is already an admin (and not changing their own row)
  IF auth.uid() IS NOT NULL AND auth.uid() <> OLD.id AND EXISTS (
    SELECT 1 FROM public.accounts a WHERE a.id = auth.uid() AND a.is_admin = true
  ) THEN
    RETURN NEW;
  END IF;
  -- Otherwise silently preserve the original value
  NEW.is_admin := OLD.is_admin;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accounts_protect_is_admin ON public.accounts;
CREATE TRIGGER accounts_protect_is_admin
BEFORE UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.protect_is_admin();

-- Not callable via Data API
REVOKE EXECUTE ON FUNCTION public.protect_is_admin() FROM PUBLIC, anon, authenticated;