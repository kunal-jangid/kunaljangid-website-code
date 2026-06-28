# UI Performance Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve website loading speed, eliminate runtime Tailwind compilation bottlenecks, and optimize hover interactions for a snappy, premium UX.

**Architecture:** Compile Tailwind CSS statically to remove browser-side JIT scripting; optimize large images using automated Python scripts; and refactor sluggish, layout-blocking hover overlays in `index.html` into snappy CSS transitions.

**Tech Stack:** HTML5, CSS3, Tailwind CSS CLI, Node.js (v24), Python (v3)

## Global Constraints
* Maintain compatibility with all active themes (Cream, Tactile, Beet Red, Sage Kermit).
* Do not stage or commit changes unless specifically requested by the user.
* Ensure all tests and visual verifications run cleanly.

---

### Task 1: Decouple Theme Configurations in JS & Optimize Hover Transitions

We need to decouple the theme engine from the global `tailwind` object (since the JIT script is being removed) and refactor slow transitions and hover blocking-overlays in the Out of Office cards.

**Files:**
* Modify: `index.html`

**Interfaces:**
* Consumes: Existing HTML structure and Tailwind classes.
* Produces: Clean, modern card containers with permanent descriptive text cues and hardware-accelerated border highlight transitions.

#### Steps:
- [ ] **Step 1: Inspect the original code for transition durations and Out of Office cards**
  Ensure we target the correct line numbers for `#trigger-desk`, `#spotify-link`, `#trigger-gallery`, and the selfie `<img>` element.

- [ ] **Step 2: Update UI elements and Javascript in `index.html`**
  Modify `index.html` as follows:
  1. Replace the `tailwind.config` dependency in the theme script. Define the array locally as `themeConfig`.
  2. Simplify the selfie hover transition on the profile image (`title-selfie.png`). Add `loading="lazy"`.
  3. Modify the three Out of Office cards (Gadgets, Spotify/Sounds, and Frames/Gallery). Remove the absolute background overlays completely and add subtle, snappy border transitions and permanent hints.

  *Snippet for local `themeConfig` array:*
  ```javascript
  const themeConfig = [
      { name: 'cream', bg: '#EEE9DF', text: '#2B323F', border: '#111111', accent: '#C2441C' },
      { name: 'tactile', bg: '#090F15', text: '#F0E7D5', border: '#F0E7D5', accent: '#39FF14' },
      { name: 'beet_red', bg: '#7a1f3d', text: '#c7b63c', border: '#c7b63c', accent: '#f6e199' },
      { name: 'sage_kermit', bg: '#688763', text: '#0F2E15', border: '#0F2E15', accent: '#DAE2CB' }
  ];
  ```

  *Snippet for Selfie Image tag update:*
  ```html
  <img src="title-selfie.png" alt="Kunal Jangid : coolest person alive rn" loading="lazy"
      class="h-full w-auto object-contain select-none filter grayscale contrast-115 mix-blend-multiply dark:mix-blend-normal dark:grayscale-0 dark:brightness-105 dark:contrast-100 transition-transform duration-200 ease-out transform origin-bottom hover:scale-[1.08] relative hover:z-30 cursor-zoom-in">
  ```

  *Snippet for Out of Office cards update:*
  ```html
  <!-- Gadgets Card -->
  <div id="trigger-desk"
      class="relative overflow-hidden group border border-cream-border dark:border-tactile-border p-6 rounded cursor-pointer h-52 flex flex-col justify-between hover:border-brand-accent hover:-translate-y-0.5 transition-all duration-200">
      <div class="flex justify-between items-center w-full">
          <span class="text-[10px] font-mono opacity-40 uppercase">[ Gadget Setup ]</span>
          <span class="text-[10px] font-mono opacity-40 group-hover:opacity-100 transition-opacity duration-200 uppercase">[ Click to view ]</span>
      </div>
      <div>
          <h3 class="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">The Gadgets</h3>
          <p class="text-xs opacity-70 leading-relaxed">
              Pretty much a certified gear enthusiast. Love having a clean custom configurations, lover of
              deep linear mechanical keyboard acoustics, great books, and some might say, too many diecast models.
          </p>
      </div>
  </div>

  <!-- Sounds Card -->
  <div class="relative overflow-hidden group border border-cream-border dark:border-tactile-border p-6 rounded h-52 flex flex-col justify-between hover:border-brand-accent hover:-translate-y-0.5 transition-all duration-200">
      <div class="flex justify-between items-center w-full">
          <span class="text-[10px] font-mono opacity-40 uppercase">[ Spotify Sounds ]</span>
          <span class="text-[10px] font-mono opacity-40 group-hover:opacity-100 transition-opacity duration-200 uppercase">[ Click to listen ]</span>
      </div>
      <div class="w-full">
          <h3 class="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">The Sounds</h3>
          <div id="spotify-status" class="font-mono text-xs opacity-70 leading-relaxed w-full">
              <span class="opacity-50">• Currently Offline</span><br>Idle // Rotation List Enabled
          </div>
      </div>
      <a id="spotify-link"
          href="https://music.youtube.com/playlist?list=PLVGnlnIiWk4CPQyq7Z8hlWG2Xqx3dQP0R"
          target="_blank"
          class="absolute inset-0 opacity-0 cursor-pointer z-10">
      </a>
  </div>

  <!-- Gallery Card -->
  <div id="trigger-gallery"
      class="relative overflow-hidden group border border-cream-border dark:border-tactile-border p-6 rounded cursor-pointer h-52 flex flex-col justify-between hover:border-brand-accent hover:-translate-y-0.5 transition-all duration-200">
      <div class="flex justify-between items-center w-full">
          <span class="text-[10px] font-mono opacity-40 uppercase">[ Film Frames ]</span>
          <span class="text-[10px] font-mono opacity-40 group-hover:opacity-100 transition-opacity duration-200 uppercase">[ Click to view ]</span>
      </div>
      <div>
          <h3 class="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">The Frames</h3>
          <p class="text-xs opacity-70 leading-relaxed">
              Capturing industrial lines, geographic balances, and raw environmental illumination profiles
              found during transit using my phone, which is more often than not a Samsung lol.
          </p>
      </div>
  </div>
  ```

