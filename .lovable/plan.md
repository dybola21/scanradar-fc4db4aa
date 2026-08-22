# UI/UX Refinement Plan for ScanRadar

Implement a comprehensive UI/UX refinement across all internal screens, focusing on hierarchy, accessibility, and professional SaaS aesthetics.

## Design System & Layout
- Update global border radius to 16px (1rem) in `src/styles.css`.
- Set max content container width to 1320px.
- Standardize typography (min 13-14px) and reduce shadow usage in favor of discrete borders.
- Ensure WCAG AA contrast for all interactive elements.

## Sidebar Refinement
- Adjust desktop width to 240px.
- Simplify navigation by removing redundant section labels.
- Replace individual footer elements (n8n card, account, logout) with a single unified account menu.
- Account menu will display avatar, abbreviated email, account status, and a dropdown for actions (My Account, Settings, Logout).
- Add tooltip and focus states to the collapse button.
- Transform into a responsive drawer for mobile viewports.

## Dashboard Progressive States
- Implement three distinct visibility states:
  1. **No Integration**: Display a "Configure ScanRadar" block with step-by-step instructions.
  2. **No Searches**: Display a simple "Make your first search" empty state with a "Nova busca" CTA.
  3. **Active Data**: Show metrics (Leads, Opportunities, etc.), charts, and recent searches only when data exists.
- Standardize all search-related CTAs to "Nova busca".

## Search Page Optimization
- Add a guard that disables the search button and shows a clear warning if the n8n integration is missing.
- Refine the search form with inline validation, loading states, and a conditional "Limpar" button.
- Rename "Extraction details" to "Advanced options" and simplify the section.

## History Page Refinement
- Implement a compact empty state for new users.
- Standardize the search table with columns for Nicho, Localização, Data, Status, and Leads count.
- Update filters to be more intuitive (Todas, Concluídas, Em execução, Falhas).

## Settings Simplification
- Consolidate settings into a single integration card.
- Remove redundant fields like "Integration name".
- Add an expandable "How to configure n8n" help section with concise instructions.
- Ensure the webhook secret toggle for visibility works correctly and remains secure.

## Modified Files
- `src/styles.css`
- `src/components/DashboardLayout.tsx`
- `src/components/Dashboard.tsx`
- `src/components/SearchPage.tsx`
- `src/components/HistoryPage.tsx`
- `src/components/SettingsPage.tsx`
- `src/components/ui-kit/EmptyState.tsx` (for compact variant if needed)
