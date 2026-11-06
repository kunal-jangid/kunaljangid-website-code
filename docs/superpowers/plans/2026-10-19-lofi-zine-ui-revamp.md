# Lo-Fi Zine UI/UX Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the website UI/UX into a warm, tactile, and editorial "Lo-Fi Zine" aesthetic featuring Fraunces, Plus Jakarta Sans, and JetBrains Mono typography, dual light/dark themes (Warm Oatmeal & Espresso + Midnight Vinyl & Lavender), subtle analog paper noise texture, 1px tactile borders, and stamp-like hover interactions while maintaining the Spotify telemetry worker and project ledger.

**Architecture:** Update Google Fonts imports and global theme tokens in Astro and Tailwind v4 (`@theme` definitions and CSS variables). Build an analog SVG noise grain overlay pseudo-element. Refactor `Layout.astro` theme switcher script to handle the 4 presets with persistent `localStorage`. Reskin UI components (`ProjectCard.tsx`, `SpotifyStatus.tsx`, `TerminalCLI.tsx`, `GadgetsCard.tsx`, `FramesCard.tsx`, `index.astro`) to align with zine styling rules, Fraunces serif headings, and tactile stamp hover interactions.

**Tech Stack:** Astro 7, Tailwind CSS v4, React 19, Motion, Base UI, JetBrains Mono, Fraunces, Plus Jakarta Sans.

**Spec:** `docs/superpowers/specs/2026-10-19-lofi-zine-ui-design.md`

## Global Constraints
- Target Branch: `yet-another-UI-upgrade`
- Keep existing Spotify worker endpoint (`https://spotify-telemetry.kunaljangid2k3.workers.dev`) and server-side fetch in `src/pages/index.astro`.
- Avoid heavy drop-shadows or glow filters; use crisp 1px borders (`var(--border)`) and 6px-8px rounded corners.
- Maintain documentation integrity and keep existing functionality in terminal and modals working.

---

### Task 1: Typography & Theme Variables Setup in Styles and Layout

**Files:**
- Modify: `src/layouts/Layout.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: Google Fonts (`Fraunces:opsz,wght@9..144,400;600;700;700i`, `Plus+Jakarta+Sans:wght@400;500;600`, `JetBrains+Mono:wght@400;500;700`)
- Produces: CSS custom properties (`--bg-primary`, `--bg-surface`, `--text-main`, `--text-muted`, `--accent`, `--accent-sub`, `--border`) mapped to Tailwind utility tokens `--font-display`, `--font-sans`, `--font-mono`.

- [ ] **Step 1: Update Google Fonts in `src/layouts/Layout.astro`**
Replace existing fonts with Fraunces, Plus Jakarta Sans, and JetBrains Mono.

- [ ] **Step 2: Update theme engine presets in `src/layouts/Layout.astro`**
Define the 4 presets (Oatmeal Light, Oatmeal Dark, Vinyl Light, Vinyl Dark) and theme switcher cycle logic.

- [ ] **Step 3: Update `src/styles/global.css` with Tailwind v4 `@theme` mappings and noise overlay**
Configure `@theme` rules for `--font-display`, `--font-sans`, `--font-mono` and CSS variables for colors, plus the global SVG grain texture overlay.

- [ ] **Step 4: Verify build succeeds**
Run: `npx astro check; npm run build`
Expected: PASS with 0 build errors.

- [ ] **Step 5: Commit changes**
```bash
git add src/layouts/Layout.astro src/styles/global.css
git commit -m "feat(theme): configure lofi zine typography, themes, and noise overlay"
```

---

### Task 2: Masthead Header, Footer & Sticky Resume Restyling

**Files:**
- Modify: `src/layouts/Layout.astro`

**Interfaces:**
- Consumes: `--font-display`, `--text-main`, `--text-muted`, `--accent`, `--border`
- Produces: Editorial masthead with Fraunces branding, tactile theme switcher pill button, and zine footer stamps.

- [ ] **Step 1: Refactor masthead branding in `src/layouts/Layout.astro`**
Style `KUNAL JANGID` using Fraunces display font with subtle editorial italic flair or letter-spaced imprint, status pill, and tactile theme switcher badge.

- [ ] **Step 2: Restyle sticky resume button and footer links**
Use 1px crisp borders, notebook sticker radius (`rounded-lg`), tactile stamp hover effect (`hover:translate-x-[1px] hover:translate-y-[1px]`), and JetBrains Mono metadata.

- [ ] **Step 3: Verify build**
Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit changes**
```bash
git add src/layouts/Layout.astro
git commit -m "feat(layout): restyle masthead header, footer and sticky resume with zine vibe"
```

---

### Task 3: Editorial 3-Column Grid & Bento Sections in `index.astro`

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/BentoItem.astro`

**Interfaces:**
- Consumes: `Fraunces` heading styles, `JetBrains Mono` section prefixes (e.g. `01 // SYSTEM LOG`, `02 // SELECTED WORKS`)
- Produces: Zine editorial grid structure with tactile parchment panels and crisp rule borders.

