# UI Performance Improvement Design Spec

* **Date:** 2026-06-21
* **Author:** Gemini CLI
* **Status:** Draft / Pending Review
* **Target Branch:** `UI-performance-improvement`

---

## 1. Overview & Context

The goal of this project is to optimize both the perceived and technical performance of kunaljangid.com. While the site is a clean and beautifully structured personal portal, several bottlenecks prevent it from being as fast and snappy as possible:
* **Perceived Lag on Hovers:** Several transitions (particularly the `hover:scale-150` scale transform on the header selfie image) and opacity cards under the "Out of Office" section feel sluggish and visually overdone.
* **Tailwind JIT Play CDN Compiler:** The site loads `https://cdn.tailwindcss.com` directly in the header. This dynamically compiles CSS classes at runtime, triggering heavy main-thread scripting overhead and style recalculations upon first paint and interaction.
* **Unoptimized Image Assets:** The photography asset `shot8.jpg` is **1.67 MB**, and `desk-setup.png` is **568.5 KB**. These uncompressed images slow down loading speeds over slower connections.

---

## 2. Selected Approach: Snappy, Tactile & Refined (Approach 1)

We will execute Approach 1, which balances refined UI/UX design changes with modern static build compilation and asset optimization techniques.

### Core Changes

#### A. Interactive Hover & Animation Adjustments (UI/UX)
1. **Title Selfie Zoom Refinement:**
   * **Old:** Scale of `150%` with a slow 500ms transition (`hover:scale-150 transition-all duration-500 ease-out origin-bottom`).
   * **New:** Scale of `108%` with a snappy 200ms transform transition (`hover:scale-[1.08] transition-transform duration-200 ease-out origin-bottom`).
2. **Out of Office Card Interactions:**
   * **Old:** Fully-opaque block overlays appearing on hover, hiding card text and creating visual heavy-handedness.
   * **New:**
     * Remove the full-card text-blocking overlays entirely.
     * Make the card container itself a clear interactive target: on hover, the border dynamically highlights to the active theme's accent color (`hover:border-brand-accent`) with a subtle translate-y rise (`hover:-translate-y-0.5`).
     * Keep the helper cue text (e.g., `[ Tap to view ]` on mobile, `[ Click to view ]` on desktop) permanently visible at a low opacity, rising to full opacity on hover/active.
3. **Global Transition Optimization:**
   * Optimize element transitions to use targeted properties (e.g., `transition-transform`, `transition-colors`) instead of `transition-all`, reducing durations down to a snappier 150ms/200ms.

#### B. Technical Performance & Asset Optimizations
1. **Static Tailwind CSS Compilation:**
   * We will move away from the runtime JIT CDN compiler.
   * Define `tailwind.config.js` to preserve the dynamic Theme Matrix structure and custom theme configurations.
   * Define a standard `input.css` stylesheet import:
     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```
   * Compile a production-ready, minified static stylesheet `style.css` using the Tailwind CLI:
     `npx tailwindcss -i input.css -o style.css --minify`
   * Update `index.html` to load `style.css` statically, removing `<script src="https://cdn.tailwindcss.com"></script>`.
2. **Image Asset Compression:**
   * Compress and optimize the heavy image assets using Python's `Pillow` library:
     * `photography/shot8.jpg` (1.67 MB) compressed to `< 150 KB`.
     * `desk-setup.png` (568.5 KB) compressed to `< 150 KB`.
   * Add native `loading="lazy"` attributes on non-critical images (such as `title-selfie.png`) to maximize initial page loading speed.

---

## 3. Architecture & File Structure

No external libraries are added to the production runtime. All layout changes are done in-place.

```
D:\projects\kunaljangid.com\kunaljangid-website-code\
├── tailwind.config.js                 # New Tailwind configuration file
├── input.css                          # New Tailwind input entry point
├── style.css                          # Generated, minified production CSS stylesheet
├── index.html                         # Updated html structure with static style sheet & optimized animations
├── desk-setup.png                     # Optimized (compressed)
├── title-selfie.png                   # Loaded lazily
└── photography/
    ├── shot8.jpg                      # Optimized (compressed)
    └── ... (other photos remain)
```

---

## 4. Testing & Verification Plan

1. **Local Rendering Verification:**
   * Open `index.html` locally to ensure the layout matches perfectly and there are no regressions in styles, borders, grid alignments, or text colors across different themes (Cream, Tactile, Beet Red, Sage Kermit).
2. **Interactive Animation Verification:**
   * Validate that hovering over the header selfie zooms smoothly to 108% without lag.
   * Verify that the Out of Office cards display all details clearly and highlight elegantly on hover.
3. **Responsive Verification:**
   * Validate that layout margins and touch triggers work correctly on mobile, tablet, and desktop views.
4. **Asset Optimization Verification:**
   * Confirm file sizes for `photography/shot8.jpg` and `desk-setup.png` are reduced by >85% while preserving visual clarity.
   * Verify console is clean and has no Tailwind warnings.
