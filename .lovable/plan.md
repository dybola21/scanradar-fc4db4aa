# Plan: Refactor n8n Webhook Integration Architecture (Version 6.1)

Refactor the n8n integration to use a dedicated internal API route for triggering searches, ensuring a decoupled and more reliable communication between the frontend and the n8n production webhook.

## Technical Details

### 1. New API Route: `src/routes/api.public.start-search.ts`
- Implement a `POST` handler that:
    - Accepts `searchId`, `termo`, `cidade`, and `uf`.
    - Validates inputs using Zod.
    - **Step 1: Database Check**: Verify the `searchId` exists and belongs to a valid session (or is newly created).
    - **Step 2: Log `SEARCH_CREATED`**: Only after database confirmation.
    - **Step 3: Configuration**: Use exclusively `process.env.N8N_WEBHOOK_URL` and `process.env.N8N_WEBHOOK_SECRET`. No database fallback for these settings initially.
    - **Step 4: Dispatch to n8n**:
        - Headers: `Content-Type: application/json`, `X-Webhook-Secret`, `X-Idempotency-Key` (`searchId`).
        - Body: `{ requestType: "search", searchId, termo, cidade, uf }`.
    - **Step 5: Log `N8N_REQUEST_SENT`**: Register URL (scrubbed), `searchId`, timestamp, and duration. No secrets or sensitive headers.
    - **Step 6: Immediate Response**: Return `HTTP 200` with `{ success: true, status: "queued", searchId }`.

### 2. Update Frontend: `src/components/SearchPage.tsx`
- Refactor `searchMutation` to call `fetch('/api/public/start-search', ...)` directly.
- Remove references to `startSearch` server function for the triggering phase.

### 3. Cleanup: `src/lib/scraper.functions.ts`
- Keep `startSearch` server function only for the initial database record creation (if preferred) or move creation logic into the API route.
- Remove direct n8n `fetch` logic from `startSearch` to ensure only the new API route handles communication.

### 4. Robust Logging
- Ensure all events (`SEARCH_CREATED`, `N8N_REQUEST_SENT`, `SYSTEM_ERROR`) are recorded in `scan_logs` via the new API route.

## User Review Required

> [!IMPORTANT]
> - **Environment Variables**: `N8N_WEBHOOK_URL` and `N8N_WEBHOOK_SECRET` MUST be set in the production environment. If missing, the API will return a `SYSTEM_ERROR`.
> - **n8n Workflow**: The n8n workflow must start with a "Respond to Webhook" node returning the `queued` status immediately to ensure the ScanRadar API can respond to the frontend without waiting for the full extraction.