- [ ] **Step 3: Validate theme switching is still fully functional**
  Open `index.html` in a web browser, tap on the title "KUNAL JANGID", and verify that all themes (Cream, Tactile, Beet Red, Sage Kermit) toggle instantly and correctly. Verify hover states are snappy.

- [ ] **Step 4: Commit UI modifications**
  Run: `git add index.html`
  Run: `git commit -m "style: decouple theme config and refactor Out of Office hover transitions"`

---

### Task 2: Configure and Statically Compile Tailwind CSS

Set up a standard compiler pipeline using local Node.js and Tailwind CSS CLI to output a minified CSS file and replace the dynamic CDN loader in the header.

**Files:**
* Create: `tailwind.config.js`
* Create: `input.css`
* Modify: `index.html`
* Generate: `style.css`

**Interfaces:**
* Consumes: Tailwind utility configurations.
* Produces: Production-ready minified static `style.css` stylesheet containing all used utilities.

#### Steps:
- [ ] **Step 1: Create `tailwind.config.js`**
  Write a `tailwind.config.js` to map the custom theme variables and Lexend/Mono typography fonts accurately:
  ```javascript
  /** @type {import('tailwindcss').Config} */
  module.exports = {
    content: ["./index.html"],
    theme: {
      extend: {
        colors: {
          brand: {
            bg: 'var(--bg-color)',
            text: 'var(--text-color)',
            border: 'var(--border-color)',
            accent: 'var(--accent-color)'
          }
        },
        fontFamily: {
          sans: ['"Lexend"', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'monospace']
        }
      }
    },
    plugins: [],
  }
  ```

- [ ] **Step 2: Create `input.css`**
  Write an `input.css` in the project root importing default Tailwind modules:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

- [ ] **Step 3: Compile static CSS stylesheet**
  Run Tailwind compilation using the local Windows CMD command runner:
  `cmd /c "npx tailwindcss -i input.css -o style.css --minify"`
  Verify that `style.css` is successfully created in the root directory and contains utility classes (e.g., `.max-w-5xl`, `.font-mono`).

- [ ] **Step 4: Replace dynamic Tailwind CDN in `index.html`**
  Modify `index.html`:
  * Remove the `<script src="https://cdn.tailwindcss.com"></script>` tag.
  * Remove the entire inline dynamic `<script>tailwind.config = ... </script>` config block.
  * Add `<link rel="stylesheet" href="style.css">` inside `<head>`.

- [ ] **Step 5: Verify static stylesheet works**
  Open `index.html` locally and confirm all grid alignments, colors, active highlights, and custom fonts load instantly and correctly without the Tailwind JIT CDN.

