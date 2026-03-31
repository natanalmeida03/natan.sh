-- Upgrade path for the old notes table that stored title/content/tags in plaintext.
-- Run this only if you already created the previous insecure notes table.

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS payload_ciphertext text,
  ADD COLUMN IF NOT EXISTS payload_iv text,
  ADD COLUMN IF NOT EXISTS payload_auth_tag text,
  ADD COLUMN IF NOT EXISTS password_verifier text,
  ADD COLUMN IF NOT EXISTS password_scheme text,
  ADD COLUMN IF NOT EXISTS failed_unlock_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_failed_unlock_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS unlock_blocked_until timestamptz DEFAULT NULL;

ALTER TABLE notes
  ALTER COLUMN title DROP NOT NULL;

ALTER TABLE notes
  ALTER COLUMN content DROP NOT NULL;

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notes'
      AND policyname = 'Users manage own notes'
  ) THEN
    EXECUTE '
      CREATE POLICY "Users manage own notes" ON notes FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
END $$;

REVOKE ALL ON TABLE public.notes FROM anon, authenticated, PUBLIC;
GRANT ALL ON TABLE public.notes TO service_role;

CREATE INDEX IF NOT EXISTS idx_notes_user_updated
  ON notes (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_notes_user_pin_updated
  ON notes (user_id, is_pinned DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_notes_unlock_blocked_until
  ON notes (unlock_blocked_until)
  WHERE unlock_blocked_until IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'set_notes_updated_at'
  ) THEN
    EXECUTE '
      CREATE FUNCTION set_notes_updated_at()
      RETURNS trigger AS $fn$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $fn$ LANGUAGE plpgsql
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'notes_set_updated_at'
  ) THEN
    EXECUTE '
      CREATE TRIGGER notes_set_updated_at
      BEFORE UPDATE ON notes
      FOR EACH ROW
      EXECUTE FUNCTION set_notes_updated_at()
    ';
  END IF;
END $$;

ALTER TABLE notes
  DROP CONSTRAINT IF EXISTS notes_password_consistency;

ALTER TABLE notes
  DROP CONSTRAINT IF EXISTS notes_ciphertext_not_blank;

ALTER TABLE notes
  DROP CONSTRAINT IF EXISTS notes_failed_unlock_attempts_non_negative;

ALTER TABLE notes
  ADD CONSTRAINT notes_failed_unlock_attempts_non_negative CHECK (
    failed_unlock_attempts >= 0
  );
