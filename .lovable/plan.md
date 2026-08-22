# Plan: ScanRadar Login Refinement Stage 2

Refine the login interface to improve contrast, layout, and visual sophistication while preserving existing authentication logic and core animations.

## User Review Required

> [!IMPORTANT]
> - The layout will shift to a 55/45 split (Dark/Light).
> - Colors are being updated to specific hex codes for better accessibility and professional look.

## Proposed Changes

### 1. Styling & Colors
- Update `src/styles.css` with the new color palette:
  - Background (Right): `#F5F7FA`
  - Text (Right): `#0B1220` (Title), `#526174` (Secondary)
  - Card: `#FFFFFF`
  - Inputs: `#F3F6FA`
  - Borders: `#D5DEE9`
  - Left Side Text: `#F6F8FB`
  - Left Side Subtitle: `#9FB1C7`
  - Accent Blue: `#0284C7`
  - Success Green: `#22C55E`

### 2. Animated Radar Refinement
- Update `src/components/AnimatedRadarLogo.tsx`:
  - Increase the number of concentric circles and grid sophistication.
  - Ensure only the scanning beam rotates.
  - Fix the center origin of the rotation.
  - Enhance the "blip" pulse effect for detected points.

### 3. Hero Section (Left Side - 55%)
- Update `src/components/AuthPage.tsx`:
  - Adjust width to 55% on desktop.
  - Align content in a consistent container.
  - Update Title: "Encontre empresas antes que a oportunidade passe." (Max-width 520-580px).
  - Update Subtitle: "Mapeie negócios locais, identifique presença digital e transforme dados públicos em prospecção organizada."
  - Add three benefit items:
    - Busca por nicho e localização
    - Classificação de presença digital
    - Resultados prontos para ação
  - Reduce vertical spacing between the radar and the text.

### 4. Authentication Panel (Right Side - 45%)
- Update `src/components/AuthPage.tsx`:
  - Adjust width to 45% on desktop.
  - Set background to `#F5F7FA`.
  - Align logo, title, and form in a single column.
  - Refine the Card: Max-width 440px, white background, soft border, and discrete shadow.
  - Primary Button: Background `#0284C7`, white text, height 50px.
  - Google Button: White background, dark text, visible border.
  - Fix the "OR" divisor lines to not overlap the text.

### 5. Responsive Design
- Ensure mobile layout (single column) features a compact radar at the top followed by the form.
- Validate layout at 375, 768, 1024, and 1440px.

## Technical Details
- Using Tailwind CSS v4 custom properties for colors.
- SVG animations for the radar.
- Lucide icons for benefits and form UI.
- Preservation of Supabase auth hooks and redirection logic.
