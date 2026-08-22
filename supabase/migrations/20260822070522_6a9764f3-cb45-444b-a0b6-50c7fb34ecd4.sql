-- Add new columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS place_id TEXT,
ADD COLUMN IF NOT EXISTS endereco TEXT;

-- Update the complete_search_with_leads RPC to handle new columns
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
            lead_key,
            place_id,
            endereco
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
            (l->>'lead_key')::TEXT,
            (l->>'place_id')::TEXT,
            (l->>'endereco')::TEXT
        FROM jsonb_array_elements(p_leads) AS l
        ON CONFLICT (search_id, lead_key) DO UPDATE SET
            nome = EXCLUDED.nome,
            telefone = EXCLUDED.telefone,
            bairro = EXCLUDED.bairro,
            cidade = EXCLUDED.cidade,
            uf = EXCLUDED.uf,
            website = EXCLUDED.website,
            email = EXCLUDED.email,
            email2 = EXCLUDED.email2,
            place_id = EXCLUDED.place_id,
            endereco = EXCLUDED.endereco;
    END IF;
END;
$$;

-- Re-grant execution to service_role
GRANT EXECUTE ON FUNCTION public.complete_search_with_leads(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT) TO service_role;
