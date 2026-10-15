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
  const data = await res.json();
  assert.equal(data.success, false);
});

test('POST /receive rejects invalid auth token with 401', async () => {
  const res = await fetch(`http://localhost:${TEST_PORT}/receive`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer wrong_token_99999',
    },
    body: 'binarypayload',
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
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
  assert.ok(data.savedAs.endsWith('.jpg'));
  assert.equal(data.size, fakeImageData.length);

  const files = fs.readdirSync(TEST_STORAGE);
  assert.ok(files.includes(data.savedAs));
});

test('POST /receive enforces extension whitelist and defaults unrecognized extensions to .jpg', async () => {
  const fakeImageData = Buffer.from('echo hello');
  const res = await fetch(`http://localhost:${TEST_PORT}/receive`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_SECRET}`,
      'Content-Type': 'application/x-sh',
      'X-Original-Filename': 'exploit.sh',
    },
    body: fakeImageData,
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.savedAs.endsWith('.jpg'));
});

test('POST /receive returns 413 and deletes partial file when payload exceeds 25MB', async () => {
  const oversizedPayload = Buffer.alloc(25 * 1024 * 1024 + 1024);
  const res = await fetch(`http://localhost:${TEST_PORT}/receive`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_SECRET}`,
      'Content-Type': 'image/jpeg',
      'X-Original-Filename': 'oversized-test.jpg',
    },
    body: oversizedPayload,
  });

  assert.equal(res.status, 413);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.error, 'File exceeds 25MB limit');

  // Small delay to ensure stream destroy and unlink cleanup cycle completes on Windows
  await new Promise((r) => setTimeout(r, 100));

  const files = fs.readdirSync(TEST_STORAGE);
  assert.ok(!files.some(f => f.includes('oversized-test')));
});
