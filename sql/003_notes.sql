CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload_ciphertext text NOT NULL,
  payload_iv text NOT NULL,
  payload_auth_tag text NOT NULL,
  accent_color text DEFAULT NULL,
  icon text DEFAULT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  is_protected boolean NOT NULL DEFAULT false,
  password_scheme text DEFAULT NULL,
  password_salt text DEFAULT NULL,
  password_verifier text DEFAULT NULL,
  failed_unlock_attempts integer NOT NULL DEFAULT 0,
  first_failed_unlock_at timestamptz DEFAULT NULL,
  unlock_blocked_until timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notes_ciphertext_not_blank CHECK (
    char_length(btrim(payload_ciphertext)) > 0
    AND char_length(btrim(payload_iv)) > 0
    AND char_length(btrim(payload_auth_tag)) > 0
  ),
  CONSTRAINT notes_password_consistency CHECK (
    (is_protected = false AND password_scheme IS NULL AND password_salt IS NULL AND password_verifier IS NULL)
    OR
    (is_protected = true AND password_scheme IS NOT NULL AND password_salt IS NOT NULL AND password_verifier IS NOT NULL)
  ),
  CONSTRAINT notes_failed_unlock_attempts_non_negative CHECK (
    failed_unlock_attempts >= 0
  )
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notes" ON notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON TABLE public.notes FROM anon, authenticated, PUBLIC;
GRANT ALL ON TABLE public.notes TO service_role;

CREATE INDEX idx_notes_user_updated
  ON notes (user_id, updated_at DESC);

CREATE INDEX idx_notes_user_pin_updated
  ON notes (user_id, is_pinned DESC, updated_at DESC);

CREATE INDEX idx_notes_unlock_blocked_until
  ON notes (unlock_blocked_until)
  WHERE unlock_blocked_until IS NOT NULL;

CREATE OR REPLACE FUNCTION set_notes_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_set_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION set_notes_updated_at();