- [ ] **Step 6: Commit static compilation assets**
  Run: `git add tailwind.config.js input.css style.css index.html`
  Run: `git commit -m "build: compile tailwind css statically and replace JIT play cdn"`

---

### Task 3: Compress Large Image Assets with Python

Install the `Pillow` library in python and execute an offline script to optimize our largest image files.

**Files:**
* Create: `scripts/compress_assets.py`
* Modify: `index.html`
* Optimize: `photography/shot8.jpg`
* Optimize: `desk-setup.png` -> `desk-setup.jpg`

**Interfaces:**
* Consumes: Native unoptimized images.
* Produces: Highly compressed WebP or JPEG equivalents.

#### Steps:
- [ ] **Step 1: Install the Pillow image library**
  Run: `pip install pillow`
  Expected: Successful installation of Pillow.

- [ ] **Step 2: Create `scripts/compress_assets.py`**
  Write an optimization script that compresses `photography/shot8.jpg` in place and converts `desk-setup.png` into a compressed JPEG `desk-setup.jpg` to save over 80% disk space:
  ```python
  import os
  from PIL import Image

  # 1. Compress shot8.jpg
  shot8_path = os.path.join('photography', 'shot8.jpg')
  if os.path.exists(shot8_path):
      img = Image.open(shot8_path)
      original_size = os.path.getsize(shot8_path) / 1024
      img.save(shot8_path, 'JPEG', quality=75, optimize=True)
      new_size = os.path.getsize(shot8_path) / 1024
      print(f"Compressed shot8.jpg: {original_size:.1f} KB -> {new_size:.1f} KB")

  # 2. Compress & Convert desk-setup.png to desk-setup.jpg
  desk_png_path = 'desk-setup.png'
  desk_jpg_path = 'desk-setup.jpg'
  if os.path.exists(desk_png_path):
      img = Image.open(desk_png_path)
      original_size = os.path.getsize(desk_png_path) / 1024
      # Convert RGBA to RGB if needed before saving as JPEG
      if img.mode in ('RGBA', 'LA'):
          background = Image.new('RGB', img.size, (255, 255, 255))
          background.paste(img, mask=img.split()[3])
          img = background
      img.save(desk_jpg_path, 'JPEG', quality=75, optimize=True)
      new_size = os.path.getsize(desk_jpg_path) / 1024
      print(f"Compressed and converted desk-setup.png: {original_size:.1f} KB -> {new_size:.1f} KB")
  ```

- [ ] **Step 3: Run the compression script**
  Run: `python scripts/compress_assets.py`
  Verify that both file sizes have successfully decreased.

- [ ] **Step 4: Update image references in `index.html`**
  Modify `index.html` to point `desk-setup.png` references to `desk-setup.jpg`:
  * Change `<img id="zoom-desk-img" src="desk-setup.png" ...>` to `<img id="zoom-desk-img" src="desk-setup.jpg" ...>`.

- [ ] **Step 5: Clean up old assets and test script**
  Verify the local browser loads the desk setup image correctly.
  Remove `desk-setup.png` from git tracking and delete it locally to keep the repository lean.
  Run: `git rm desk-setup.png`

- [ ] **Step 6: Commit compressed asset changes**
  Run: `git add photography/shot8.jpg desk-setup.jpg index.html scripts/compress_assets.py`
  Run: `git commit -m "perf: compress shot8.jpg and convert desk-setup.png to compressed jpg"`

---

### Task 4: Verify Optimization Metrics and End-to-End Operation

Run a full local audit of the compiled site to ensure no regressions occur and performance has significantly improved.

**Files:**
* Verify: Entire project workspace

#### Steps:
- [ ] **Step 1: Run the full photography indexer**
  Ensure we update the photos index list by running the indexer:
  Run: `python photography_indexer.py`
  Expected: Prints "✓ Dynamically indexed..." with zero errors.

- [ ] **Step 2: Check Git status and build logs**
  Ensure working directory is clean and we are operating on the correct branch.
  Run: `git status`
  Expected: On branch `UI-performance-improvement`, nothing to commit, working tree clean.

- [ ] **Step 3: Conduct local performance review**
  Open `index.html` and visually verify:
  1. No Tailwind runtime compiler console errors or warnings.
  2. Dynamic theme switching transitions immediately.
  3. Image zoom scales correctly.
  4. Gallery frames and desk modals zoom and pan perfectly.
  5. The site is incredibly fast and responsive.
