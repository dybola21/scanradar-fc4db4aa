# UI/UX Refinement Plan for ScanRadar (v5)

Implement a comprehensive UI/UX refinement across all internal screens, focusing on professional SaaS aesthetics, accessibility, robust server-side security, and mobile optimization.

## Design System & Layout
- **Variable Border Radius**: 
  - Cards: `16px` (`rounded-[16px]`).
  - Inputs, Buttons, Dropdowns: `10–12px` (`rounded-[10px]` to `rounded-[12px]`).
- **Content Container**: Standardize max width to `1320px`.
- **Typography**: Minimum `13–14px` for general text; remove "eyebrow" labels ("VISÃO GERAL", etc.) in `Dashboard`, `SearchPage`, `HistoryPage`, and `SettingsPage`.
- **Shadows**: Discrete borders (`border-border`) and soft shadows (`shadow-sm`).
- **Accessibility**: 
  - Ensure WCAG AA compliance (contrast, font sizes).
  - Visible focus rings on all interactive elements.
  - Native keyboard navigation support.
  - Minimum touch targets of `44px` for all buttons/links.

## Sidebar & Navigation
- **Unified Account Menu**: Replace footer elements with a single menu: Avatar, abbreviated email, and dropdown for "Configurações" and "Sair". 
- **Desktop Sidebar**: Fixed width `240px`.
- **Mobile Drawer**: Accessible `Sheet` (Radix) with focus trap, Esc-to-close, and scroll lock.

## Dashboard Progressive States
- Five mutually exclusive states based on search presence:
  1. **Loading**: Pulse/Skeleton UI.
  2. **Erro**: Feedback when data fetching fails.
  3. **Integração necessária**: "Configure o ScanRadar para começar" if n8n is missing.
  4. **Primeira busca**: "Faça sua primeira busca" if integrated but no searches exist.
  5. **Dados ativos**: Metrics, distribution, and recent searches.

## Search & Scraper Guards
- **Dual Protection**:
  - **Client**: Disable search button and redirect to Settings if n8n is not configured.
  - **Server**: `createServerFn` must block webhook execution if integration settings are missing/invalid, regardless of client state.

## Settings & Security
- **Integration UI**:
  - Single integration card (removing "Nome da integração" if only one exists).
  - "Salvar" and "Testar" buttons with explicit Loading, Success, and Error states.
  - Disable "Salvar" if no changes or invalid URL.
- **Server Security**:
  - **Webhook Security**: Dedicated server-only module `src/lib/server/webhook-security.ts`.
  - **SSRF Protection**: Validate literal IPs and resolved hostnames; block private/local ranges; block automatic redirects or re-validate every redirect hop.
  - **Data Privacy**: `getIntegrationSettings` returns boolean flags for secrets, never the actual secret. 
  - **Encryption**: Secrets must be stored encrypted at rest (e.g., using `pgcrypto` via database migration).

## Refined Components
- `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/card.tsx`: Update with new border-radius scales.
- `src/components/AuthPage.tsx`: Perform visual validation after UI component changes to ensure the login scene remains polished.

## Technical Details
- **New Files**:
  - `src/lib/server/webhook-security.ts`: SSRF and redirect validation logic.
- **Modified Files**:
  - `src/styles.css`, `src/components/DashboardLayout.tsx`, `src/components/Dashboard.tsx`, `src/components/SearchPage.tsx`, `src/components/HistoryPage.tsx`, `src/components/SettingsPage.tsx`, `src/lib/scraper.functions.ts`, `src/components/ui-kit/PageHeader.tsx`.

## Verification
- Cross-viewport validation at `375px`, `768px`, `1024px`, and `1440px`.
- Manual verification of login scene animation and layout after UI kit updates.
