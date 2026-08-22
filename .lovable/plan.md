# UI/UX Refinement Plan for ScanRadar (v4)

Implement a comprehensive UI/UX refinement across all internal screens, focusing on professional SaaS aesthetics, accessibility, and robust security.

## Design System & Layout
- **Variable Border Radius**: 
  - Cards: `16px` (`rounded-[16px]`).
  - Inputs, Buttons, Dropdowns: `10–12px` (`rounded-[10px]` to `rounded-[12px]`).
- **Content Container**: Standardize max width to `1320px`.
- **Typography**: Minimum `13–14px` for general text; remove "eyebrow" labels ("VISÃO GERAL", etc.) in `Dashboard`, `SearchPage`, `HistoryPage`, and `SettingsPage`.
- **Shadows**: Minimize usage; prefer discrete borders (`border-border`) and soft shadows (`shadow-sm`).

## Sidebar & Navigation
- **Unified Account Menu**: Replace footer elements with a single menu: Avatar, abbreviated email, and dropdown for "Configurações" and "Sair". 
- **Desktop Sidebar**: Fixed width `240px`.
- **Mobile Drawer**: Accessible `Sheet` (Radix) with Esc-to-close, focus trap, and scroll lock.

## Dashboard Progressive States
- Five mutually exclusive states based on search existence, not just lead count:
  1. **Loading**: Explicit loading UI.
  2. **Erro**: Error state if data fetching fails.
  3. **Integração necessária**: "Configure o ScanRadar para começar" if n8n is missing.
  4. **Primeira busca**: "Faça sua primeira busca" if integrated but no searches exist.
  5. **Dados ativos**: Metrics, distribution, and recent searches.

## Server Functions & Security
- **Authentication**: All `createServerFn` must validate sessions strictly server-side using the `context.supabase` instance and `userId` from `requireSupabaseAuth` middleware.
- **SSRF Protection**: Webhook calls will validate for `https://`, excluding `localhost`, loopback, and private IPs. Includes timeout and response size limits.
- **Data Privacy**: `getIntegrationSettings` returns `has_secret: boolean` and metadata, never the secret or placeholders. The UI generates masks locally.

## Components & Accessibility
- **Search Page**: Inline validation, loading states, and conditional "Limpar" button. Remove unused extraction details.
- **History Page**: Compact empty state; structured list for mobile; confirmation dialog for deletion with loading feedback.
- **Accessibility**: Use `aria-live` for async feedback (save, test, delete).

## Modified Files
- `src/styles.css`
- `src/components/DashboardLayout.tsx`
- `src/components/Dashboard.tsx`
- `src/components/SearchPage.tsx`
- `src/components/HistoryPage.tsx`
- `src/components/SettingsPage.tsx`
- `src/lib/scraper.functions.ts`
- `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/card.tsx`
- `src/components/ui-kit/PageHeader.tsx`
- `src/lib/utils.ts` (added SSRF validation helpers)
