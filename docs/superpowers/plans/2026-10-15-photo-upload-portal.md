# Private Photo Upload Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a secure, zero-subscription private photo upload portal at `kunaljangid.com/upload` that uploads photos directly to a local Windows desktop via Cloudflare Pages Functions and Cloudflare Tunnel.

**Architecture:** A static Astro page (`src/pages/upload.astro`) embeds a tactile React upload component (`src/components/PhotoUploader.tsx`). Uploads and health pings route to Cloudflare Pages Functions (`functions/api/upload.ts` and `functions/api/status.ts`) which enforce Bearer token authentication and stream payloads through a free Cloudflare Tunnel (`cloudflared`) directly to a zero-dependency local Node.js receiver daemon (`scripts/desktop-receiver.mjs`) writing files to local disk.

**Tech Stack:** Astro 7, React 19, Tailwind CSS 4, Cloudflare Pages Functions, Cloudflare Tunnel (`cloudflared`), Node.js built-ins (`node:http`, `node:fs`, `node:path`, `node:crypto`).

**Spec:** [docs/superpowers/specs/2026-10-15-photo-upload-portal-design.md](file:///D:/projects/kunaljangid-website-code/docs/superpowers/specs/2026-10-15-photo-upload-portal-design.md)

## Global Constraints

- Never commit secrets or hardcode auth tokens.
- Maintain consistent portfolio design language (`font-mono`, `glass-panel`, CSS variables `--bg-color`, `--text-color`, `--border-color`, `--accent-color`).
- Enforce strict robots restriction: `<meta name="robots" content="noindex, nofollow" />` on `/upload`.
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/avif`.
- Max file size limit: 25MB (`26,214,400` bytes).
- Filename sanitization pattern: `${Date.now()}-${uuid8}-${slug}.${ext}`.

---

### Task 1: Desktop Receiver Daemon & Verification Script

**Files:**
- Create: `scripts/desktop-receiver.mjs`
- Test: `tests/desktop-receiver.test.mjs`

**Interfaces:**
- Consumes: Environment variables `PORT` (default 7432), `STORAGE_DIR` (default `D:\Photos\Uploads` or local `./uploads`), `RECEIVE_SECRET`
- Produces:
  - `GET /health` -> `{ status: "ok", timestamp: ISOString }`
  - `POST /receive` -> `{ success: true, savedAs: string, size: number }`

- [ ] **Step 1: Write the test script for the desktop receiver**

Create `tests/desktop-receiver.test.mjs`:
```javascript
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TEST_PORT = 7433;
const TEST_SECRET = 'test_secret_12345';
const TEST_STORAGE = path.resolve('./tmp-test-uploads');

let receiverProcess;

before(async () => {
  if (fs.existsSync(TEST_STORAGE)) {
    fs.rmSync(TEST_STORAGE, { recursive: true, force: true });
  }

  receiverProcess = spawn('node', ['scripts/desktop-receiver.mjs'], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      RECEIVE_SECRET: TEST_SECRET,
      STORAGE_DIR: TEST_STORAGE,
    },
    stdio: 'pipe',
  });

  // Wait for server to bind
  await new Promise((resolve, reject) => {
    receiverProcess.stdout.on('data', (d) => {
      if (d.toString().includes('Receiver daemon listening')) resolve();
    });
    receiverProcess.stderr.on('data', (d) => console.error(d.toString()));
    receiverProcess.on('error', reject);
    setTimeout(() => resolve(), 1500);
  });
});

after(() => {
  if (receiverProcess) receiverProcess.kill();
  if (fs.existsSync(TEST_STORAGE)) {
    fs.rmSync(TEST_STORAGE, { recursive: true, force: true });
  }
});

test('GET /health returns 200 and status ok', async () => {
  const res = await fetch(`http://localhost:${TEST_PORT}/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
});

test('POST /receive rejects missing auth with 401', async () => {
  const res = await fetch(`http://localhost:${TEST_PORT}/receive`, {
    method: 'POST',
    body: 'binarypayload',
  });
  assert.equal(res.status, 401);
});

