import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import vm from 'node:vm';

import worker from '../src/worker.js';

const AUTH_ORIGIN = 'https://cms-auth.example.test';
const CMS_ORIGIN = 'https://blog.srprolin.com';
const ENV = Object.freeze({
  CMS_ORIGIN,
  ALLOWED_DOMAINS: 'blog.srprolin.com',
  GITHUB_CLIENT_ID: 'test-client-id',
  GITHUB_CLIENT_SECRET: 'test-client-secret',
});
const STATE = '0123456789abcdef0123456789abcdef';
const COOKIE_NAME = '__Host-cms-csrf';
const TOKEN = 'test-access-token';

function assertSecurityHeaders(response) {
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
}

async function request(path, { env = ENV, cookie } = {}) {
  const headers = cookie === undefined ? {} : { Cookie: cookie };
  const response = await worker.fetch(new Request(`${AUTH_ORIGIN}${path}`, { headers }), env);
  assertSecurityHeaders(response);
  return response;
}

function callback({ code = 'test-code', state = STATE, cookie, env = ENV } = {}) {
  const query = new URLSearchParams();
  if (code !== null) query.set('code', code);
  if (state !== null) query.set('state', state);
  return request(`/callback?${query}`, {
    env,
    cookie: cookie === undefined ? `${COOKIE_NAME}=github_${STATE}` : cookie,
  });
}

function mockExchange(t, implementation = () => Response.json({ access_token: TOKEN })) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const exchange = new Request(input, init);
    calls.push(exchange);
    return implementation(exchange);
  });
  return calls;
}

// Execute the actual inline script. The fake window models listener identity and removal,
// opener identity, and postMessage arguments without reproducing the authorization decision.
async function popup(response) {
  assert.match(response.headers.get('content-type') ?? '', /^text\/html\b/i);
  const html = await response.text();
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];
  assert.equal(scripts.length, 1, 'callback must contain exactly one inline script');
  const messages = [];
  const listeners = new Set();
  const opener = {
    postMessage(data, targetOrigin) {
      messages.push({ data, targetOrigin });
    },
  };
  const window = {
    opener,
    addEventListener(type, listener) {
      assert.equal(type, 'message');
      listeners.add(listener);
    },
    removeEventListener(type, listener) {
      assert.equal(type, 'message');
      listeners.delete(listener);
    },
    close() {},
  };
  const context = vm.createContext({ window, URL, console });
  vm.runInContext(scripts[0][1], context, { timeout: 1000, filename: 'cms-callback.js' });
  assert.equal(context.__injected, undefined, 'embedded values must not execute code');
  assert.equal(window.__injected, undefined);

  return {
    html,
    messages,
    listeners,
    window,
    opener,
    dispatch(overrides = {}) {
      const event = {
        source: opener,
        origin: CMS_ORIGIN,
        data: 'authorizing:github',
        ...overrides,
      };
      for (const listener of [...listeners]) listener(event);
    },
  };
}

function resultMessages(page) {
  return page.messages.filter(({ data }) => typeof data === 'string' && data.startsWith('authorization:'));
}

function authorize(page, expectedState, provider = 'github') {
  assert.equal(resultMessages(page).length, 0, 'result must wait for an opener handshake');
  page.dispatch({ data: `authorizing:${provider}` });
  const results = resultMessages(page);
  assert.equal(results.length, 1, 'trusted opener must receive exactly one result');
  assert.equal(results[0].targetOrigin, CMS_ORIGIN);
  const prefix = `authorization:${provider}:${expectedState}:`;
  assert.ok(results[0].data.startsWith(prefix), `expected ${prefix}`);
  const content = JSON.parse(results[0].data.slice(prefix.length));
  assert.equal(content.provider, provider);
  if (expectedState === 'error') {
    assert.equal(typeof content.error, 'string');
    assert.ok(content.error.length > 0);
    assert.ok(!content.token, 'an error result must not release a token');
  }
  return content;
}

function assertCookieCleared(response) {
  const cookie = response.headers.get('set-cookie') ?? '';
  assert.match(cookie, /^__Host-cms-csrf=/);
  for (const attribute of ['HttpOnly', 'Secure', 'Path=/', 'SameSite=Lax', 'Max-Age=0']) {
    assert.ok(cookie.split(';').map((value) => value.trim()).includes(attribute), attribute);
  }
  assert.doesNotMatch(cookie, /(?:^|;)\s*Domain=/i);
}

