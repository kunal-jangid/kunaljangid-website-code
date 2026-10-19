# The Core Ledger User Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the homepage from a 3-column cyberpunk console into "The Core Ledger" user journey: an editorial, print-inspired flow featuring an expanded Hero Masthead with integrated Spotify telemetry, Zone 1 (Personal Projects First: Desktop Pets & Notesippy), Zone 2 (Heavy Systems Ledger: Enterprise Case Studies), and Zone 3 (The Tangible Life: Desk & Visual Frames), completely dropping the Terminal CLI and 3-column clutter.

**Architecture:** 
1. Re-index and categorize project content collections (`desktop-pets.md`, `notesippy.md`, enterprise projects).
2. Adapt `SpotifyStatus.tsx` to integrate directly into the Hero masthead banner.
3. Overhaul `index.astro` to render the clean sequential zones with breathing room.
4. Enhance `ProjectCard.tsx` with high-impact visual stamps and full-width case study disclosures.
5. Verify complete build and test dev server.

**Tech Stack:** Astro 7, React 19, Tailwind CSS v4, Motion, Fraunces, Plus Jakarta Sans, JetBrains Mono.

**Spec:** `docs/superpowers/specs/2026-10-20-core-ledger-journey-design.md`

## Global Constraints
- Branch: `yet-another-UI-upgrade`
- Keep Spotify Cloudflare worker endpoint intact (`https://spotify-telemetry.kunaljangid2k3.workers.dev`).
- Fully remove Terminal CLI component from active page.
- Ensure build succeeds cleanly (`npm run build`).

---

### Task 1: Re-order and Commit Project Content Collections

**Files:**
- Modify: `src/content/projects/desktop-pets.md`
- Modify: `src/content/projects/notesippy.md`
- Modify: `src/content/projects/legacy-ui-modernization.md`
- Modify: `src/content/projects/blotter-migration.md`
- Modify: `src/content/projects/high-throughput-archival.md`
- Modify: `src/content/projects/etd-position-transfer.md`

- [ ] **Step 1: Set explicit priority orders in markdown frontmatter**
Assign Desktop Pets (`order: 1`) and Notesippy (`order: 2`) as frontline personal projects, followed by enterprise systems (`order: 3, 4, 5, 6...`).

- [ ] **Step 2: Commit content updates to git**
```bash
git add src/content/projects/
git commit -m "feat(content): reorder projects to prioritize personal frontline projects and enterprise systems"
```

---

### Task 2: Adapt Spotify Widget for Hero Integration

**Files:**
- Modify: `src/components/SpotifyStatus.tsx`

- [ ] **Step 1: Add flexible layout support to `SpotifyStatus.tsx`**
Support a streamlined horizontal listening tape layout suitable for the Hero Masthead, featuring album artwork, live/last played indicator, track info, and mini EQ.

- [ ] **Step 2: Verify component builds cleanly**
Run: `cmd.exe /c "npm run build"`
Expected: PASS.

- [ ] **Step 3: Commit changes**
```bash
git add src/components/SpotifyStatus.tsx
git commit -m "feat(spotify): adapt SpotifyStatus for hero banner integration"
```

---

### Task 3: Overhaul `index.astro` to "The Core Ledger" Flow

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Remove TerminalCLI import and usage**
Delete terminal prompt module and imports from `index.astro`.

- [ ] **Step 2: Implement the Hero Masthead with integrated music telemetry and mission dispatch**
Render punchy identity, role, location, live signals, and hero Spotify widget.

- [ ] **Step 3: Implement Zone 1: The Frontline (Desktop Pets & Notesippy)**
Render prominent 2-column featured cards with direct tags and case study disclosures.

- [ ] **Step 4: Implement Zone 2: The Heavy Systems Ledger**
Render full-width editorial ledger list with index numbers and expandable Friction/Fix/Payoff sections.

- [ ] **Step 5: Implement Zone 3: The Tangible Life**
Render Visual Frames gallery, Workstation Desk setup, and OSTTRA Highflyer recognition.

- [ ] **Step 6: Verify build**
Run: `cmd.exe /c "npm run build"`
Expected: PASS.

- [ ] **Step 7: Commit changes**
```bash
git add src/pages/index.astro
git commit -m "feat(page): transform index.astro into The Core Ledger user journey"
```

---

### Task 4: Polish & Build Verification

**Files:**
- Verify: Full static build output
- Test: Responsive breakpoints & visual flow

- [ ] **Step 1: Run complete build**
Run: `cmd.exe /c "npm run build"`
Expected: 0 errors.

- [ ] **Step 2: Review git status and log**
Verify all changes are committed cleanly on `yet-another-UI-upgrade`.
