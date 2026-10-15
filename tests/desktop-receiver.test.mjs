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
