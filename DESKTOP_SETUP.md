# Private Desktop Photo Receiver Setup Guide

This guide walks you through setting up and running the local desktop receiver daemon and exposing it securely via Cloudflare Tunnel so you can upload photos directly from `kunaljangid.com/upload` to your local desktop hard drive (`D:\Photos\Uploads`).

---

## Architecture Overview

```text
+-----------------------------+
| Any Device / Mobile Browser |
| (kunaljangid.com/upload)    |
+-----------------------------+
               |
               | 1. POST /api/upload (Bearer Auth + Photo Payload)
               v
+-----------------------------+
| Cloudflare Pages Functions  |
| (/functions/api/upload.ts)  |
+-----------------------------+
               |
               | 2. Proxies HTTPS request to Tunnel
               v
+-----------------------------+
| Cloudflare Tunnel           |
| (cloudflared on Windows PC) |
+-----------------------------+
               |
               | 3. Local forward to http://localhost:7432
               v
+-----------------------------+
| Desktop Receiver Daemon     |
| (desktop-receiver.mjs)      |
+-----------------------------+
               |
               | 4. Saves to local disk
               v
+-----------------------------+
| D:\Photos\Uploads           |
+-----------------------------+
```

---

## Prerequisites

1. **Windows 10/11 Desktop** with Node.js 18+ or 22+ installed (`node -v`).
2. **Cloudflare Account** managing your domain (`kunaljangid.com`).
3. Destination folder on disk (e.g., `D:\Photos\Uploads`).

---

## Step 1: Install `cloudflared` on Windows

Cloudflare Tunnel (`cloudflared`) creates a secure, encrypted outbound tunnel from your desktop to Cloudflare's edge network without requiring open router ports or static public IPs.

### Option A: Using Windows Package Manager (winget - Recommended)

Open **PowerShell** (as Administrator or regular user) and run:

```powershell
winget install --id Cloudflare.cloudflared
```

### Option B: Manual Download

