# Design Specification: "The Core Ledger" User Journey Revamp

- **Status**: Approved
- **Branch**: `yet-another-UI-upgrade`
- **Date**: 2026-10-20

## 1. Executive Summary & Vision

The site transitions from a dense, 3-column cyberpunk console layout into **"The Core Ledger"**: a spacious, editorial, print-inspired user journey designed to highlight Kunal's identity, expressive personal systems engineering, and heavy enterprise fintech impact with natural breathing room.

### Key Conceptual Shifts
1. **Hero Masthead with Integrated Listening Telemetry**: Punchy editorial cover masthead combining identity, engineering thesis, and integrated Spotify music telemetry directly in the header zone.
2. **Zone 1 (The Frontline - Personal Projects First)**: Prominent dual-card showcase for *Desktop Pets* and *Notesippy* right below the hero.
3. **Zone 2 (The Heavy Systems Ledger - Enterprise Impact)**: Expansive case studies for OSTTRA enterprise architectures and quantitative systems (Friction, Fix, Payoff) with room to breathe.
4. **Zone 3 (The Tangible Life)**: Desk Setup & Gear modal, Visual Frames photo journal, and OSTTRA Highflyer recognition cleanly grouped at the footer of the journey.
5. **Dropped Completely**:
   - Interactive Terminal CLI / shell prompt removed.
   - Rigid 3-column text wall removed.

---

## 2. Layout Structure & Zones

### Header & Hero Masthead
- **Identity**: `Kunal Jangid` in Fraunces italic serif + tactile theme switcher button (cycling through the 4 Lo-Fi Zine presets).
- **Sub-masthead**: `SYSTEMS SOFTWARE ENGINEER // GURUGRAM, IN`, live status ticker (`SIGNAL: ONLINE`, clock, ping).
- **Mission Statement**:
  > *"I architect high-throughput financial platforms and untangle multi-generational legacy architectures at OSTTRA. Focused on complex state machines, strict regulatory business logic, and low-allocation systems."*
- **Hero Spotify Audio Player**: Clean, tactile horizontal music sleeve showing live or last played track seamlessly integrated without cluttering the page body.

### Zone 1: The Frontline (Expressive Personal Projects)
- Dual-column grid featuring:
  1. **Desktop Pets**: C#/WPF, Win32 interop (`WM_NCHITTEST`), zero-allocation 60Hz physics loop, pixel-art companions roaming multi-monitor setups.
  2. **Notesippy**: React Native / Expo, synchronous MMKV, Android foreground service (`NowBarService`), and Samsung One UI live capsule widgets.
- Styled as tactile featured entry cards with direct tag stamps, prominent Fraunces titles, and immediate expandable problem/solution engineering stories.

### Zone 2: The Heavy Systems Ledger (Enterprise Case Studies)
- Expansive single-column ledger list sorted by architectural importance:
  - `Legacy UI Modernization` (Angular 20 / micro-frontends)
  - `Proprietary Blotter Migration` (AG-Grid, multi-million cell updates)
  - `High-Throughput Archival` (500M+ trade records, partitioned storage)
  - `ETD Position Transfer App` (regulatory execution & state machines)
  - Followed by quantitative analytics and research systems.
- Every entry features clean numeric indexation (`01 //`, `02 //`), Fraunces serif headlines, tactile category pills, and full-width `Friction -> Fix -> Payoff` breakdown on click.

### Zone 3: The Tangible Life (Craft, Desk & Frames)
- A balanced 3-part tactile grid at the bottom:
  1. **The Frames**: Auto-playing 35mm film / digital photography gallery modal.
  2. **Desk & Hardware**: Workstation setup inspection modal (mechanical keyboards, custom configurations).
  3. **Highflyer Award**: OSTTRA Q1 2026 performance recognition badge.

---

## 3. Component & File Changes
- **`src/content/projects/desktop-pets.md` & `src/content/projects/notesippy.md`**: Update order/category metadata so they are indexed in Zone 1.
- **`src/pages/index.astro`**: Rewrite page layout from 3-column grid to the 3 distinct sequential zones with integrated Hero audio telemetry.
- **`src/components/SpotifyStatus.tsx`**: Add a compact hero-mode variant to render elegantly in the masthead/hero dispatch area.
- **`src/components/ProjectCard.tsx`**: Update layout to support both featured card format and expansive horizontal ledger format.
