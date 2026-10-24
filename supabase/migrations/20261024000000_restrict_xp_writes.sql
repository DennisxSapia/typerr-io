-- XP may only be changed server-side (Edge Function "award-xp" with service_role).
-- Before this migration, clients could raise any user's XP via the RPC and
-- their own XP via a direct UPDATE on public.users.

-- 1. increment_xp is SECURITY DEFINER (bypasses RLS): restrict execution to service_role
REVOKE EXECUTE ON FUNCTION public.increment_xp(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.increment_xp(uuid, integer, text) TO service_role;

-- 2. users: RLS limits clients to their own row, column grants limit them to id and username.
--    UPDATE on id is required for PostgREST upserts; RLS WITH CHECK (auth.uid() = id) prevents changing it.
REVOKE INSERT, UPDATE ON public.users FROM anon, authenticated;
GRANT INSERT (id, username) ON public.users TO authenticated;
GRANT UPDATE (id, username) ON public.users TO authenticated;

-- 3. Redundant FOR ALL policy, which also allowed DELETE of the own row
DROP POLICY IF EXISTS "Nutzer können ihren Eintrag bearbeiten" ON public.users;
