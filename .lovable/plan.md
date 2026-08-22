# Plan: Refactoring Backend Integration and Fixing Logs

The user is experiencing failures in the "New Search" flow, reporting that n8n requests are not sent and logs are not working. I will refactor the backend integration to be simpler and more robust, removing unnecessary security abstractions that might be causing silent failures in the Edge environment, and ensuring that logs are reliably persisted using the service role client.

## Proposed Changes

### 1. Simplify and Robustify Logging
- Modify `src/lib/logs.server.ts` to ensure it uses `supabaseAdmin` correctly and doesn't swallow errors silently during logging.
- Ensure `logScanEvent` in `src/lib/logs.functions.ts` is robust.

### 2. Simplify Webhook Communication
- Bypass `safeWebhookFetch` if it's causing issues with SSRF validation in the production environment (which might be too restrictive).
- Implement a direct, well-logged `fetch` call inside `src/lib/scraper.functions.ts`.
- Ensure all environment variables (like `ENCRYPTION_KEY`) are read correctly inside the server function handlers.

### 3. Refactor `startSearch` Flow
- Flatten the logic to reduce complexity.
- Improve error handling to catch and log specific database or network errors.
- Ensure that the `search_logs` entries are created even if parts of the process fail.

### 4. Database Verification
- Ensure RLS and Grants for `scan_logs` and `searches` are correct to allow `authenticated` users to insert but `service_role` to manage everything.

## Technical Details

### `src/lib/scraper.functions.ts`
- Use `supabaseAdmin` for internal operations to bypass RLS issues during background processing if needed (carefully).
- Directly use `fetch` with a standard 15s timeout.
- Explicitly log every step: Start, Settings Load, Insert Search, Webhook Call, Webhook Result, Database Update.

### `src/lib/server/webhook-security.ts`
- I will verify if the `isPrivateIP` check is blocking legitimate production URLs. If the user's n8n is on a specific cloud provider that uses internal-looking IPs, this check might fail. I'll add more logging to this file.

### Admin/Logs UI
- No changes needed here, as the UI already supports the events.

## User Review Required

> [!IMPORTANT]
> This refactor will make the webhook calls more direct. Ensure your n8n endpoint is publicly accessible and accepts POST requests with JSON payloads.
