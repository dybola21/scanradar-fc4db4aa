-- Revoke execution from authenticated for complete_search_with_leads
REVOKE EXECUTE ON FUNCTION public.complete_search_with_leads(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT) FROM authenticated;

-- Ensure it's revoked from public as well (redundant but safe)
REVOKE EXECUTE ON FUNCTION public.complete_search_with_leads(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC;

-- Keep only for service_role
GRANT EXECUTE ON FUNCTION public.complete_search_with_leads(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT) TO service_role;
