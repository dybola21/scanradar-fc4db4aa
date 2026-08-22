# Plan: ScanRadar Login Refinement Stage 2 (Revised)

Refine the login interface to improve contrast, layout, and visual sophistication while preserving existing authentication logic and core animations. This revision addresses technical concerns regarding global styles, component reuse, and accessibility.

## Proposed Changes

### 1. Styling & Colors (Scoped)
- Instead of global variables in `src/styles.css`, define specific color tokens within `src/components/AuthPage.tsx` using Tailwind's arbitrary values or local CSS modules to prevent side effects on the dashboard.
- Palette:
  - Right background: `#F5F7FA`
  - Right Title: `#0B1220`
  - Right Secondary text: `#526174`
  - Card: `#FFFFFF`
  - Inputs: `#F3F6FA`
  - Borders: `#D5DEE9`
  - Left Text: `#F6F8FB`
  - Left Subtitle: `#9FB1C7`
  - **Accent Blue: `#0369A1`** (Updated for WCAG AA compliance with white text)
  - Success Green: `#22C55E` (Used only for points)

### 2. New Component: `AnimatedRadarScene.tsx`
- Create a new component for the hero radar to avoid modifying the compact `AnimatedRadarLogo.tsx` used in sidebars.
- Features:
  - 5+ concentric circles, fine grid lines.
  - Rotating scanning beam (centralized origin).
  - Discrete pulsing points.
  - Full support for `prefers-reduced-motion`.

### 3. Hero Section (Left Side - 55%)
- Update `src/components/AuthPage.tsx`:
  - Split layout: 55% Dark (Left) / 45% Light (Right).
  - Title: "Encontre empresas antes que a oportunidade passe." (Max-width: 520-580px, no manual breaks).
  - Subtitle: "Mapeie negócios locais, identifique presença digital e transforme dados públicos em prospecção organizada."
  - Add three benefit items with icons:
    - Busca por nicho e localização
    - Classificação de presença digital
    - Resultados prontos para ação
  - Reduce vertical spacing between the radar and text.

### 4. Authentication Panel (Right Side - 45%)
- Update `src/components/AuthPage.tsx`:
  - Background: `#F5F7FA`.
  - Single column alignment for logo, header, and form.
  - Card refinement: White, max-width 440px, soft border, discrete shadow.
  - **Primary Button**: `#0369A1` background, white text, 50px height, clear states (hover, focus, disabled, loading).
  - **Google Button**: White background, dark text, visible border, aligned icon.
  - **Divisor**: Fix lines to stop before the text "ou continue com".

### 5. Technical Validations & Accessibility
- **WCAG AA**: Ensure contrast ratios for all text and interactive elements.
- **Form States**: Implement visual feedback for loading, disabled, and errors.
- **Preservation**: Keep all existing Supabase logic, email/Google login, password recovery, and sign-up flows.
- **Navigation**: Verify keyboard accessibility (tab index, focus states).
- **Responsive**: Compact radar for mobile, single column flow. Validate at 375px, 768px, 1024px, and 1440px.

## Technical Details
- Scoped CSS/Tailwind to `AuthPage.tsx`.
- SVG-based `AnimatedRadarScene`.
- Lucide React for iconography.
- Framer Motion or CSS transitions for state changes.