test('POST /receive saves file with valid auth and sanitized name', async () => {
  const fakeImageData = Buffer.from('fake image content');
  const res = await fetch(`http://localhost:${TEST_PORT}/receive`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_SECRET}`,
      'Content-Type': 'image/jpeg',
      'X-Original-Filename': 'test-photo../../bad.jpg',
    },
    body: fakeImageData,
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.savedAs);
  assert.ok(!data.savedAs.includes('..'));
  assert.equal(data.size, fakeImageData.length);

  const files = fs.readdirSync(TEST_STORAGE);
  assert.equal(files.length, 1);
  assert.equal(files[0], data.savedAs);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/desktop-receiver.test.mjs`  
Expected: FAIL (Cannot find module `scripts/desktop-receiver.mjs`)

- [ ] **Step 3: Implement `scripts/desktop-receiver.mjs`**

Create `scripts/desktop-receiver.mjs`:
```javascript
#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = parseInt(process.env.PORT || '7432', 10);
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || './uploads');
const RECEIVE_SECRET = process.env.RECEIVE_SECRET || '';

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

function sanitizeFilename(originalName = 'upload.bin') {
  const base = path.basename(originalName);
  const ext = path.extname(base) || '.jpg';
  const nameWithoutExt = path.basename(base, ext);
  const cleanSlug = nameWithoutExt.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40) || 'photo';
  const timestamp = Date.now();
  const randomSuffix = crypto.randomUUID().slice(0, 8);
  return `${timestamp}-${randomSuffix}-${cleanSlug}${ext.toLowerCase()}`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // CORS for convenience if called from web origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Original-Filename');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // File receiver endpoint
  if (req.method === 'POST' && url.pathname === '/receive') {
    const authHeader = req.headers['authorization'];
    const expectedAuth = RECEIVE_SECRET ? `Bearer ${RECEIVE_SECRET}` : null;

    if (expectedAuth && authHeader !== expectedAuth) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized: invalid or missing auth token' }));
      return;
    }

    const rawFilename = req.headers['x-original-filename'] || 'upload.jpg';
    const targetFilename = sanitizeFilename(String(rawFilename));
    const targetPath = path.join(STORAGE_DIR, targetFilename);

    const writeStream = fs.createWriteStream(targetPath);
    let bytesReceived = 0;

    req.on('data', (chunk) => {
      bytesReceived += chunk.length;
    });

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      const logTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
      console.log(`[${logTime}] SAVED: ${targetFilename} (${(bytesReceived / 1024 / 1024).toFixed(2)} MB) -> ${targetPath}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        savedAs: targetFilename,
        size: bytesReceived,
      }));
    });

    writeStream.on('error', (err) => {
      console.error('File write error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Failed to write file to storage' }));
    });

    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Desktop Receiver daemon listening on port ${PORT}`);
  console.log(`📁 Saving uploads to: ${STORAGE_DIR}`);
  console.log(`🔒 Auth: ${RECEIVE_SECRET ? 'ENABLED' : 'DISABLED (Warning: No secret set)'}`);
  console.log(`====================================================`);
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/desktop-receiver.test.mjs`  
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/desktop-receiver.mjs tests/desktop-receiver.test.mjs
git commit -m "feat: add desktop receiver daemon and verification test"
```

---

### Task 2: Cloudflare Pages Functions (`functions/api/status.ts` & `functions/api/upload.ts`)

**Files:**
- Create: `functions/api/status.ts`
- Create: `functions/api/upload.ts`
- Test: `tests/functions-api.test.mjs`

**Interfaces:**
- Consumes:
  - `context.env.UPLOAD_SECRET`
  - `context.env.RECEIVER_TUNNEL_URL`
- Produces:
  - `GET /api/status` -> `{ online: boolean }`
  - `POST /api/upload` -> `{ success: true, filename: string, size: number }` or `{ success: false, error: string }`

- [ ] **Step 1: Write integration tests for API functions**

Create `tests/functions-api.test.mjs`:
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mock Pages Function Context
function createMockContext({ method, headers = {}, env = {}, body = null }) {
  const request = new Request('http://localhost/api/test', {
    method,
    headers: new Headers(headers),
    body,
    duplex: 'half',
  });
  return { request, env };
}

test('status function returns online: true when tunnel responds 200', async () => {
  const mockFetch = async () => new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch;

  try {
    const { onRequestGet } = await import('../functions/api/status.ts');
    const ctx = createMockContext({
      method: 'GET',
      env: { RECEIVER_TUNNEL_URL: 'https://tunnel.example.com' },
    });
    const res = await onRequestGet(ctx);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.online, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('upload function returns 401 when Authorization header is invalid', async () => {
  const { onRequestPost } = await import('../functions/api/upload.ts');
  const ctx = createMockContext({
    method: 'POST',
    headers: { 'Authorization': 'Bearer wrong_token' },
    env: { UPLOAD_SECRET: 'super_secret', RECEIVER_TUNNEL_URL: 'https://tunnel.example.com' },
    body: 'binarydata',
  });
  const res = await onRequestPost(ctx);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('upload function returns 400 when file type is not whitelisted', async () => {
  const { onRequestPost } = await import('../functions/api/upload.ts');
  const ctx = createMockContext({
    method: 'POST',
    headers: {
      'Authorization': 'Bearer super_secret',
      'Content-Type': 'application/pdf',
      'X-Original-Filename': 'doc.pdf',
    },
    env: { UPLOAD_SECRET: 'super_secret', RECEIVER_TUNNEL_URL: 'https://tunnel.example.com' },
    body: 'pdfcontent',
  });
  const res = await onRequestPost(ctx);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.error.includes('MIME type'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/functions-api.test.mjs`  
