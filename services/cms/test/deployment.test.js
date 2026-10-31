import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test } from 'node:test';

const execute = promisify(execFile);
const prepare = fileURLToPath(new URL('../scripts/prepare-secrets.mjs', import.meta.url));
const verify = fileURLToPath(new URL('../scripts/verify-auth.mjs', import.meta.url));
const clientId = 'fixture-client-id';
const clientSecret = 'fixture-client-secret';

async function secretPath(t) {
  const directory = await mkdtemp(join(tmpdir(), 'srp-cms-secrets-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return join(directory, 'oauth.json');
}

async function run(script, args, env = {}) {
  try {
    const result = await execute(process.execPath, [script, ...args], {
      env: { PATH: process.env.PATH, ...env },
      timeout: 10000,
    });
    return { code: 0, ...result };
  } catch (error) {
    if (typeof error.code !== 'number') throw error;
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

function assertNoCredentials(result) {
  assert.ok(!result.stdout.includes(clientId));
  assert.ok(!result.stdout.includes(clientSecret));
  assert.ok(!result.stderr.includes(clientId));
  assert.ok(!result.stderr.includes(clientSecret));
}

test('CI creates a private secrets file with Worker binding names and does not log values', async (t) => {
  const target = await secretPath(t);
  const result = await run(prepare, [target], {
    CMS_GITHUB_CLIENT_ID: clientId,
    CMS_GITHUB_CLIENT_SECRET: clientSecret,
  });
  assert.equal(result.code, 0, result.stderr);
  assertNoCredentials(result);
  assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), {
    GITHUB_CLIENT_ID: clientId,
    GITHUB_CLIENT_SECRET: clientSecret,
  });
  if (process.platform !== 'win32') assert.equal((await stat(target)).mode & 0o777, 0o600);
});

test('CI rejects missing credentials without creating a file or logging present values', async (t) => {
  const target = await secretPath(t);
  const result = await run(prepare, [target], { CMS_GITHUB_CLIENT_ID: clientId });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Missing repository secrets: CMS_GITHUB_CLIENT_SECRET/);
  assertNoCredentials(result);
  await assert.rejects(stat(target), { code: 'ENOENT' });
});

test('CI refuses to overwrite an existing secrets file', async (t) => {
  const target = await secretPath(t);
  await writeFile(target, 'existing-file', { mode: 0o600 });
  const result = await run(prepare, [target], {
    CMS_GITHUB_CLIENT_ID: clientId,
    CMS_GITHUB_CLIENT_SECRET: clientSecret,
  });
  assert.equal(result.code, 1);
  assert.equal(await readFile(target, 'utf8'), 'existing-file');
  assertNoCredentials(result);
});

async function startServer(t, redirect) {
  const requests = [];
  let origin;
  const server = createServer((request, response) => {
    requests.push(new URL(request.url, origin));
    if (redirect === 'missing-credentials') {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(`MISCONFIGURED_CLIENT: ${clientSecret}`);
      return;
    }
    const location = new URL('https://github.com/login/oauth/authorize');
    location.searchParams.set('client_id', clientId);
    location.searchParams.set('state', 'fixture-state');
    location.searchParams.set('redirect_uri', `${origin}/callback`);
    if (redirect === 'wrong-host') location.hostname = 'evil.example';
    if (redirect === 'wrong-callback') location.searchParams.set('redirect_uri', 'https://wrong.example/callback');
    if (redirect === 'missing-client-id') location.searchParams.delete('client_id');
    if (redirect === 'missing-state') location.searchParams.delete('state');
    response.writeHead(302, { Location: location.href });
    response.end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${server.address().port}`;
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  return { origin, requests };
}

test('deployment readiness checks the live auth redirect without following it or logging credentials', async (t) => {
  const { origin, requests } = await startServer(t, 'valid');
  const result = await run(verify, [origin, 'https://blog.example.com']);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /OAuth readiness check passed/);
  assertNoCredentials(result);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].pathname, '/auth');
  assert.equal(requests[0].searchParams.get('provider'), 'github');
  assert.equal(requests[0].searchParams.get('site_id'), 'blog.example.com');
  assert.equal(requests[0].searchParams.get('scope'), 'public_repo,user');
});

for (const scenario of ['missing-credentials', 'wrong-host', 'wrong-callback', 'missing-client-id', 'missing-state']) {
  test(`deployment readiness fails for ${scenario}`, async (t) => {
    const { origin, requests } = await startServer(t, scenario);
    const result = await run(verify, [origin, 'https://blog.example.com']);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /OAuth readiness check failed/);
    assert.equal(requests.length, 1);
    assertNoCredentials(result);
  });
}
