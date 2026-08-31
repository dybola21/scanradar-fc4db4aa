-- Track which leads the user has already contacted (green indicator)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS contacted boolean NOT NULL DEFAULT false;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

DROP POLICY IF EXISTS "Users can select own leads" ON public.leads;
CREATE POLICY "Users can select own leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.searches
      WHERE searches.id = leads.search_id
        AND searches.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own leads contacted" ON public.leads;
CREATE POLICY "Users can update own leads contacted"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.searches
      WHERE searches.id = leads.search_id
        AND searches.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.searches
      WHERE searches.id = leads.search_id
        AND searches.user_id = auth.uid()
    )
  );