Expected: FAIL (Cannot find module `../functions/api/status.ts`)

- [ ] **Step 3: Implement `functions/api/status.ts`**

Create `functions/api/status.ts`:
```typescript
interface Env {
  RECEIVER_TUNNEL_URL?: string;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const tunnelUrl = context.env.RECEIVER_TUNNEL_URL;

  if (!tunnelUrl) {
    return new Response(JSON.stringify({ online: false, error: "RECEIVER_TUNNEL_URL is not configured" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const pingUrl = `${tunnelUrl.replace(/\/+$/, "")}/health`;
    const res = await fetch(pingUrl, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      return new Response(JSON.stringify({ online: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ online: false, status: res.status }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ online: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

- [ ] **Step 4: Implement `functions/api/upload.ts`**

Create `functions/api/upload.ts`:
```typescript
interface Env {
  UPLOAD_SECRET?: string;
  RECEIVER_TUNNEL_URL?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/avif",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const configuredSecret = env.UPLOAD_SECRET;
  const tunnelUrl = env.RECEIVER_TUNNEL_URL;

  // 1. Auth check
  const authHeader = request.headers.get("Authorization");
  if (!configuredSecret || authHeader !== `Bearer ${configuredSecret}`) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized: Invalid or missing token" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!tunnelUrl) {
    return new Response(
      JSON.stringify({ success: false, error: "Server configuration error: RECEIVER_TUNNEL_URL not set" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 2. Validate MIME type & Content-Length header if present
  const contentType = (request.headers.get("Content-Type") || "").toLowerCase().split(";")[0].trim();
  const originalFilename = request.headers.get("X-Original-Filename") || "upload.jpg";

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Invalid MIME type (${contentType}). Only JPEG, PNG, WEBP, HEIC, and AVIF are allowed.`,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const contentLengthStr = request.headers.get("Content-Length");
  if (contentLengthStr) {
    const contentLength = parseInt(contentLengthStr, 10);
    if (!isNaN(contentLength) && contentLength > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `File size exceeds 25MB limit (received ${contentLength} bytes)`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // 3. Proxy payload directly to desktop tunnel receiver
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout for large uploads

    const targetUrl = `${tunnelUrl.replace(/\/+$/, "")}/receive`;
    const proxyResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${configuredSecret}`,
        "Content-Type": contentType,
        "X-Original-Filename": originalFilename,
      },
      body: request.body,
      // @ts-ignore
      duplex: "half",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseText = await proxyResponse.text();
    return new Response(responseText, {
      status: proxyResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Desktop receiver is offline or unreachable via tunnel.",
        details: err?.message || String(err),
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test tests/functions-api.test.mjs`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add functions/api/status.ts functions/api/upload.ts tests/functions-api.test.mjs
git commit -m "feat: add Cloudflare Pages Functions for status and photo upload proxy"
```

---

### Task 3: Interactive React Upload UI Component (`src/components/PhotoUploader.tsx`)

**Files:**
- Create: `src/components/PhotoUploader.tsx`

**Interfaces:**
- Consumes: `/api/status`, `/api/upload`
- Produces: Full React UI with auth key management, drag-and-drop file staging, thumbnail previews, and queued uploading

- [ ] **Step 1: Implement `src/components/PhotoUploader.tsx`**

Create `src/components/PhotoUploader.tsx`:
```tsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ToastProvider, toastManager } from "@/components/ui/toast";
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  FileImage,
  KeyRound,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string | null;
  status: "idle" | "uploading" | "success" | "error";
  errorMessage?: string;
  progress?: number;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/avif",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

function PhotoUploaderInner() {
  const [authToken, setAuthToken] = useState("");
  const [rememberAuth, setRememberAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isReceiverOnline, setIsReceiverOnline] = useState<boolean | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("portfolio_upload_auth_token");
    if (savedToken) {
      setAuthToken(savedToken);
      setRememberAuth(true);
    }
    checkReceiverStatus();
  }, []);

  // Save/Remove token when preference changes
  const handleAuthChange = (value: string) => {
    setAuthToken(value);
    if (rememberAuth && value) {
      localStorage.setItem("portfolio_upload_auth_token", value);
    } else if (!value) {
      localStorage.removeItem("portfolio_upload_auth_token");
    }
  };

  const handleRememberToggle = (checked: boolean) => {
    setRememberAuth(checked);
    if (checked && authToken) {
      localStorage.setItem("portfolio_upload_auth_token", authToken);
    } else {
      localStorage.removeItem("portfolio_upload_auth_token");
    }
  };

  const checkReceiverStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setIsReceiverOnline(Boolean(data.online));
      } else {
        setIsReceiverOnline(false);
      }
    } catch {
      setIsReceiverOnline(false);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const addFiles = (files: FileList | File[]) => {
    const newItems: StagedFile[] = [];

    Array.from(files).forEach((file) => {
      // Validate MIME
      const isAllowed = ALLOWED_MIME_TYPES.some((type) =>
        file.type.toLowerCase().includes(type) ||
        file.name.toLowerCase().endsWith(".heic")
      );

      if (!isAllowed) {
        toastManager.add({
          title: "Unsupported File",
          description: `${file.name} is not a supported format (JPEG, PNG, WEBP, HEIC, AVIF).`,
          type: "error",
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toastManager.add({
          title: "File Too Large",
          description: `${file.name} exceeds the 25MB limit.`,
          type: "error",
        });
        return;
      }

      const isWebRenderable = !file.name.toLowerCase().endsWith(".heic");
      const previewUrl = isWebRenderable ? URL.createObjectURL(file) : null;

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        status: "idle",
      });
    });

    setStagedFiles((prev) => [...prev, ...newItems]);
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const clearCompleted = () => {
    setStagedFiles((prev) => {
      prev.filter((i) => i.status === "success").forEach((i) => {
        if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
      });
      return prev.filter((i) => i.status !== "success");
    });
  };

  // Batch upload with concurrency = 2
  const startUploadBatch = async () => {
    if (!authToken.trim()) {
      toastManager.add({
        title: "Auth Token Required",
        description: "Please enter your secret passphrase before uploading.",
        type: "error",
      });
      return;
    }

    const pending = stagedFiles.filter((f) => f.status === "idle" || f.status === "error");
    if (pending.length === 0) return;

    setIsUploadingBatch(true);

    const CONCURRENCY = 2;
    let index = 0;

    const uploadSingleFile = async (item: StagedFile) => {
      setStagedFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "uploading" } : f))
      );

      try {
        const mime = item.file.type || (item.file.name.endsWith(".heic") ? "image/heic" : "image/jpeg");
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken.trim()}`,
            "Content-Type": mime,
            "X-Original-Filename": item.file.name,
          },
          body: item.file,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          throw new Error(data.error || `Upload failed with HTTP ${res.status}`);
        }

        setStagedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: "success" } : f))
        );
      } catch (err: any) {
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "error", errorMessage: err.message || "Failed" }
              : f
          )
        );
      }
    };

    const worker = async () => {
      while (index < pending.length) {
        const currentItem = pending[index++];
        await uploadSingleFile(currentItem);
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, pending.length) }, () => worker());
    await Promise.all(workers);

    setIsUploadingBatch(false);
    toastManager.add({
      title: "Batch Finished",
      description: "Batch processing completed.",
      type: "info",
    });
  };

  const completedCount = stagedFiles.filter((f) => f.status === "success").length;
  const progressPercent = stagedFiles.length > 0 ? Math.round((completedCount / stagedFiles.length) * 100) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 font-mono">
      {/* 00 // Telemetry & Health Header */}
      <div className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-brand-border/40">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isReceiverOnline === true
                ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"
                : isReceiverOnline === false
                ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                : "bg-amber-500"
            }`}
          />
          <div className="text-xs">
            <span className="opacity-60">RECEIVER STATUS: </span>
            <span className="font-bold">
              {isReceiverOnline === true
                ? "[ DESKTOP ONLINE ]"
                : isReceiverOnline === false
                ? "[ DESKTOP OFFLINE ]"
                : "[ CHECKING... ]"}
            </span>
          </div>
        </div>
        <Button
          onClick={checkReceiverStatus}
          disabled={isCheckingStatus}
          variant="outline"
          size="sm"
          className="text-xs uppercase gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? "animate-spin" : ""}`} />
          <span>Probe Desktop</span>
        </Button>
      </div>

      {/* 01 // Authentication Gate */}
      <div className="glass-panel p-6 md:p-8 rounded-2xl border border-brand-border/40 space-y-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-accent font-bold">
          <KeyRound className="w-4 h-4" />
          <span>01 // Secret Passphrase Authorization</span>
        </div>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={authToken}
            onChange={(e) => handleAuthChange(e.target.value)}
            placeholder="Enter your private UPLOAD_SECRET token..."
            className="pr-10 bg-transparent border-brand-border/40 focus-visible:border-brand-accent transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs opacity-70 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberAuth}
            onChange={(e) => handleRememberToggle(e.target.checked)}
            className="rounded border-brand-border/40 text-brand-accent focus:ring-0"
          />
          <span>Remember secret key on this device</span>
        </label>
      </div>

      {/* 02 // Drag-and-Drop Staging Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-panel p-10 md:p-14 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
          isDragging
            ? "border-brand-accent bg-brand-accent/10 bklit-glow scale-[1.01]"
            : "border-brand-border/40 hover:border-brand-accent/60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/avif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="w-16 h-16 rounded-full bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm md:text-base font-bold">
            DROP PHOTOS HERE OR <span className="text-brand-accent underline underline-offset-4">BROWSE</span>
          </p>
          <p className="text-xs opacity-60 mt-1">
            JPEG, PNG, WEBP, HEIC, AVIF • Up to 25MB each • Direct to Desktop
          </p>
        </div>
      </div>

      {/* 03 // Staged File List & Upload Queue */}
      {stagedFiles.length > 0 && (
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-brand-border/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/30 pb-4">
            <div>
              <h2 className="text-xs uppercase tracking-widest text-brand-accent font-bold">
                03 // Staging Queue ({completedCount} / {stagedFiles.length} Completed)
              </h2>
              <div className="w-full bg-brand-border/20 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-brand-accent h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {completedCount > 0 && (
                <Button
                  onClick={clearCompleted}
                  variant="outline"
                  size="sm"
                  className="text-xs uppercase"
                  disabled={isUploadingBatch}
                >
                  Clear Finished
                </Button>
              )}
              <Button
                onClick={startUploadBatch}
                disabled={isUploadingBatch || stagedFiles.every((f) => f.status === "success")}
                className="text-xs uppercase tracking-wider"
              >
                {isUploadingBatch ? (
                  <>
                    <Spinner className="w-3.5 h-3.5 mr-1.5" />
                    Transmitting...
                  </>
                ) : (
                  "Transmit Payloads"
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[460px] overflow-y-auto pr-1">
            {stagedFiles.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-brand-border/30 bg-brand-bg/40 flex items-center gap-3 relative group"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-brand-border/20 flex-shrink-0 flex items-center justify-center">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileImage className="w-6 h-6 opacity-60 text-brand-accent" />
                  )}
                </div>

                <div className="min-w-0 flex-grow text-xs">
                  <p className="truncate font-semibold">{item.file.name}</p>
                  <p className="opacity-50 text-[10px]">
                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>

                  <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                    {item.status === "idle" && <span className="opacity-60">[ QUEUED ]</span>}
                    {item.status === "uploading" && (
                      <span className="text-brand-accent flex items-center gap-1">
                        <Spinner className="w-2.5 h-2.5" /> SENDING...
                      </span>
                    )}
                    {item.status === "success" && (
                      <span className="text-emerald-500 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> SAVED
                      </span>
                    )}
                    {item.status === "error" && (
                      <span
                        className="text-rose-500 flex items-center gap-1 font-bold truncate"
                        title={item.errorMessage}
                      >
                        <XCircle className="w-3 h-3" /> ERROR
                      </span>
                    )}
                  </div>
                </div>

                {item.status !== "uploading" && (
                  <button
                    onClick={() => removeStagedFile(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PhotoUploader() {
  return (
    <ToastProvider>
      <PhotoUploaderInner />
    </ToastProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PhotoUploader.tsx
git commit -m "feat: add interactive React PhotoUploader component with staging and batch queue"
```

---

### Task 4: Astro Upload Page Route (`src/pages/upload.astro`)

**Files:**
- Create: `src/pages/upload.astro`

**Interfaces:**
- Consumes: `src/layouts/Layout.astro`, `src/components/PhotoUploader.tsx`
- Produces: Astro page at route `/upload` with strict robots noindex/nofollow

- [ ] **Step 1: Implement `src/pages/upload.astro`**

Create `src/pages/upload.astro`:
```astro
---
import Layout from "../layouts/Layout.astro";
import PhotoUploader from "../components/PhotoUploader";
---

<Layout
  title="PORTAL // SECURE PHOTO UPLOAD - Kunal Jangid"
  description="Private direct-to-desktop photo upload interface."
>
  <head slot="head">
    <meta name="robots" content="noindex, nofollow" />
  </head>

  <div class="space-y-10">
    <div class="text-center space-y-3">
      <div class="inline-block px-3 py-1 rounded-full border border-brand-accent/40 bg-brand-accent/10 text-[10px] uppercase font-mono tracking-widest text-brand-accent">
        SECURE TERMINAL DROP
      </div>
      <h1 class="text-3xl md:text-5xl font-black font-mono tracking-tighter">
        DIRECT_TO_DESKTOP_UPLOAD
      </h1>
      <p class="text-xs md:text-sm opacity-60 font-mono max-w-xl mx-auto">
        Encrypted direct transfer gateway. Stage photos on any device to stream straight to your local desktop hard drive.
      </p>
    </div>

    <PhotoUploader client:load />
  </div>
</Layout>
```

- [ ] **Step 2: Verify `Layout.astro` accepts custom head tags or renders robot tags**

Check `src/layouts/Layout.astro`. If `Layout.astro` has `<meta name="robots" content="index, follow" />` hardcoded on line 25:
Modify `src/layouts/Layout.astro` so `robots` is an optional prop with default `"index, follow"`:
```astro
interface Props {
  title: string;
  description: string;
  robots?: string;
}

const { title, description, robots = "index, follow" } = Astro.props;
```
and on line 25 replace with:
```astro
<meta name="robots" content={robots} />
```
Then `upload.astro` passes `robots="noindex, nofollow"`.

- [ ] **Step 3: Run `npx astro check` or `npm run build`**

Run: `npm run build`  
Expected: Build succeeds with static page `/upload/index.html` generated.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Layout.astro src/pages/upload.astro
git commit -m "feat: add secure /upload route with robots noindex meta protection"
```

---

### Task 5: Setup Guide & Environment Documentation

**Files:**
- Create: `DESKTOP_SETUP.md`
- Create: `.env.example`

- [ ] **Step 1: Create `.env.example`**

Create `.env.example`:
```env
# Cloudflare Pages Environment Variables (Configure in Cloudflare Dashboard -> Settings -> Environment Variables)
UPLOAD_SECRET=your_super_secret_passphrase_here
RECEIVER_TUNNEL_URL=https://your-tunnel-name.cfargotunnel.com

# Local Desktop Receiver Variables (Configure in local .env on your PC)
PORT=7432
STORAGE_DIR=D:\Photos\Uploads
RECEIVE_SECRET=your_super_secret_passphrase_here
```

- [ ] **Step 2: Create `DESKTOP_SETUP.md`**

Create `DESKTOP_SETUP.md` documenting:
- How to install `cloudflared` on Windows (`winget install --id Cloudflare.cloudflared`).
- How to run the desktop receiver (`node scripts/desktop-receiver.mjs`).
- How to start the tunnel (`cloudflared tunnel --url http://localhost:7432`).
- Setting Cloudflare Pages environment variables (`UPLOAD_SECRET`, `RECEIVER_TUNNEL_URL`).
- Auto-starting via Windows Task Scheduler or PM2 so it stays running in the background.

- [ ] **Step 3: Commit**

```bash
git add .env.example DESKTOP_SETUP.md
git commit -m "docs: add desktop setup guide and environment examples"
```

---

### Task 6: End-to-End Build & Verification

**Files:**
- Entire repository

- [ ] **Step 1: Run all tests**

Run: `node --test tests/*.test.mjs`  
Expected: All tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`  
Expected: Astro build finishes with 0 errors.

- [ ] **Step 3: Check robots meta tag in built HTML**

Run: Verify `dist/upload/index.html` contains `<meta name="robots" content="noindex, nofollow">`.

- [ ] **Step 4: Commit final verification changes (if any)**

```bash
git status
```
