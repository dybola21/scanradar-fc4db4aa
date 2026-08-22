-- Add callback_secret_hash to n8n_settings
ALTER TABLE public.n8n_settings 
ADD COLUMN IF NOT EXISTS callback_secret_hash TEXT;

-- Update searches status check constraint
ALTER TABLE public.searches 
DROP CONSTRAINT IF EXISTS searches_status_check;

ALTER TABLE public.searches 
ADD CONSTRAINT searches_status_check 
CHECK (status IN ('pending', 'queued', 'processing', 'completed', 'failed', 'delivery_unknown'));

-- Add lead_key to leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_key TEXT;

-- We don't try to add UNIQUE constraint directly here in case of existing duplicates
-- Instead, we'll try to add it.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leads_search_id_lead_key_key'
    ) THEN
        ALTER TABLE public.leads 
        ADD CONSTRAINT leads_search_id_lead_key_key UNIQUE (search_id, lead_key);
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not add unique constraint leads_search_id_lead_key_key. You may have duplicate data.';
END $$;

-- RPC for transactional lead insertion and status update
CREATE OR REPLACE FUNCTION public.complete_search_with_leads(
    p_search_id UUID,
    p_status TEXT,
    p_total_leads INTEGER,
    p_leads JSONB,
    p_sheet_name TEXT DEFAULT NULL,
    p_sheet_url TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update search status
    UPDATE public.searches
    SET 
        status = p_status,
        total_leads = p_total_leads,
        sheet_name = p_sheet_name,
        sheet_url = p_sheet_url,
        error_message = p_error_message,
        completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN now() ELSE completed_at END
    WHERE id = p_search_id;

    -- Insert leads if status is completed and leads are provided
    IF p_status = 'completed' AND p_leads IS NOT NULL AND jsonb_array_length(p_leads) > 0 THEN
        INSERT INTO public.leads (
            search_id,
            nome,
            telefone,
            bairro,
            cidade,
            uf,
            website,
            email,
            email2,
            lead_key
        )
        SELECT 
            p_search_id,
            (l->>'nome')::TEXT,
            (l->>'telefone')::TEXT,
            (l->>'bairro')::TEXT,
            (l->>'cidade')::TEXT,
            (l->>'uf')::TEXT,
            (l->>'website')::TEXT,
            (l->>'email')::TEXT,
            (l->>'email2')::TEXT,
            (l->>'lead_key')::TEXT
        FROM jsonb_array_elements(p_leads) AS l
        ON CONFLICT (search_id, lead_key) DO UPDATE SET
            nome = EXCLUDED.nome,
            telefone = EXCLUDED.telefone,
            bairro = EXCLUDED.bairro,
            cidade = EXCLUDED.cidade,
            uf = EXCLUDED.uf,
            website = EXCLUDED.website,
            email = EXCLUDED.email,
            email2 = EXCLUDED.email2;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_search_with_leads(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_search_with_leads(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT) TO authenticated;

-- Enable Realtime for searches and leads
-- Note: Realtime requires the table to be added to the supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'searches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.searches;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;
END $$;
