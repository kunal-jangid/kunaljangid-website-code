#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = parseInt(process.env.PORT || '7432', 10);
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || './uploads');
const RECEIVE_SECRET = process.env.RECEIVE_SECRET || '';
const MAX_PAYLOAD_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.avif']);

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

function sanitizeFilename(originalName = 'upload.bin') {
  const base = path.basename(originalName);
  let ext = path.extname(base).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    ext = '.jpg';
  }
  const nameWithoutExt = path.basename(base, path.extname(base));
  const cleanSlug = nameWithoutExt.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40) || 'photo';
  const timestamp = Date.now();
  const randomSuffix = crypto.randomUUID().slice(0, 8);
  return `${timestamp}-${randomSuffix}-${cleanSlug}${ext}`;
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

    if (!RECEIVE_SECRET || authHeader !== `Bearer ${RECEIVE_SECRET}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized: invalid or missing auth token' }));
      return;
    }

    const rawFilename = req.headers['x-original-filename'] || 'upload.jpg';
    let decodedFilename = String(rawFilename);
    try {
      decodedFilename = decodeURIComponent(decodedFilename);
    } catch {
      decodedFilename = String(rawFilename);
    }
    const targetFilename = sanitizeFilename(decodedFilename);
    const targetPath = path.join(STORAGE_DIR, targetFilename);

    const writeStream = fs.createWriteStream(targetPath);
    let bytesReceived = 0;
    let aborted = false;

    const cleanupFile = () => {
      const tryUnlink = () => {
        try {
          if (fs.existsSync(targetPath)) {
            fs.unlinkSync(targetPath);
          }
        } catch {
          // Retry cleanup on stream close if locked on Windows
        }
      };

      tryUnlink();
      if (!writeStream.closed) {
        writeStream.once('close', tryUnlink);
      }
    };

    req.on('data', (chunk) => {
      if (aborted) return;
      bytesReceived += chunk.length;
      if (bytesReceived > MAX_PAYLOAD_BYTES) {
        aborted = true;
        req.unpipe(writeStream);
        writeStream.destroy();
        cleanupFile();
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'File exceeds 25MB limit' }));
        req.resume();
        return;
      }
    });

    const handleAbort = () => {
      if (!aborted && !res.writableEnded) {
        aborted = true;
        req.unpipe(writeStream);
        writeStream.destroy();
        cleanupFile();
      }
    };

    req.on('aborted', handleAbort);
    req.on('close', () => {
      if (!req.complete) {
        handleAbort();
      }
    });

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      if (aborted || res.headersSent) return;
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
      if (aborted || res.headersSent) return;
      cleanupFile();
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
