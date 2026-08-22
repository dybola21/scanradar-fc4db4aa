# Plan: Refactor n8n Webhook Integration Architecture (Version 6)

Refactor the n8n integration to use a dedicated internal API route for triggering searches, ensuring a decoupled and more reliable communication between the frontend and the n8n production webhook.

## Technical Details

### 1. New API Route: `src/routes/api/public/start-search.ts`
- Implement a `POST` handler that:
    - Accepts `searchId`, `termo`, `cidade`, and `uf`.
    - Validates inputs using Zod.
    - Logs `SEARCH_CREATED` and `N8N_REQUEST_SENT`.
    - Retrieves the n8n URL from environment variable `N8N_WEBHOOK_URL` (with fallback to the user's database settings if the env var is not defined, ensuring backward compatibility).
    - Retrieves the n8n secret from environment variable `N8N_WEBHOOK_SECRET` or the user's encrypted settings.
    - Dispatches a `POST` request to n8n with:
        - Headers: `Content-Type`, `X-Webhook-Secret`, `X-Idempotency-Key` (using `searchId`).
        - Body: `{ requestType: "search", searchId, termo, cidade, uf }`.
    - Returns `HTTP 200` immediately with `{ success: true, status: "queued", searchId }`.

### 2. Update Frontend: `src/components/SearchPage.tsx`
- Refactor `searchMutation` to call the internal endpoint `fetch('/api/public/start-search', ...)` instead of the `startSearch` server function.
- Simplify the mutation logic by removing intermediate server function layers.

### 3. Obsolete Old Logic: `src/lib/scraper.functions.ts`
- Keep `startSearch` server function for now to avoid breaking other parts of the app, but mark it as legacy or refactor it to call the internal API route if needed. 
- *Correction*: The user explicitly wants to "substituir a arquitetura de chamada". I will update `startSearch` to simply call the internal API route or move its logic to the API route entirely.

### 4. Robust Logging
- Ensure all events (`SEARCH_CREATED`, `N8N_REQUEST_SENT`, `SYSTEM_ERROR`) are recorded in the `scan_logs` table via the internal API route.

### 5. Deployment / Environment
- The user mentions `N8N_WEBHOOK_URL` in environment variables. I will ensure the code reads it using `process.env`.

## User Review Required

> [!IMPORTANT]
> - Ensure the `N8N_WEBHOOK_URL` environment variable is set in the production environment for this new flow to work correctly with the desired URL.
> - The n8n workflow must be configured to "Respond Immediately" to avoid timeouts during the internal API call.
