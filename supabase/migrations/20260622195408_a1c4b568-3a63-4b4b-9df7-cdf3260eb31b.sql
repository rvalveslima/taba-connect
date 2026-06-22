CREATE TABLE public.feedback_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL,
  subject text,
  message text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_messages_subject_len CHECK (subject IS NULL OR char_length(subject) <= 120),
  CONSTRAINT feedback_messages_message_len CHECK (char_length(message) BETWEEN 1 AND 2000)
);

GRANT INSERT ON public.feedback_messages TO authenticated;
GRANT ALL ON public.feedback_messages TO service_role;

ALTER TABLE public.feedback_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY feedback_insert_self
  ON public.feedback_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (account_id = auth.uid());

CREATE POLICY feedback_no_read_authenticated
  ON public.feedback_messages
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (false);