-- Revoke all execution on has_role from public (which includes anon and authenticated)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC;

-- Re-grant execution ONLY to service_role (as it's used internally by RLS)
-- and potentially to authenticated if you want to call it from server functions via context.supabase
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;

-- Ensure user_roles has a policy (Linter reported RLS enabled but no policy)
DO $$ BEGIN
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;