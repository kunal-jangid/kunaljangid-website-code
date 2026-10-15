import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock Pages Function Context
function createMockContext({ method = 'GET', headers = {}, env = {}, body = null }) {
  const init = {
    method,
    headers: new Headers(headers),
  };
  if (body !== null && method !== 'GET' && method !== 'HEAD') {
    init.body = body;
    init.duplex = 'half';
  }
  const request = new Request('http://localhost/api/test', init);
  return { request, env };
}

describe('Cloudflare Pages Functions API', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('status function returns online: true when tunnel responds 200', async () => {
    globalThis.fetch = async (url) => {
      assert.equal(url, 'https://tunnel.example.com/health');
      return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
    };

    const { onRequestGet } = await import('../functions/api/status.ts');
    const ctx = createMockContext({
      method: 'GET',
      env: { RECEIVER_TUNNEL_URL: 'https://tunnel.example.com' },
    });
    const res = await onRequestGet(ctx);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.online, true);
  });

  test('status function returns online: false when RECEIVER_TUNNEL_URL is not configured', async () => {
    const { onRequestGet } = await import('../functions/api/status.ts');
    const ctx = createMockContext({
      method: 'GET',
      env: {},
    });
    const res = await onRequestGet(ctx);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.online, false);
    assert.ok(data.error.includes('RECEIVER_TUNNEL_URL is not configured'));
  });

  test('status function returns online: false when tunnel returns non-200 status', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ status: 'error' }), { status: 502 });

    const { onRequestGet } = await import('../functions/api/status.ts');
    const ctx = createMockContext({
      method: 'GET',
      env: { RECEIVER_TUNNEL_URL: 'https://tunnel.example.com/' },
    });
    const res = await onRequestGet(ctx);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.online, false);
    assert.equal(data.status, 502);
  });

  test('status function returns online: false when tunnel fetch throws', async () => {
    globalThis.fetch = async () => {
      throw new Error('Connection refused');
    };

    const { onRequestGet } = await import('../functions/api/status.ts');
    const ctx = createMockContext({
      method: 'GET',
      env: { RECEIVER_TUNNEL_URL: 'https://tunnel.example.com' },
    });
    const res = await onRequestGet(ctx);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.online, false);
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
    assert.ok(data.error.includes('Unauthorized'));
  });

  test('upload function returns 401 when Authorization header is missing', async () => {
    const { onRequestPost } = await import('../functions/api/upload.ts');
    const ctx = createMockContext({
      method: 'POST',
      headers: {},
      env: { UPLOAD_SECRET: 'super_secret', RECEIVER_TUNNEL_URL: 'https://tunnel.example.com' },
      body: 'binarydata',
    });
    const res = await onRequestPost(ctx);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('upload function returns 500 when RECEIVER_TUNNEL_URL is not set', async () => {
    const { onRequestPost } = await import('../functions/api/upload.ts');
    const ctx = createMockContext({
      method: 'POST',
      headers: { 'Authorization': 'Bearer super_secret' },
      env: { UPLOAD_SECRET: 'super_secret' },
      body: 'binarydata',
    });
    const res = await onRequestPost(ctx);
    assert.equal(res.status, 500);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('RECEIVER_TUNNEL_URL not set'));
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

  test('upload function returns 400 when Content-Length exceeds 25MB', async () => {
    const { onRequestPost } = await import('../functions/api/upload.ts');
    const ctx = createMockContext({
      method: 'POST',
      headers: {
        'Authorization': 'Bearer super_secret',
        'Content-Type': 'image/jpeg',
        'Content-Length': String(26 * 1024 * 1024),
        'X-Original-Filename': 'large.jpg',
      },
      env: { UPLOAD_SECRET: 'super_secret', RECEIVER_TUNNEL_URL: 'https://tunnel.example.com' },
      body: 'largeimagebytes',
    });
    const res = await onRequestPost(ctx);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('File size exceeds 25MB limit'));
  });

  test('upload function proxies request to receiver tunnel on valid upload', async () => {
    let capturedUrl = null;
    let capturedHeaders = null;

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedHeaders = options.headers;
      return new Response(JSON.stringify({ success: true, filename: 'photo_123.jpg', size: 1024 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { onRequestPost } = await import('../functions/api/upload.ts');
    const ctx = createMockContext({
      method: 'POST',
      headers: {
        'Authorization': 'Bearer super_secret',
        'Content-Type': 'image/png; charset=utf-8',
        'X-Original-Filename': 'photo.png',
      },
      env: { UPLOAD_SECRET: 'super_secret', RECEIVER_TUNNEL_URL: 'https://tunnel.example.com/' },
      body: 'imagebytes',
    });
    const res = await onRequestPost(ctx);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.filename, 'photo_123.jpg');
    assert.equal(capturedUrl, 'https://tunnel.example.com/receive');
    assert.equal(capturedHeaders['Authorization'], 'Bearer super_secret');
    assert.equal(capturedHeaders['Content-Type'], 'image/png');
    assert.equal(capturedHeaders['X-Original-Filename'], 'photo.png');
  });

  test('upload function safely proxies URI-encoded non-ASCII filename', async () => {
    let capturedHeaders = null;

    globalThis.fetch = async (url, options) => {
      capturedHeaders = options.headers;
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const { onRequestPost } = await import('../functions/api/upload.ts');
    const ctx = createMockContext({
      method: 'POST',
      headers: {
        'Authorization': 'Bearer super_secret',
        'Content-Type': 'image/jpeg',
        'X-Original-Filename': encodeURIComponent('party_🎉_pic.jpg'),
      },
      env: { UPLOAD_SECRET: 'super_secret', RECEIVER_TUNNEL_URL: 'https://tunnel.example.com/' },
      body: 'imagebytes',
    });
    const res = await onRequestPost(ctx);
    assert.equal(res.status, 200);
    assert.equal(capturedHeaders['X-Original-Filename'], encodeURIComponent('party_🎉_pic.jpg'));
  });

  test('upload function returns 503 when receiver tunnel is unreachable', async () => {
    globalThis.fetch = async () => {
      throw new Error('Connection refused: receiver tunnel down');
    };

    const { onRequestPost } = await import('../functions/api/upload.ts');
    const ctx = createMockContext({
      method: 'POST',
      headers: {
        'Authorization': 'Bearer super_secret',
        'Content-Type': 'image/jpeg',
        'X-Original-Filename': 'photo.jpg',
      },
      env: { UPLOAD_SECRET: 'super_secret', RECEIVER_TUNNEL_URL: 'https://tunnel.example.com' },
      body: 'imagebytes',
    });
    const res = await onRequestPost(ctx);
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('Desktop receiver is offline'));
  });
});