- [ ] **Step 1: Update `src/components/BentoItem.astro`**
Replace blurred glassmorphism with tactile surface styling (`bg-surface`, `border border-brand-border`, `rounded-lg`).

- [ ] **Step 2: Update section titles and layout in `src/pages/index.astro`**
Convert section headers to editorial format using Fraunces headings paired with JetBrains Mono data tags (e.g. `01 // ABOUT ME`, `02 // SELECTED WORKS`, `03 // LIVE SIGNALS & AUXILIARY`).

- [ ] **Step 3: Update Bio & Highflyer Alert cards**
Style bio in Plus Jakarta Sans with crisp terracotta accent touches and notebook border treatment.

- [ ] **Step 4: Verify build**
Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit changes**
```bash
git add src/components/BentoItem.astro src/pages/index.astro
git commit -m "feat(home): convert 3-column layout to editorial zine spreads and tactile panels"
```

---

### Task 4: Project Ledger & ProjectCard Component Restyling

**Files:**
- Modify: `src/components/ProjectCard.tsx`

**Interfaces:**
- Consumes: Project markdown metadata (`title`, `subtitle`, `tags`, `friction`, `fix`, `payoff`)
- Produces: Editorial project cards with Fraunces project titles, JetBrains Mono stamps for tags, and clean Plus Jakarta Sans problem/solution blocks.

- [ ] **Step 1: Update typography and title in `src/components/ProjectCard.tsx`**
Render project titles with `font-display` (Fraunces), hover transitions to `--accent`, and stamp toggle button for expansion (`[ COLLAPSE ]` / `[ VIEW ENTRY ]`).

- [ ] **Step 2: Restyle tags and expandable problem/resolution/outcome sections**
Style tags as tactile stamps (instant inversion on hover or subtle border press), and structure expandable text with high-contrast readable type.

- [ ] **Step 3: Verify build**
Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit changes**
```bash
git add src/components/ProjectCard.tsx
git commit -m "feat(projects): restyle ProjectCard with Fraunces typography and tactile stamp tags"
```

---

### Task 5: Spotify Telemetry Worker Widget Restyling

**Files:**
- Modify: `src/components/SpotifyStatus.tsx`

**Interfaces:**
- Consumes: Worker endpoint `https://spotify-telemetry.kunaljangid2k3.workers.dev` and `initialData`
- Produces: Tactile vinyl/zine player widget with 1px border album sleeve, Fraunces song titles, terracotta/lavender EQ bars, and tactile hover link.

- [ ] **Step 1: Update SpotifyStatus widget layout and styling**
Apply tactile album border, paper surface background, Fraunces track title, Plus Jakarta Sans artist text, and theme accent EQ equalizer bars.

- [ ] **Step 2: Restyle recommended tracks list**
Ensure scroll area and track rows use tactile borders and hover treatments.

- [ ] **Step 3: Verify build**
Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit changes**
```bash
git add src/components/SpotifyStatus.tsx
git commit -m "feat(spotify): restyle spotify telemetry widget to lo-fi zine vinyl aesthetic"
```

---

### Task 6: Terminal CLI & Auxiliary Cards Reskinning (GadgetsCard & FramesCard)

**Files:**
- Modify: `src/components/TerminalCLI.tsx`
- Modify: `src/components/GadgetsCard.tsx`
- Modify: `src/components/FramesCard.tsx`

**Interfaces:**
- Consumes: Modal dialogs, image frames, and terminal command dispatcher.
- Produces: Consistent tactile paper/slate surface, crisp 1px borders, and Fraunces dialog titles.

- [ ] **Step 1: Update `src/components/TerminalCLI.tsx`**
Apply tactile 1px border, surface background, and crisp JetBrains Mono prompt styling without glow artifacts.

- [ ] **Step 2: Update `src/components/GadgetsCard.tsx` & `src/components/FramesCard.tsx`**
Update dialogs to use tactile borders, Fraunces titles, and notebook stamp previews.

- [ ] **Step 3: Run full verification build**
Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit changes**
```bash
git add src/components/TerminalCLI.tsx src/components/GadgetsCard.tsx src/components/FramesCard.tsx
git commit -m "feat(components): align terminal and auxiliary media cards with zine aesthetic"
```

---

### Task 7: Visual Verification, Dev Server Smoke Test & Polish

**Files:**
- Inspect: All updated pages and components
- Verify: Astro background dev server status and build outputs

- [ ] **Step 1: Run complete build and astro check**
Run: `npx astro check; npm run build`
Expected: Clean build with zero errors.

- [ ] **Step 2: Start background dev server and verify routes**
Run: `npx astro dev --background`
Check logs: `npx astro dev logs`

- [ ] **Step 3: Stop background dev server**
Run: `npx astro dev stop`

- [ ] **Step 4: Final commit and summary**
Commit any remaining tweaks.
