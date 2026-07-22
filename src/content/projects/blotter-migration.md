---
title: Proprietary Blotter Migration to AG-Grid
subtitle: 03 // Enterprise System // UI Modernization
tags:
  - AG-Grid
  - Custom Cell Renderers
  - State Management
  - Performance Optimization
friction: The platform relied on a restrictive, undocumented in-house library (smart-blotter) that caused rendering bottlenecks during high-volume trade sessions.
fix: Led the complete decommissioning of the legacy library, migrating 5-7 major application screens to a standardized ag-grid architecture with custom cell renderers and persistent local-storage state.
payoff: Unlocked advanced multi-sort and fuzzy-search features requested by major clearing firms while stripping thousands of lines of fragile, custom UI code.
order: 4
---

Decommissioned standard blotters for clearing firms, shifting layout setups and configurations to optimized AG-Grid cells with native memory buffering.