Download `cloudflared-windows-amd64.exe` from the [Cloudflare GitHub Releases](https://github.com/cloudflare/cloudflared/releases), rename it to `cloudflared.exe`, and place it in your `PATH` (e.g., `C:\Windows\System32` or a dedicated tools folder).

Verify the installation:

```powershell
cloudflared --version
```

---

## Step 2: Configure Environment Variables

1. Copy `.env.example` in the project root to create your local `.env` file:

```powershell
Copy-Item .env.example .env
```

2. Open `.env` and set your preferred storage directory and a secure passphrase:

```env
# Cloudflare Pages Environment Variables (Configure in Cloudflare Dashboard)
UPLOAD_SECRET=generate_a_strong_random_secret_here
RECEIVER_TUNNEL_URL=https://your-tunnel-subdomain.yourdomain.com

# Local Desktop Receiver Variables (Local PC)
PORT=7432
STORAGE_DIR=D:\Photos\Uploads
RECEIVE_SECRET=generate_a_strong_random_secret_here
```

> [!IMPORTANT]
> `RECEIVE_SECRET` on your local PC **must match** `UPLOAD_SECRET` on Cloudflare Pages so the proxy can authenticate.

---

## Step 3: Run the Desktop Receiver Daemon

The desktop receiver daemon is a zero-dependency HTTP server (`scripts/desktop-receiver.mjs`) that accepts incoming streams and safely writes them to `STORAGE_DIR`.

### Test Running Manually

From the repository root in PowerShell:

```powershell
node --env-file=.env scripts/desktop-receiver.mjs
```

You should see:

```text
====================================================
🚀 Desktop Receiver daemon listening on port 7432
📁 Saving uploads to: D:\Photos\Uploads
🔒 Auth: ENABLED
====================================================
```

### Test Local Health Endpoint

In another terminal window:

```powershell
Invoke-RestMethod -Uri "http://localhost:7432/health"
```

Expected output:

```json
{"status":"ok","timestamp":"2026-10-15T..."}
```

---

## Step 4: Expose the Daemon via Cloudflare Tunnel

### Option A: Quick Ad-Hoc Tunnel (Temporary / Testing)

Run a quick tunnel pointing to your local port:

```powershell
cloudflared tunnel --url http://localhost:7432
```

In the console output, find your temporary tunnel URL:

```text
https://random-assigned-name.trycloudflare.com
```

You can test reachability from any browser or curl:
`https://random-assigned-name.trycloudflare.com/health`

### Option B: Persistent Named Tunnel (Recommended for Production)

A named tunnel stays consistent across system reboots and assigns a custom subdomain on your domain (e.g., `photos-receiver.kunaljangid.com`).

1. **Authenticate cloudflared with your Cloudflare account:**

```powershell
cloudflared tunnel login
```

A browser window will open. Authorize your Cloudflare account and select `kunaljangid.com`.

2. **Create a named tunnel:**

```powershell
cloudflared tunnel create photo-receiver
```

This creates a tunnel ID and credentials file at `C:\Users\<YourUser>\.cloudflared\<TUNNEL_ID>.json`. Note your `<TUNNEL_ID>`.

3. **Route DNS to your tunnel:**

```powershell
cloudflared tunnel route dns photo-receiver photos-receiver.kunaljangid.com
```

4. **Create a tunnel configuration file (`C:\Users\<YourUser>\.cloudflared\config.yml`):**

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<YourUser>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: photos-receiver.kunaljangid.com
    service: http://localhost:7432
  - service: http_status:404
```

5. **Test running the persistent tunnel:**

```powershell
cloudflared tunnel run photo-receiver
```

---

## Step 5: Configure Cloudflare Pages Environment Variables

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages**.
2. Select your portfolio Pages project (`kunaljangid-website` or equivalent).
3. Navigate to **Settings** > **Environment Variables**.
4. Add the following environment variables for both **Production** and **Preview** environments:

| Variable Name | Value | Description |
|---|---|---|
| `UPLOAD_SECRET` | *(Same passphrase as `RECEIVE_SECRET`)* | Shared secret passphrase to authenticate uploads. |
| `RECEIVER_TUNNEL_URL` | `https://photos-receiver.kunaljangid.com` | Full HTTPS URL of your Cloudflare Tunnel. |

5. Trigger a deployment or commit so the new environment variables take effect on Pages Functions.

---

## Step 6: Automate Daemon & Tunnel Startup on Windows

To ensure the receiver is always ready whenever your PC is on, run both the Node.js daemon and `cloudflared` in the background.

### Approach 1: Using PM2 (Recommended for Developers)

PM2 makes managing background Node.js processes simple.

1. **Install PM2 globally:**

```powershell
npm install -g pm2
```

2. **Start the receiver with PM2:**

```powershell
pm2 start scripts/desktop-receiver.mjs --name "photo-receiver" --node-args="--env-file=D:\projects\kunaljangid-website-code\.env"
```

3. **Install PM2 Windows Service for startup persistence:**

```powershell
npm install -g pm2-windows-service
pm2-service-install
pm2 save
```

4. **Install `cloudflared` as a native Windows service:**

In an Administrator PowerShell:

```powershell
cloudflared service install
Start-Service cloudflared
```

---

### Approach 2: Windows Task Scheduler (Zero External Dependencies)

You can launch the receiver automatically when you log into Windows:

1. Create a lightweight launcher script `scripts\start-receiver.bat`:

```bat
@echo off
cd /d "D:\projects\kunaljangid-website-code"
node --env-file=.env scripts\desktop-receiver.mjs
```

2. (Optional) To run completely hidden without a terminal window, create `scripts\start-receiver.vbs`:

```vbs
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c ""D:\projects\kunaljangid-website-code\scripts\start-receiver.bat""", 0, False
```

3. Open **Task Scheduler** (`taskschd.msc`):
   - Click **Create Basic Task**.
   - Name: `Photo Receiver Daemon`.
   - Trigger: **When I log on**.
   - Action: **Start a program**.
   - Program/script: `wscript.exe`
   - Add arguments: `"D:\projects\kunaljangid-website-code\scripts\start-receiver.vbs"`
   - Click **Finish**.

---

## Step 7: Verification & End-to-End Test

1. Ensure the daemon and tunnel are running.
2. Visit **`https://kunaljangid.com/upload`** in your browser (or `http://localhost:4321/upload` in dev mode).
3. Check the **Telemetry Status Indicator** at the top:
   - Should display **`RECEIVER STATUS: [ DESKTOP ONLINE ]`** in green with a pulsing indicator.
   - If it displays `[ DESKTOP OFFLINE ]`, click **Probe Desktop** or check your tunnel URL in the Cloudflare Pages settings.
4. Enter your passphrase in **01 // Secret Passphrase Authorization**.
5. Drag and drop or browse for test photos (`.jpg`, `.png`, `.webp`, `.heic`, `.avif`).
6. Click **Transmit Payloads**.
7. Check `D:\Photos\Uploads` — your photo should be saved with a timestamped, sanitized name like:
   `1729012345678-a1b2c3d4-photo-name.jpg`

---

## Troubleshooting & FAQ

### 1. `RECEIVER STATUS: [ DESKTOP OFFLINE ]` or `503 Service Unavailable`
- **Cause:** Cloudflare Pages Function cannot reach `${RECEIVER_TUNNEL_URL}/health`.
- **Checks:**
  - Is `cloudflared` active and connected? Test visiting `https://<your-tunnel-url>/health` in a browser.
  - Is `node scripts/desktop-receiver.mjs` running and listening on port `7432`?
  - Verify `RECEIVER_TUNNEL_URL` is spelled correctly in Cloudflare Pages dashboard (ensure no trailing slash issues).

### 2. `401 Unauthorized: Invalid or missing token`
- **Cause:** Passphrase mismatch.
- **Checks:**
  - Verify the passphrase entered on `/upload` matches `UPLOAD_SECRET` on Cloudflare Pages.
  - Verify `UPLOAD_SECRET` on Cloudflare Pages matches `RECEIVE_SECRET` in your local `.env`.

### 3. File upload fails: `413 File exceeds 25MB limit`
- **Cause:** The uploader and receiver enforce a strict 25MB per-file ceiling to protect bandwidth and storage integrity.
- **Resolution:** Compress or resize large RAW files before uploading.

### 4. Windows Firewall Prompt
- If Windows Firewall asks for permission when running Node.js or `cloudflared`, allow access on **Private networks**.
