GRANT SELECT ON public.events TO anon;
CREATE POLICY events_select_anon ON public.events FOR SELECT TO anon USING (true);