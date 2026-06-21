CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE public.organizer_waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email citext NOT NULL UNIQUE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.organizer_waitlist TO anon, authenticated;
GRANT ALL ON public.organizer_waitlist TO service_role;

ALTER TABLE public.organizer_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.organizer_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);