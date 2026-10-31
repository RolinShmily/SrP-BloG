async function verify() {
  if (process.argv.length !== 4) {
    throw new Error('Usage: node scripts/verify-auth.mjs <auth-origin> <cms-origin>');
  }

  const authOrigin = new URL(process.argv[2]).origin;
  const cmsOrigin = new URL(process.argv[3]);
  const url = new URL('/auth', authOrigin);
  url.searchParams.set('provider', 'github');
  url.searchParams.set('site_id', cmsOrigin.hostname);
  url.searchParams.set('scope', 'public_repo,user');

  // Do not follow the redirect or start a GitHub authorization session.
  const response = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
  });
  if (response.status !== 302) {
    throw new Error(
      `OAuth readiness check failed: /auth returned HTTP ${response.status}, expected 302. ` +
      'Check OAuth secrets on the CMS Worker and its allowed CMS domain.',
    );
  }

  const location = new URL(response.headers.get('location') ?? '', authOrigin);
  if (
    location.origin !== 'https://github.com' ||
    location.pathname !== '/login/oauth/authorize' ||
    location.searchParams.get('redirect_uri') !== `${authOrigin}/callback` ||
    !location.searchParams.get('client_id') ||
    !location.searchParams.get('state')
  ) {
    throw new Error('OAuth readiness check failed: invalid GitHub redirect or callback URL.');
  }

  // Never log the redirect query, cookie, or credential values.
  console.log('OAuth readiness check passed: /auth redirects to GitHub with the expected callback.');
}

verify().catch((error) => {
  console.error(error instanceof Error ? error.message : 'OAuth readiness check failed.');
  process.exitCode = 1;
});
