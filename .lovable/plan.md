# Plan - Implementation of Execution Logs for ScanRadar

Implement a complete execution log system to track the entire search flow from the frontend through the n8n webhook and back to the database.

## User Review Required

> [!IMPORTANT]
> The admin logs page will be accessible at `/admin/logs`. It will be nested under the `_authenticated` layout to ensure only logged-in users can access it. If a specific admin role is required, please confirm.

## Proposed Changes

### Database Layer
- Create `scan_logs` table in Supabase.
- Fields: `id`, `search_id`, `event_type`, `event_status`, `message`, `payload`, `error_message`, `created_at`.
- Enable RLS and add policies for authenticated users.
- Add `GRANT` permissions for `authenticated` and `service_role`.

### Server Functions & Logic
- Create `src/lib/logs.functions.ts`:
    - `logScanEvent`: Server function to persist logs to the database.
- Create `src/lib/logs.server.ts`:
    - Server-side helper for logging (bypassing RLS for system events if needed).

### Frontend Instrumentation
- **Search Flow (`src/lib/scraper.functions.ts` / `src/components/SearchPage.tsx`)**:
    - Log `SEARCH_CREATED` when a search starts.
    - Log `WEBHOOK_REQUEST_SENT` before calling n8n.
    - Log `WEBHOOK_RESPONSE_RECEIVED` on success.
    - Log `WEBHOOK_ERROR` on failure.
- **Results View (`src/components/ResultsPage.tsx`)**:
    - Log `RESULTS_FETCHED` when the user views the results.

### Backend Instrumentation
- **Callback Endpoint (`src/routes/api.public.results.ts`)**:
    - Log `CALLBACK_RECEIVED` when the webhook hits the endpoint.
    - Log `CALLBACK_VALIDATED` after secret verification.
    - Log `RESULTS_SAVED` after database persistence.
    - Log `SYSTEM_ERROR` on any internal failure.

### Administrative UI
- Create `src/routes/_authenticated.admin.logs.tsx`:
    - Display a timeline of logs.
    - Filters: `searchId`, period, `event_type`, `event_status`.
    - Detailed view for JSON payloads and error messages.
- Update `src/components/DashboardLayout.tsx` to include a link to the Logs page (visible to admins if role system exists).

## Technical Details
- **Log Table Schema**:
```sql
CREATE TYPE public.scan_event_type AS ENUM (
  'SEARCH_CREATED', 
  'WEBHOOK_REQUEST_SENT', 
  'WEBHOOK_RESPONSE_RECEIVED', 
  'WEBHOOK_ERROR', 
  'CALLBACK_RECEIVED', 
  'CALLBACK_VALIDATED', 
  'RESULTS_SAVED', 
  'RESULTS_FETCHED', 
  'FRONTEND_ERROR', 
  'SYSTEM_ERROR'
);

CREATE TYPE public.scan_event_status AS ENUM (
  'started', 
  'success', 
  'failed', 
  'warning'
);

CREATE TABLE public.scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid REFERENCES public.searches(id) ON DELETE CASCADE,
  event_type public.scan_event_type NOT NULL,
  event_status public.scan_event_status NOT NULL,
  message text,
  payload jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);
```
- **Real-time updates**: The admin logs page will use Supabase Realtime to show logs as they happen.
