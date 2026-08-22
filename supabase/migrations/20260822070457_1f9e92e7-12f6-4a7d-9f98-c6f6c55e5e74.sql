-- Secure has_role function
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- Secure complete_search_with_leads function
REVOKE ALL ON FUNCTION public.complete_search_with_leads(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_search_with_leads(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.complete_search_with_leads(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.complete_search_with_leads(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT) TO service_role;

-- Update leads unique constraint to be more robust (Postgres 15+ supports NULLS NOT DISTINCT, but let's be safe)
-- We'll assume lead_key is always provided by n8n as instructed.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leads_search_id_lead_key_key'
    ) THEN
        ALTER TABLE public.leads 
        ADD CONSTRAINT leads_search_id_lead_key_key UNIQUE (search_id, lead_key);
    END IF;
END $$;
