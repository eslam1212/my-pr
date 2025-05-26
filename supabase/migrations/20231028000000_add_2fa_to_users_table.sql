-- Add 2FA related columns to the public.users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS is_two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT[];

COMMENT ON COLUMN public.users.two_factor_secret IS 'Encrypted TOTP secret key for 2FA.';
COMMENT ON COLUMN public.users.is_two_factor_enabled IS 'Flag indicating if 2FA is enabled for the user.';
COMMENT ON COLUMN public.users.two_factor_backup_codes IS 'Array of encrypted single-use backup codes for 2FA recovery.';

-- Ensure the updated_at column exists and has a trigger
-- (Assuming public.users might not have it from default Supabase setup or previous migrations)

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Ensure the trigger function exists (idempotent)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to public.users table if not already applied for 'updated_at'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'set_timestamp_users_updated_at'
        AND tgrelid = 'public.users'::regclass
    ) THEN
        CREATE TRIGGER set_timestamp_users_updated_at
        BEFORE UPDATE ON public.users
        FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();
    END IF;
END $$;

-- Grant usage for the new columns if necessary, though existing grants on the table should cover it.
-- However, explicit grants can be added if there are specific restrictions.
-- Example: GRANT SELECT(is_two_factor_enabled) ON public.users TO authenticated;
-- Secrets like two_factor_secret and backup codes should NOT be directly selectable by 'authenticated' role.
-- They should only be accessed via security barrier functions or by 'service_role' in backend.

-- RLS policies should be in place for public.users.
-- If RLS is enabled, ensure policies allow users to update their own 2FA settings.
-- Example policy (adjust as needed):
-- CREATE POLICY "Users can update their own 2FA settings"
-- ON public.users
-- FOR UPDATE USING (auth.uid() = id)
-- WITH CHECK (auth.uid() = id);
-- (This assumes 'id' in public.users is the user's own auth.uid())

-- Note: Encryption of two_factor_secret and two_factor_backup_codes
-- should be handled at the application layer before inserting into the database,
-- or by using database-level encryption like pgsodium if configured.
-- The TEXT and TEXT[] types store them as is; application must ensure they are encrypted.
