# Design Spec: Private Photo Upload Portal to Local Desktop via Cloudflare Tunnel

**Date:** 2026-10-15  
**Author:** Antigravity Pair Programmer & Kunal Jangid  
**Status:** Approved  

---

## 1. Overview & Objective

Provide a private, zero-subscription photo upload portal at `kunaljangid.com/upload` that allows Kunal to upload photos securely from any device (e.g. corporate laptop, mobile phone, browser) directly to his local Windows desktop storage without paying for Cloudflare R2 subscriptions or third-party cloud storage.

The solution pairs:
1. An Astro frontend portal at `src/pages/upload.astro` with an interactive React component `src/components/PhotoUploader.tsx`.
2. Cloudflare Pages Functions (`functions/api/upload.ts` and `functions/api/status.ts`) acting as an authenticated proxy and live health-check interface.
3. A local zero-dependency Node.js desktop receiver daemon (`scripts/desktop-receiver.mjs`) running on Kunal's desktop, exposed via a free Cloudflare Tunnel (`cloudflared`).
4. Detailed setup and auto-start instructions in `DESKTOP_SETUP.md`.

---

## 2. Architecture & Data Flow

```
+------------------------------------+
| Work Laptop / Browser / Any Device |
+------------------------------------+
                  |
                  | 1. POST /api/upload
                  |    - Authorization: Bearer <UPLOAD_SECRET>
                  |    - FormData (file, metadata)
                  v
+------------------------------------+
| Cloudflare Pages Edge Function     |
| (/functions/api/upload.ts)         |
+------------------------------------+
  1. Check Bearer Token against env.UPLOAD_SECRET
  2. Validate MIME type (JPEG, PNG, WEBP, HEIC, AVIF) & Size (<=25MB)
  3. Stream forward via HTTPS to Cloudflare Tunnel
                  |
                  v
+------------------------------------+
| Free Cloudflare Tunnel             |
| (cloudflared on local Windows PC)  |
+------------------------------------+
                  |
                  | Proxies HTTPS -> http://localhost:7432
                  v
+------------------------------------+
| Desktop Receiver Daemon            |
| (scripts/desktop-receiver.mjs)     |
+------------------------------------+
  1. Verifies Bearer Token
  2. Sanitizes filename (timestamp-uuid-slug.ext)
  3. Streams chunks straight to disk: D:\Photos\Uploads\...
```

---

## 3. Detailed Component Specifications

### 3.1 Backend: Cloudflare Pages Functions

#### `functions/api/upload.ts`
- **Method:** `POST`
- **Authentication:**
  - Header: `Authorization: Bearer <TOKEN>`
  - Compare with `context.env.UPLOAD_SECRET`.
  - Immediate `401 Unauthorized` response with JSON `{ success: false, error: "Unauthorized" }` if invalid.