describe('CMS OAuth worker', { concurrency: false }, () => {
  beforeEach((t) => {
    t.mock.method(globalThis, 'fetch', async () => {
      assert.fail('unexpected external fetch; every token exchange must be mocked');
    });
  });

  test('health returns the public service status and security headers', async () => {
    const response = await request('/api/health');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /application\/json/i);
    assert.deepEqual(await response.json(), { ok: true, service: 'srp-blog-cms' });
  });

  test('unknown routes retain security headers', async () => {
    const response = await request('/does-not-exist');
    assert.equal(response.status, 404);
  });

  test('auth redirects to GitHub with an explicit callback, narrow scopes, and a host-only CSRF cookie', async () => {
    const response = await request('/auth?provider=github&site_id=blog.srprolin.com&scope=public_repo,user');
    assert.equal(response.status, 302);
    const location = new URL(response.headers.get('location'));
    assert.equal(location.origin + location.pathname, 'https://github.com/login/oauth/authorize');
    assert.equal(location.searchParams.get('client_id'), ENV.GITHUB_CLIENT_ID);
    assert.equal(location.searchParams.get('redirect_uri'), `${AUTH_ORIGIN}/callback`);
    assert.deepEqual(new Set(location.searchParams.get('scope').split(/[\s,]+/)), new Set(['public_repo', 'user']));
    assert.ok(!location.href.includes(ENV.GITHUB_CLIENT_SECRET));
    const state = location.searchParams.get('state');
    assert.match(state, /^[0-9a-f]{32}$/);
    const cookie = response.headers.get('set-cookie');
    const [value, ...attributes] = cookie.split(';').map((part) => part.trim());
    assert.equal(value, `${COOKIE_NAME}=github_${state}`);
    assert.deepEqual(new Set(attributes), new Set(['HttpOnly', 'Path=/', 'Max-Age=600', 'SameSite=Lax', 'Secure']));
  });

  test('auth rejects an unlisted site before redirecting to GitHub', async () => {
    const response = await request('/auth?provider=github&site_id=evil.example');
    assert.equal(response.headers.get('location'), null);
    authorize(await popup(response), 'error');
  });

  test('auth reports missing credentials through the GitHub popup protocol', async () => {
    const { GITHUB_CLIENT_SECRET: omitted, ...env } = ENV;
    const response = await request('/auth?provider=github&site_id=blog.srprolin.com', { env });
    assert.equal(response.headers.get('location'), null);
    authorize(await popup(response), 'error');
  });

  test('workflow scope is omitted unless the operator opts in', async () => {
    const response = await request('/auth?provider=github&site_id=blog.srprolin.com&scope=public_repo,user,workflow');
    assert.equal(response.status, 302);
    const scope = new URL(response.headers.get('location')).searchParams.get('scope');
    assert.deepEqual(new Set(scope.split(/[\s,]+/)), new Set(['public_repo', 'user']));
  });

  test('separate auth attempts have distinct state values', async () => {
    const path = '/auth?provider=github&site_id=blog.srprolin.com&scope=public_repo,user';
    const first = new URL((await request(path)).headers.get('location')).searchParams.get('state');
    const second = new URL((await request(path)).headers.get('location')).searchParams.get('state');
    assert.notEqual(first, second);
  });

  test('a matching cookie and state exchange the code and deliver the token after the popup handshake', async (t) => {
    const calls = mockExchange(t);
    const response = await callback({ cookie: `other=value; ${COOKIE_NAME}=github_${STATE}; another=value` });
    assert.equal(response.status, 200);
    assertCookieCleared(response);
    const page = await popup(response);
    assert.deepEqual(page.messages.map(({ data }) => data), ['authorizing:github']);
    assert.equal(page.listeners.size, 1);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://github.com/login/oauth/access_token');
    assert.equal(calls[0].method, 'POST');
    assert.match(calls[0].headers.get('accept') ?? '', /application\/json/);
    assert.deepEqual(await calls[0].json(), {
      code: 'test-code',
      client_id: ENV.GITHUB_CLIENT_ID,
      client_secret: ENV.GITHUB_CLIENT_SECRET,
      redirect_uri: `${AUTH_ORIGIN}/callback`,
    });
    assert.deepEqual(authorize(page, 'success'), { provider: 'github', token: TOKEN });
    assert.equal(page.listeners.size, 0, 'successful delivery must remove the message listener');
    page.dispatch();
    assert.equal(resultMessages(page).length, 1, 'repeated handshakes must not release the token again');
  });

  const invalidCallbacks = [
    ['missing cookie', { cookie: '' }],
    ['legacy cookie', { cookie: `csrf-token=github_${STATE}` }],
    ['cookie name with an extra prefix', { cookie: `attacker-${COOKIE_NAME}=github_${STATE}` }],
    ['cookie name with an extra suffix', { cookie: `${COOKIE_NAME}-attacker=github_${STATE}` }],
    ['missing state', { state: null }],
    ['empty state', { state: '' }],
    ['mismatched state', { state: 'f'.repeat(32) }],
    ['missing code', { code: null }],
    ['malformed cookie state', { cookie: `${COOKIE_NAME}=github_short` }],
    ['unsupported cookie provider', { cookie: `${COOKIE_NAME}=attacker_${STATE}` }],
  ];
  for (const [name, options] of invalidCallbacks) {
    test(`${name} returns an error without exchanging a token`, async (t) => {
      const calls = mockExchange(t);
      const response = await callback(options);
      assert.equal(calls.length, 0);
      const page = await popup(response);
      assert.deepEqual(page.messages.map(({ data }) => data), ['authorizing:github']);
      authorize(page, 'error');
      assert.equal(calls.length, 0);
    });
  }

  const exchangeFailures = [
    ['network failure', () => { throw new TypeError('test network failure'); }],
    ['non-JSON response', () => new Response('<html>not JSON</html>', { headers: { 'Content-Type': 'text/html' } })],
    ['non-2xx response carrying a token', () => Response.json({ access_token: TOKEN }, { status: 401 })],
    ['server failure', () => Response.json({ error: 'test_upstream_error' }, { status: 503 })],
    ['missing token', () => Response.json({})],
    ['empty token', () => Response.json({ access_token: '' })],
    ['null token', () => Response.json({ access_token: null })],
    ['OAuth error', () => Response.json({ error: 'bad_verification_code', error_description: 'test rejected code' })],
    ['OAuth error alongside a token', () => Response.json({ access_token: TOKEN, error: 'bad_verification_code' })],
  ];
  for (const [name, implementation] of exchangeFailures) {
    test(`${name} produces an error handshake result`, async (t) => {
      const calls = mockExchange(t, implementation);
      const response = await callback();
      assert.equal(calls.length, 1);
      assertCookieCleared(response);
      const page = await popup(response);
      authorize(page, 'error');
      assert.equal(page.listeners.size, 0);
    });
  }

  test('only the configured CMS origin and exact opener may complete the exact handshake', async (t) => {
    mockExchange(t);
    const page = await popup(await callback());
    const hostileOrigins = [
      'https://evil.example',
      'http://blog.srprolin.com',
      'https://blog.srprolin.com:444',
      'https://sub.blog.srprolin.com',
      'https://blog.srprolin.com.evil.example',
      'https://blog.srprolin.com@evil.example',
      'null',
      '',
      'not an origin',
    ];
    for (const origin of hostileOrigins) {
      page.dispatch({ origin });
      assert.equal(resultMessages(page).length, 0, `must reject origin ${JSON.stringify(origin)}`);
    }
    for (const source of [null, undefined, {}, page.window, { postMessage: page.opener.postMessage }]) {
      page.dispatch({ source });
      assert.equal(resultMessages(page).length, 0, 'must reject a different message source');
    }
    for (const data of [undefined, null, {}, ['authorizing:github'], 'authorizing:gitlab', 'authorizing:github:extra', 'authorization:github', 'authorizing:github ']) {
      page.dispatch({ data });
      assert.equal(resultMessages(page).length, 0, 'must reject a different handshake payload');
    }
    assert.deepEqual(authorize(page, 'success'), { provider: 'github', token: TOKEN });
    assert.equal(page.listeners.size, 0);
  });

  test('an absent CMS_ORIGIN never releases a token to the allowed domain or an attacker', async (t) => {
    mockExchange(t);
    const { CMS_ORIGIN: omitted, ...env } = ENV;
    const page = await popup(await callback({ env }));
    for (const origin of [CMS_ORIGIN, AUTH_ORIGIN, 'https://evil.example', 'null', '']) {
      page.dispatch({ origin });
    }
    assert.equal(resultMessages(page).length, 0);
  });

  test('error results also require the configured origin and actual opener', async (t) => {
    mockExchange(t, () => Response.json({ error: 'test_oauth_error' }));
    const page = await popup(await callback());
    page.dispatch({ origin: 'https://evil.example' });
    page.dispatch({ source: {} });
    assert.equal(resultMessages(page).length, 0);
    authorize(page, 'error');
    assert.equal(page.listeners.size, 0);
  });

  const hostileValue = 'test-\'"; </script><script>globalThis.__injected = true</script>\\\n\u2028\u2029';
  test('tokens containing quotes and script terminators round-trip as inert JSON', async (t) => {
    mockExchange(t, () => Response.json({ access_token: hostileValue }));
    const page = await popup(await callback());
    assert.match(page.html, /\\u003c/);
    assert.deepEqual(authorize(page, 'success'), { provider: 'github', token: hostileValue });
  });

  test('OAuth errors containing quotes and script terminators round-trip as inert JSON', async (t) => {
    mockExchange(t, () => Response.json({ error: hostileValue }));
    const page = await popup(await callback());
    assert.match(page.html, /\\u003c/);
    assert.equal(authorize(page, 'error').error, hostileValue);
  });
});
