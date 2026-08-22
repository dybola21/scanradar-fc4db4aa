# Plan: Fixes for Logic Errors and Integration Bugs

Identify and resolve technical flaws in the integration, encryption, and logging layers to ensure reliable search execution.

## Technical Details

### 1. Encryption Layer Robustness
- **Problem**: `decrypt` in `src/lib/server/encryption.ts` crashes if the input string is not in `iv:hash` format. This causes silent failures if legacy unencrypted data is present.
- **Fix**: Update `decrypt` to check for the correct format before attempting decryption, returning the raw string as a fallback.

### 2. Standardize Fetch for Edge Runtime
- **Problem**: Inconsistent `fetch` options (`follow: 0`) in `src/lib/server/webhook-security.ts` may cause issues in strict Edge environments.
- **Fix**: Clean up `safeWebhookFetch` to use standard Web Fetch API properties (`redirect: 'manual'`) and remove environment-specific extensions.

### 3. Lead Deduplication Safety
- **Problem**: `api/public/results` relies on `lead_key` from the webhook. If missing, the database RPC `complete_search_with_leads` might fail due to null constraints or deduplication logic.
- **Fix**: Implement a deterministic fallback for `lead_key` generation in the callback handler if the property is missing in the payload.

### 4. Scraper Logic Hardening
- **Problem**: `startSearch` throws before logging in some failure paths (e.g., missing n8n settings).
- **Fix**: Move logging earlier and wrap settings retrieval in a documented error-handling block that records a `SYSTEM_ERROR` event.

### 5. Improved Diagnostic Logging
- **Problem**: Timeouts are reported but don't give enough guidance.
- **Fix**: Update `N8N_TIMEOUT` log messages to explicitly suggest checking if the n8n webhook is set to "Respond Immediately".

## Files to Modify

- `src/lib/server/encryption.ts`
- `src/lib/server/webhook-security.ts`
- `src/lib/scraper.functions.ts`
- `src/routes/api.public.results.ts`