- **Validation:**
  - MIME whitelist: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/avif`.
  - Maximum file size: `25 * 1024 * 1024` bytes (25MB).
  - Return `400 Bad Request` if invalid MIME or oversized.
- **Tunnel Proxying:**
  - Target URL: `context.env.RECEIVER_TUNNEL_URL + "/receive"`
  - Forward incoming stream with headers (`Authorization`, `Content-Type`, `X-Original-Filename`).
  - Timeout: 30 seconds.
  - If fetch fails or receiver times out, catch error and return `503 Service Unavailable`:
    `{ success: false, error: "Desktop receiver is offline or unreachable. Please ensure your PC is on and the receiver daemon/tunnel is active." }`
  - Success returns: `{ success: true, filename: "...", size: 12345 }`

#### `functions/api/status.ts`
- **Method:** `GET`
- **Purpose:** Quick health check on the desktop receiver for live telemetry display.
- **Behavior:**
  - Performs 3-second ping to `${context.env.RECEIVER_TUNNEL_URL}/health`.
  - Returns `200 OK` with JSON `{ online: true }` if 200 returned, else `{ online: false }`.

---

### 3.2 Desktop Receiver Daemon: `scripts/desktop-receiver.mjs`

- **Runtime:** Native Node.js (v18+) without third-party dependencies (`node:http`, `node:fs`, `node:path`, `node:crypto`).
- **Configuration:** Reads environment variables with defaults:
  - `PORT`: default `7432`
  - `STORAGE_DIR`: default `D:\Photos\Uploads` (created automatically if missing)
  - `RECEIVE_SECRET`: required secret matching `UPLOAD_SECRET`
- **Routes:**
  - `GET /health`: Returns `{ status: "ok", timestamp: ISO }`.
  - `POST /receive`:
    - Checks `Authorization: Bearer <RECEIVE_SECRET>`.
    - Extracts filename from `X-Original-Filename` or form boundaries.
    - Sanitizes filename to prevent directory traversal: generates `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${cleanSlug}.${ext}`.
    - Pipes directly into `fs.createWriteStream(targetPath)`.
    - Logs formatted event: `[2026-10-15 20:30:15] SAVED: IMG_1234.HEIC (14.2 MB) -> D:\Photos\Uploads\...`
    - Returns `{ success: true, savedAs: filename, size: bytes }`.

---

### 3.3 Frontend UI: `src/pages/upload.astro` & `src/components/PhotoUploader.tsx`

#### `src/pages/upload.astro`
- Page Title: `PORTAL // SECURE PHOTO UPLOAD`
- SEO: Robots meta tag `<meta name="robots" content="noindex, nofollow" />` in head.
- Inherits `Layout.astro` theme variables (`--bg-color`, `--text-color`, `--border-color`, `--accent-color`).
- Mounts `<PhotoUploader client:load />`.

#### `src/components/PhotoUploader.tsx`
- **Telemetry Bar:**
  - Displays desktop receiver status: `RECEIVER: [ONLINE]` (pulsing accent) or `RECEIVER: [OFFLINE]` (warning banner).
  - Refresh button to manually re-probe status.
- **Passphrase Management:**
  - Masked input with reveal eye icon.
  - "Remember passphrase on this device" checkbox storing key in `localStorage` (`portfolio_upload_auth_token`).
  - Pre-populates on subsequent visits.
- **Dropzone:**
  - Drag-over highlight with tactile border and glow (`bklit-glow`).
  - File picker button supporting multiple files (`image/jpeg,image/png,image/webp,image/heic,image/avif`).
  - Instant client-side validation against 25MB limit.
- **Staging & Previews:**
  - Image thumbnails for standard browser image formats (`URL.createObjectURL`).
  - High-tech badge representation for HEIC files.
  - File name, human-readable file size (`XX.X MB`), and delete button for staged items.
- **Queue & Concurrency:**
  - Concurrency limiter (max 2 uploads in flight).
  - Overall progress bar: `Uploaded X / Y (Z%)`.
  - Item status indicators: `QUEUED`, `UPLOADING...`, `SAVED`, `FAILED (reason)`.
  - Action buttons: `[ TRANSMIT ALL PAYLOADS ]` and `[ CLEAR COMPLETED ]`.

---

### 3.4 Documentation & Sync: `DESKTOP_SETUP.md`

Comprehensive guide explaining:
1. Prerequisites (Node.js & `cloudflared`).
2. Running the receiver daemon manually (`node scripts/desktop-receiver.mjs`).
3. Launching Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:7432`).
4. Setting Cloudflare Pages environment variables (`UPLOAD_SECRET`, `RECEIVER_TUNNEL_URL`).
5. Setting up auto-start on Windows startup (using Windows Task Scheduler or PM2).

---

## 4. Verification & Testing Plan

1. **Local Build Check:** Run `npm run build` or `astro check` to ensure TypeScript and Astro pages compile cleanly without errors.
2. **Local Receiver Test:** Start `scripts/desktop-receiver.mjs` locally, verify `/health` returns `{ status: "ok" }`, and test upload via `curl` with Bearer auth.
3. **End-to-End Simulation:** Test frontend status query and upload handling through local Pages dev or direct tunnel simulation.
4. **Security & Boundary Verification:**
   - Test invalid secret -> verifies `401 Unauthorized`.
   - Test invalid MIME / file types -> verifies `400 Bad Request`.
   - Test filename sanitization (paths with `../` or malformed chars) -> verifies safe storage.
   - Verify `<meta name="robots" content="noindex, nofollow" />` is present in HTML output.
