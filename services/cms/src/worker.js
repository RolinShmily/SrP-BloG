import authenticator from './auth.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const response =
      request.method === 'GET' && pathname === '/api/health'
        ? Response.json({ ok: true, service: 'srp-blog-cms' })
        : await authenticator.fetch(request, env);

    // OAuth callback pages contain a token; neither caches nor referrers should retain it.
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('X-Content-Type-Options', 'nosniff');

    return new Response(response.body, { status: response.status, headers });
  },
};
