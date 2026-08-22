-- Revoke public execution for complete_search_with_leads
REVOKE EXECUTE ON FUNCTION public.complete_search_with_leads(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC;

-- Re-grant ONLY to service_role and authenticated
GRANT EXECUTE ON FUNCTION public.complete_search_with_leads(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_search_with_leads(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT) TO authenticated;
