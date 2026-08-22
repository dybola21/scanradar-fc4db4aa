ALTER TABLE public.n8n_settings
  ADD COLUMN IF NOT EXISTS last_tested_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_test_error text;