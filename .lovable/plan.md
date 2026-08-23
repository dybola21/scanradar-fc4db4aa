# Plan: Fix Deletion Functionality and UI Hardening

Fix the search deletion feature which is currently broken due to missing database permissions (RLS) and incomplete server-side logic. Add search deletion to the Results page for better UX.

## User Review Required

> [!IMPORTANT]
> This plan adds a "Delete Search" button to the search results page and fixes the existing one in the history.

- None

## Proposed Changes

### Database & Security
- Add `DELETE` RLS policies for `searches`, `leads`, and `scan_logs` tables to allow `authenticated` users to delete their own records.
- Grant `DELETE` permissions to the `authenticated` role.

### Backend (Server Functions)
- Update `deleteSearch` in `src/lib/scraper.functions.ts` to explicitly delete `scan_logs` before deleting leads and the search itself to avoid foreign key violations.
- Add a `clearAllLogs` server function in `src/lib/logs.functions.ts` / `src/lib/logs.server.ts` to allow admins/users to clear their technical logs securely.

### UI & UX (Frontend)
- **Results Page**: Add a "Delete Search" button with a confirmation dialog, allowing users to remove a search directly while viewing it.
- **Admin Logs**: Update the "Clear Logs" button to use the new server function instead of a direct (and potentially failing) client-side `delete` call.
- **History Page**: Ensure the existing delete logic is robust and shows clear feedback.

## Technical Details
- SQL: `CREATE POLICY ... FOR DELETE ... USING (auth.uid() = user_id)`.
- Server Functions: Use `requireSupabaseAuth` middleware.
- Components: Use Shadcn `AlertDialog` for all destructive actions.
