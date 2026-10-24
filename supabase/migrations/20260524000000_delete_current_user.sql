-- Enable UUID extension if not already enabled
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.delete_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  -- Get the authenticated user's ID
  v_uid := auth.uid();
  
  -- Throw an exception if not authenticated
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. You can only delete your own account.';
  END IF;

  -- The requirement strictly specifies NOT to delete game data 
  -- (e.g. leaderboard, level_times) and NEVER to reference public.users.
  -- 
  -- We attempt to only handle authentication-level account deletion.
  -- 
  -- However, if there are dependent records in public tables (like leaderboard) 
  -- linked via foreign key to auth.users without ON DELETE CASCADE,
  -- this DELETE statement will naturally fail and raise a foreign key constraint exception.
  -- We catch all exceptions and raise a safe error message as requested.

  BEGIN
    DELETE FROM auth.users WHERE id = v_uid;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Account deletion is not configured safely.';
  END;

END;
$$;

-- Revoke execute permissions from the public role for security
REVOKE ALL ON FUNCTION public.delete_current_user() FROM PUBLIC;

-- Grant execute permissions only to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_current_user() TO authenticated;
