# Sveltia CMS GitHub OAuth Worker

Sveltia CMS is served at `/admin/` from the static files in `public/admin/`.
This independent Cloudflare Worker handles GitHub OAuth sign-in. After signing in,
the CMS uses the user's GitHub permissions to read and write repository content.

The examples below use `blog.example.com` for the blog and `auth.example.com` for
the OAuth Worker. Replace them with your own domains and keep the Worker, CMS
configuration, and GitHub OAuth App settings consistent.

```text
https://blog.example.com/admin/
  → https://auth.example.com/auth
  → GitHub OAuth authorization
  → https://auth.example.com/callback
  → The original CMS window receives the token
  → Sveltia CMS saves content through the GitHub API
  → Content commits on main trigger the blog build and deployment
```

## Files and upstream source

```text
services/cms/
├── wrangler.toml         # Worker name, route, and allowed CMS origin
├── package.json          # Checks, tests, local development, and deployment
├── .dev.vars.example     # Local variable template; real .dev.vars is ignored
├── LICENSE.txt           # Upstream MIT license and copyright notice
├── src/auth.js           # Pinned upstream authenticator with local changes
├── src/worker.js         # Worker entry point, health check, and response headers
├── scripts/prepare-secrets.mjs # Private temporary secrets file for CI deployment
├── scripts/verify-auth.mjs # Live OAuth redirect readiness check
└── test/                 # OAuth and deployment tests with dummy credentials
```

