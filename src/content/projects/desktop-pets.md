---
title: Desktop Pets
subtitle: 01 // Frontline Personal Project // Win32 Interop & Systems Architecture
tags:
  - C# / WPF
  - Win32 API
  - FSM Physics
  - Aseprite JSON
friction: Standard productivity apps are lifeless, and traditional desktop widget overlays often block mouse clicks or suffer from massive CPU bloat.
fix: Engineered a lightweight, zero-allocation ~60Hz simulation loop using CompositionTarget.Rendering, combined with advanced Win32 interop hooks (WM_NCHITTEST) for true pixel-perfect click-through transparency across multi-monitor setups.
payoff: Delivers snappy, autonomous pixel-art companions (Bunny, Gorgon, Werewolf) that roam your screen with sub-1% CPU usage and full system tray management.
order: 1
---

Lightweight, interactive pixel-art companions for your Windows desktop featuring custom state-machine physics and transparent overlay rendering.