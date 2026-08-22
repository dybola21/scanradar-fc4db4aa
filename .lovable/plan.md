# UI/UX Refinement Plan for ScanRadar (v2)

Implement a comprehensive UI/UX refinement across all internal screens, focusing on hierarchy, accessibility, and professional SaaS aesthetics while avoiding generic rounded geometry.

## Design System & Layout
- **Variable Border Radius**: 
  - Cards: `16px` (`rounded-[16px]`).
  - Inputs, Buttons, Dropdowns: `10–12px` (`rounded-[10px]` to `rounded-[12px]`).
  - Badges: Pill format only when relevant.
- **Content Container**: Max width `1320px`.
- **Typography**: Minimum `13–14px` for readability.
- **Shadows**: Minimize usage; prefer discrete borders (`border-border`) and soft shadows (`shadow-sm`) only for elevation.
- **Contrast**: Ensure WCAG AA compliance.

## Sidebar & Navigation
- **Unified Account Menu**: Replace the footer's n8n card and logout button with a single menu showing Avatar, abbreviated email, and status. Dropdown actions: "Configurações" and "Sair" (skip "Minha conta" as the route doesn't exist).
- **Desktop Sidebar**: Fixed width of `240px`. Remove redundant section labels ("VISÃO GERAL", etc.).
- **Mobile Drawer**: Fully accessible implementation using `Sheet` (Radix), ensuring Esc-to-close, scroll locking, and focus traps.
- **Tooltips**: Add for the collapse button with proper focus states.

## Dashboard Progressive States
- Three mutually exclusive states to prevent UI flickering:
  1. **Integration Required**: Show "Configure ScanRadar" block if n8n is missing.
  2. **Empty State**: Show "Make your first search" if integrated but no searches exist.
  3. **Active Data**: Render metrics, distribution charts, and recent searches only when data is present.
- **Loading State**: Explicit loading UI during database queries to avoid "No searches" flashes.

## Search Page & Safety
- **Logic Guard**: Submission must re-verify n8n integration status server-side (in `scraper.functions.ts`) and client-side before calling the webhook.
- **Form Refinement**: Inline validation, loading/disabled states, and a conditional "Limpar" button.
- **Advanced Options**: Remove "Extraction details" if parameters are purely decorative and not supported by the n8n workflow.

## History Page
- **Compact Empty State**: Hide search bars and status filters when no records exist.
- **Standardized Table**: Columns for Nicho, Localização, Data, Status, and Leads.
- **Action Menu**: Include only functional operations (Open Results, Delete).

## Settings & Security
- **Webhook Secret**: Mask the secret after saving (`••••••••`). The toggle to "Show" should only work during entry of a new key. Never return the original secret to the browser after the initial save.
- **Help Section**: Add an expandable "How to configure n8n" guide.

## Modified Files
- `src/styles.css`: Global variables and layout.
- `src/components/DashboardLayout.tsx`: Sidebar and mobile drawer.
- `src/components/Dashboard.tsx`: State logic and metrics.
- `src/components/SearchPage.tsx`: Form guards and UI.
- `src/components/HistoryPage.tsx`: Table and empty states.
- `src/components/SettingsPage.tsx`: Webhook security and layout.
- `src/lib/scraper.functions.ts`: Server-side integration guards.
- `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/card.tsx`: Refined radius.
