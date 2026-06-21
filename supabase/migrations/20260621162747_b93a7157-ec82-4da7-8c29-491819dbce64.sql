
CREATE POLICY "event-images read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'event-images');

CREATE POLICY "event-images insert own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "event-images update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "event-images delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);
