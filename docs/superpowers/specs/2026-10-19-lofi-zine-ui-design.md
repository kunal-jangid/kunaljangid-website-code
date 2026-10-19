# Design Specification: KunalJangid.com Lo-Fi Zine UI/UX Revamp

- **Status**: Approved
- **Branch**: `yet-another-UI-upgrade`
- **Date**: 2026-10-19

## 1. Overview & Aesthetic Vision

The goal of this revamp is to transition KunalJangid.com from a dark cyberpunk terminal aesthetic into a warm, tactile, and editorial **Lo-Fi Zine Vibe**. The site balances raw editorial charm (reminiscent of indie print zines and quiet late-night workspaces) with rigorous systems engineer precision.

The 3-column dense editorial ledger architecture will be retained, but refactored to use tactile borders, paper noise overlays, physical stamp hover dynamics, and distinct editorial typography.

---

## 2. Typography

We adopt three deliberate font families via Google Fonts:

1. **Display & Headings**: `Fraunces` (weights 400, 600, 700 italic)
   - Used for the primary masthead title, section headers (e.g. *Selected Works*, *System Specs*), project titles, and modal headers.
   - Provides organic optical curve, warm editorial serif vibe, and classic print magazine authority.
2. **Body & Primary UI**: `Plus Jakarta Sans` (weights 400, 500, 600)
   - Used for bio/about paragraphs, modal body copy, friction/fix/payoff explanations, and general UI descriptions.
   - Provides high legibility and geometric warmth.
3. **Telemetry & Code**: `JetBrains Mono` (weights 400, 500)
   - Used for telemetry indicators, live clock, latency, terminal prompt, tags/badges, and structured metadata prefixes (e.g., `01 // ENTERPRISE SYSTEM`).

---

## 3. Color Palettes & Theme Engine

We introduce 4 switchable theme presets across two distinct artistic moods:

### Theme Option A: "Warm Oatmeal & Espresso" (Default Chill Theme)

#### Light Mode: Paper Zine
- Background (`--bg-primary`): `#F7F4E9`
- Surface (`--bg-surface`): `#EEE9D8`
- Text Main (`--text-main`): `#2B2623`
- Text Muted (`--text-muted`): `#6E645F`
- Accent Primary (`--accent`): `#C85A32`
- Accent Secondary (`--accent-sub`): `#5B7065`
- Borders (`--border`): `#D8D0BC`

#### Dark Mode: Late-Night Desk
- Background (`--bg-primary`): `#181615`
- Surface (`--bg-surface`): `#221F1E`
- Text Main (`--text-main`): `#F4F0EA`
- Text Muted (`--text-muted`): `#A39B93`
- Accent Primary (`--accent`): `#E07A5F`
- Accent Secondary (`--accent-sub`): `#81B29A`
- Borders (`--border`): `#332E2C`

---

### Theme Option B: "Midnight Vinyl & Lavender" (Alternative Mood)

#### Light Mode: Soft Paper & Indigo
- Background (`--bg-primary`): `#F2F4F7`
- Surface (`--bg-surface`): `#E4E8EE`
- Text Main (`--text-main`): `#1E222B`
- Text Muted (`--text-muted`): `#5C6475`
- Accent Primary (`--accent`): `#7E57C2`
- Accent Secondary (`--accent-sub`): `#26A69A`
- Borders (`--border`): `#D1D7E0`

#### Dark Mode: Midnight Studio
- Background (`--bg-primary`): `#111318`
- Surface (`--bg-surface`): `#1A1D24`
- Text Main (`--text-main`): `#ECEFF4`
- Text Muted (`--text-muted`): `#9099A8`
- Accent Primary (`--accent`): `#B39DDB`
- Accent Secondary (`--accent-sub`): `#4DB6AC`
- Borders (`--border`): `#2A2F3B`

---

## 4. UI & Structural Design Rules

1. **Grain & Noise Texture**:
   - A global SVG-based noise grain overlay applied via fixed `body::before` with pointer-events disabled at `opacity: 0.035`.
   - Subtle paper tooth eliminates flat digital gloss.
2. **Crisp 1px Borders & Tactile Radius**:
   - Discard neon glowing boxes and blur-heavy drop shadows.
   - Use crisp `1px solid var(--border)` with `border-radius: 6px` or `8px` for notebook sticker / print cut-out feeling.
3. **Interactive Elements (The "Stamp Press" Effect)**:
   - Buttons, tags, and theme toggles react with a tactile shift: either an instant color inversion or a subtle 1px translate down-right like a rubber stamp press (`transform: translate(1px, 1px)`).
4. **Editorial Headers & JetBrains Mono Data Tags**:
   - Section headers styled with italicized/display `Fraunces` alongside crisp monospace status badges (e.g., `01 // ENTERPRISE SYSTEM`).
5. **Spotify Telemetry Widget**:
   - Preserve existing Cloudflare worker integration (`https://spotify-telemetry.kunaljangid2k3.workers.dev`).
   - Retain server-side pre-fetch fallback in `index.astro`.
   - Style with 1px border album frame, subtle paper-surface background, Fraunces track title, and terracotta/lavender EQ bars.
6. **Terminal CLI & Auxiliary Cards**:
   - Retain full functionality (interactive terminal directives, Desk Setup modal, Photo Frames gallery modal).
   - Reskin cards to fit the new tactile surface, border, and typography scheme.

---

## 5. Implementation Scope

1. **`src/layouts/Layout.astro`**:
   - Replace font imports with `Fraunces`, `Plus Jakarta Sans`, and `JetBrains Mono`.
   - Update theme configuration to include all 4 presets.
   - Refactor header masthead and footer styling.
   - Embed global SVG grain noise overlay.
2. **`src/styles/global.css`**:
   - Define CSS variables for `--bg-primary`, `--bg-surface`, `--text-main`, `--text-muted`, `--accent`, `--accent-sub`, `--border`.
   - Configure Tailwind v4 `@theme` bindings for font families and colors.
   - Add tactile stamp and border utility classes.
3. **`src/pages/index.astro`**:
   - Update column headers and containers to reflect the editorial zine structure.
   - Re-index project nodes with numbered metadata (`01 // ...`, `02 // ...`).
4. **`src/components/ProjectCard.tsx`**:
   - Update project title font to `Fraunces`, tags to tactile stamp badges, and details section to clean typography.
5. **`src/components/SpotifyStatus.tsx`**:
   - Apply tactile zine styling, rounded corners, Fraunces song titles, and matching accent EQ bars.
6. **`src/components/TerminalCLI.tsx`, `GadgetsCard.tsx`, `FramesCard.tsx`, `BentoItem.astro`**:
   - Align borders, surface colors, and typography with the new design tokens.
