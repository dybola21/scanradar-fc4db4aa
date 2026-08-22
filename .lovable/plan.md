# Plan to Fix n8n Search Integration

The user reported that searches are being triggered in the UI, but no n8n webhooks are being called and no `SEARCH_CREATED` logs are appearing. This indicates a failure in the communication flow between the frontend and the server function, or within the server function itself before it reaches the n8n call.

## Diagnosis
1.  **Frontend trigger**: `SearchPage.tsx` uses `useMutation` with `startSearchFn`.
2.  **Server Function**: `startSearch` in `scraper.functions.ts` should log `SEARCH_CREATED` immediately after database insertion.
3.  **Security/Middleware**: `requireSupabaseAuth` is used. If the session isn't correctly attached, the call might fail.
4.  **Logging**: `serverLogScanEvent` uses `supabaseAdmin`.

## Identified Issues & Technical Steps

### 1. Fix Server Function Execution Flow
-   Ensure `startSearch` correctly returns results and doesn't swallow errors silently.
-   Verify `serverLogScanEvent` is called correctly.
-   Check if `safeWebhookFetch` is being bypassed or failing due to environment issues.

### 2. Instrumented Logging & Error Handling
-   Add more detailed logs in `startSearch` to identify exactly where it stops.
-   Ensure `FRONTEND_ERROR` is logged if the `useMutation` fails.

### 3. Ensure Environment Compatibility
-   Validate that `process.env` variables (like `ENCRYPTION_KEY`) are available inside the handler.
-   Ensure `supabaseAdmin` is only used on the server side (already is, but double-check imports).

### 4. Technical Implementation Details
-   **File**: `src/lib/scraper.functions.ts`
    -   Verify database insertion success.
    -   Log `SEARCH_CREATED` before n8n call.
    -   Explicitly catch and log errors from `safeWebhookFetch`.
-   **File**: `src/components/SearchPage.tsx`
    -   Log to console when `mutate` is called.
    -   Log `FRONTEND_ERROR` to `scan_logs` if mutation fails.

### 5. Verification
-   Trigger a search and check `Admin Logs` for `SEARCH_CREATED`.
-   Check `console-logs.log` for server-side prints.
