# UI/UX Refinement Plan for ScanRadar (v3)

Implement a comprehensive UI/UX refinement across all internal screens, focusing on professional SaaS aesthetics, accessibility, and robust security.

## Design System & Layout
- **Variable Border Radius**: 
  - Cards: `16px` (`rounded-[16px]`).
  - Inputs, Buttons, Dropdowns: `10–12px` (`rounded-[10px]` to `rounded-[12px]`).
  - **Regression Safety**: Perform visual checks on the login page after updating shared UI components.
- **Content Container**: Standardize max width to `1320px`.
- **Typography**: Minimum `13–14px` for general text; remove "eyebrow" labels ("VISÃO GERAL", etc.) in `Dashboard`, `SearchPage`, `HistoryPage`, and `SettingsPage`.
- **Shadows**: Minimize usage; prefer discrete borders (`border-border`) and soft shadows (`shadow-sm`).
- **Contrast**: Maintain WCAG AA compliance.

## Sidebar & Navigation
- **Unified Account Menu**: Replace footer elements with a single menu: Avatar, abbreviated email, and dropdown for "Configurações" and "Sair". Remove "Conta ativa" (non-useful info).
- **Desktop Sidebar**: Fixed width `240px`.
- **Mobile Drawer**: Fully accessible `Sheet` (Radix) with Esc-to-close, focus trap, and scroll lock.

## Dashboard Progressive States
- Four mutually exclusive states:
  1. **Loading**: Show explicit loading UI during data fetching to prevent flickering.
  2. **Integration Required**: "Configure o ScanRadar para começar" block if n8n is missing.
  3. **Empty State**: "Faça sua primeira busca de empresas" if integrated but no data exists.
  4. **Active Data**: Metrics, distribution, and recent searches (only when data is present).
  5. **Error**: Distinct error state if data fetching fails.

## Search Page & Safety
- **Server-Side Guard**: All validation and webhook calls are handled in `createServerFn` (`src/lib/scraper.functions.ts`), which is executed strictly in the serverless Worker runtime (TanStack Start).
- **Form Refinement**: Inline validation, loading/disabled states, and a conditional "Limpar" button.
- **Advanced Options**: Remove "Detalhes da extração" if parameters are not supported by the current n8n workflow.

## History Page
- **Compact Empty State**: Hide filters and search bar when no records exist. Show only one "Criar primeira busca" CTA.
- **Standardized Table**: Columns for Nicho, Localização, Data, Status, and Leads.
- **Mobile**: Transform table into a structured list/cards to avoid horizontal scrolling.
- **Action Menu**: Include only "Resultados" and "Excluir". Excluir requires confirmation and shows loading feedback.

## Settings & Security
- **Webhook Secret**: 
  - The `getIntegrationSettings` server function returns `has_secret: true` and a placeholder `••••••••`, never the actual secret.
  - The UI "Show" toggle works only during new secret entry.
  - Saving/Testing includes loading, success, and error feedback.
- **Help Section**: Expandable "Como configurar no n8n" guide.

## Modified Files
- `src/styles.css`
- `src/components/DashboardLayout.tsx`
- `src/components/Dashboard.tsx`
- `src/components/SearchPage.tsx`
- `src/components/HistoryPage.tsx`
- `src/components/SettingsPage.tsx`
- `src/lib/scraper.functions.ts`
- `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/card.tsx`
- `src/components/ui-kit/PageHeader.tsx` (remove eyebrow labels)