`src/auth.js` is based on [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth),
pinned to commit [`33500e16141793d4be3d878abb9733658069f5b7`](https://github.com/sveltia/sveltia-cms-auth/tree/33500e16141793d4be3d878abb9733658069f5b7).
The upstream MIT license is preserved. The service has no npm runtime dependencies.
Local changes include:

- Require the exact `CMS_ORIGIN` and verify that popup messages come from `window.opener`.
- Serialize the complete result message and escape `<` before embedding it in an inline script.
- Use a `__Host-cms-csrf` state cookie scoped to the authentication host.
- Send the same explicit `/callback` URL in GitHub authorization and token requests.
- Validate upstream HTTP status, JSON, nonempty tokens, and OAuth errors; report network failures.
- Use the GitHub handshake for errors such as missing cookies so the CMS can display the failure.
- Remove the listener after delivery and set `Cache-Control: no-store` and `Referrer-Policy: no-referrer` on responses.

When updating upstream code, pin the new commit, review these differences, and run
the tests. Preserve the local changes when replacing the vendored source.

## GitHub OAuth App and domains

An existing **GitHub OAuth App** can be reused. Register or update it in
[GitHub's OAuth Apps settings](https://github.com/settings/developers):

| Setting | Example value |
| --- | --- |
| Homepage URL | `https://blog.example.com/admin/` |
| Authorization callback URL | `https://auth.example.com/callback` |
| Worker hostname | `auth.example.com` |
| CMS hostname and origin | `blog.example.com` / `https://blog.example.com` |

Update `wrangler.toml` for your deployment. For example:

```toml
name = "cms-oauth"
main = "src/worker.js"
compatibility_date = "2026-10-01"
workers_dev = false
preview_urls = false

routes = [
  { pattern = "auth.example.com/*", zone_name = "example.com" },
]

[vars]
ALLOWED_DOMAINS = "blog.example.com"
CMS_ORIGIN = "https://blog.example.com"
```

This configuration uses a Workers route. Create a **proxied DNS record** for
`auth.example.com` in the `example.com` zone before deployment. For a hostname
handled entirely by this Worker, an `AAAA` record pointing to `100::` with the
Cloudflare proxy enabled is sufficient. Configure DNS and HTTPS in the zone;
deploying the route does not create the DNS record.

The `workers.dev` endpoint and preview URLs are disabled, so production
authentication uses the configured route.

**When taking over an existing service, set `name` to its actual Worker name in
Cloudflare.** A hostname does not identify the internal Worker name. Reusing the
existing name preserves its Worker Secrets and keeps the route attached to the
intended Worker.

Update [`public/admin/config.yml`](../../public/admin/config.yml) to match:

```yaml
backend:
  name: github
  repo: your-user/your-blog
  branch: main
  site_domain: blog.example.com
  auth_scope: public_repo
  base_url: https://auth.example.com
  auth_endpoint: auth
```

For a public repository, use `public_repo`; Sveltia also requests a user profile
scope. Content editing does not require the `workflow` scope, which is disabled by
default. Existing OAuth grants may retain broader permissions; changing the
requested scope does not revoke prior grants. Use an appropriate scope such as
`repo` if your repository is private.

## Automatic deployment and Secrets

The independent workflow is [`.github/workflows/cms.yml`](../../.github/workflows/cms.yml):

- Changes to `services/cms/**`, `public/admin/**`, or the workflow trigger checks.
- Pull requests run syntax checks, mocked OAuth tests, and a Wrangler deployment dry run without production Secrets.
- Pushes to `main`, or manual workflow runs on `main`, deploy the Worker after checks pass.
- Deployment explicitly selects `services/cms/wrangler.toml` and binds OAuth Secrets in the same Wrangler command.
- A post-deployment check requires `/auth` to redirect to GitHub with the expected callback; a reachable Worker alone is insufficient.
- Wrangler is pinned to `4.152.0`; the root dependencies and lockfile are unaffected.

Configure these repository Secrets under **Settings → Secrets and variables → Actions**:

| Repository secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Deploy the target Worker and manage Workers routes in the configured zone; an existing blog deployment token can be reused if it has the required permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID; can be shared with the blog deployment |
| `CMS_GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `CMS_GITHUB_CLIENT_SECRET` | GitHub OAuth App Client secret |

GitHub does not allow repository Secret names starting with `GITHUB_`, so the
OAuth credentials use a `CMS_` prefix. CI maps them to `GITHUB_CLIENT_ID` and
`GITHUB_CLIENT_SECRET` in a temporary JSON file with mode `0600`, then deploys
with `--config wrangler.toml --secrets-file <temporary-file>`. The file is removed
when the job finishes, including on failure. Credentials are kept out of logs,
`[vars]`, and static build output. CI checks that all four values are present
and reports only the names of missing Secrets.

Every Wrangler operation must explicitly select its configuration. The action's
automatic `secrets` upload does not inherit `--config` from the deploy command
and can select the repository-root blog Worker in this monorepo, so this workflow
passes the Secrets file directly to the configured CMS deployment instead.

Changes limited to the CMS service or its workflow skip the blog's `deploy.yml`
and `indexnow.yml` builds. Changes to `public/admin/` still deploy the blog's static
files. Content saved through the CMS still triggers normal blog publication:
these commits use the user's OAuth token, so they can trigger push workflows.

## Local checks and manual deployment

Use Node.js 22.5 or newer. Syntax checks and tests require no dependency installation:

```bash
cd services/cms
npm run check
npm test
npm run deploy:dry-run
```

The dry run bundles and validates the Worker without uploading it or changing
production. It does not perform a real GitHub sign-in.

For local development:

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars locally with credentials from a separate test OAuth App.
npm run dev
```

For a real local sign-in, register `http://localhost:8787/callback` as the test
OAuth App's callback. Set the local CMS configuration to
`base_url: http://localhost:8787` and `site_domain: localhost`, and set
`CMS_ORIGIN` in `.dev.vars` to the actual local CMS origin. Use a separate test App
to keep the production App's callback intact. The state cookie uses `Secure`;
local testing requires a browser-supported localhost origin or HTTPS.

For manual deployment, run the following from this directory after checking the
Worker name, zone, and proxied DNS record:

```bash
npx --yes wrangler@4.152.0 secret put GITHUB_CLIENT_ID --config wrangler.toml
npx --yes wrangler@4.152.0 secret put GITHUB_CLIENT_SECRET --config wrangler.toml
npm run deploy
```

The CLI prompts for credentials. Keep real values out of commands, configuration
files, Git commits, and logs. Secrets set manually in Cloudflare are not copied to
GitHub; automatic deployment still requires the repository Secrets listed above.

After deployment:

```bash
curl https://auth.example.com/api/health
# {"ok":true,"service":"srp-blog-cms"}

npm run verify:auth -- https://auth.example.com https://blog.example.com
```

The health check confirms that the Worker is reachable. The readiness check
requires a valid GitHub authorization redirect and does not follow it or print
credential values. It detects missing Worker credentials before a user attempts
to sign in. Complete verification by
signing in from `https://blog.example.com/admin/`, checking the GitHub callback
origin, and confirming that existing content loads in the CMS. The automated tests
mock GitHub exchanges and popup messages; real sign-in must be checked separately.
