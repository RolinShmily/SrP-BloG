# srp-blog-upv

A self-contained page-view (PV) / unique-visitor (UV) counting service for the
blog. **One core implementation, two deployments:**

| Target | Runtime | Database | Entry point |
| --- | --- | --- | --- |
| VPS / Docker / bare metal | Node ≥ 22.5 (or Bun) | SQLite (`node:sqlite` / `bun:sqlite`) | `src/server.ts` |
| Serverless edge | Cloudflare Workers | D1 (SQLite) | `src/worker.ts` |

**Zero runtime dependencies.** No Express, no Hono, no better-sqlite3, no npm
install step at all: the service is built from `node:http`, `node:sqlite`, Web
Crypto, the Web `Request`/`Response` pair and Node's native TypeScript type
stripping. There is nothing to keep patched, and the Docker image is just the
Node base image plus ~700 lines of code.

---

## 1. Architecture

```
                       ┌───────────────────────────────────────┐
   blog (Next.js)      │  src/app.ts  — Web-standard handler   │
   src/lib/upv/client ──►  GET /api/health  /api/stats           │
   <UPVCounter />       │  POST /api/hit   + CORS + throttle    │
                       └───────────────┬───────────────────────┘
                                       │  UPVStore (interface)
                       ┌───────────────▼───────────────────────┐
                       │  src/store.ts — ALL counting logic    │
                       │  SqlUPVStore over a SqlRunner          │
                       └───────┬───────────────────┬───────────┘
                               │                   │
              src/store-sqlite.ts            src/store-d1.ts
              (node:sqlite)                  (D1Database binding)
              src/store-bun.ts
              (bun:sqlite)
```

The only thing that differs between VPS and Cloudflare is a ~20-line
`SqlRunner` adapter. Path validation, visitor hashing (Web Crypto), the
INSERT/UPDATE statements, PV/UV/site semantics, error mapping and CORS live in
shared files used by both targets.

### Directory tree

```
services/upv/
├── package.json          # name: srp-blog-upv, type: module, zero runtime deps
├── tsconfig.json         # NodeNext, strict, allowImportingTsExtensions
├── schema.sql            # idempotent DDL (verbatim copy of SCHEMA_STATEMENTS)
├── Dockerfile            # node:22-alpine, non-root, SQLite volume, no build step
├── docker-compose.yml    # VPS deployment with a named data volume
├── wrangler.toml         # Workers + D1 binding `DB` (example)
├── .env.example          # PORT / DB_PATH / HOST / SALT / ALLOWED_ORIGINS / ...
├── .dockerignore
├── smoke-test.sh         # end-to-end curl test against a throwaway SQLite file
└── src/
    ├── types.ts          # Env, StatsPayload, HitResult, SqlRunner, D1 subset
    ├── store.ts          # UPVStore interface + SqlUPVStore core + hashing + validation
    ├── store-sqlite.ts   # node:sqlite driver (Node ≥ 22.5)
    ├── store-bun.ts      # bun:sqlite driver
    ├── store-d1.ts       # Cloudflare D1 driver
    ├── app.ts            # fetch handler: routing, CORS, throttle, bot filter, errors
    ├── worker.ts         # export default { fetch } for Workers
    ├── server.ts         # Node entry point
    ├── server.bun.ts     # Bun entry point
    ├── http-node.ts      # node:http <-> Web Request/Response glue
    └── bun-sqlite.d.ts   # minimal ambient types for bun:sqlite
```

---

## 2. Data model & privacy

`schema.sql` / `SCHEMA_STATEMENTS` (idempotent, `CREATE TABLE IF NOT EXISTS`):

| Table | Key | Meaning |
| --- | --- | --- |
| `page_views(path, views)` | `path` | Article page views (materialised counter) |
| `page_visitors(visitor_hash, path, visit_date)` | all three | Article UV — one row per visitor + path + UTC day |
| `site_stats(key, value)` | `key` | `total_views`, `total_visitors` counters |
| `site_visitors(visitor_hash, visit_date)` | both | Whole-site UV — one row per visitor + UTC day |

```
visitor_hash = sha256(ip + userAgent + utcDate + SALT).slice(0, 32)   # hex
```

**Privacy design — no raw IP is ever written to disk:**

* The IP and User-Agent are processed in memory only, hashed with a
  server-side secret salt, and reduced to a 32-hex-character digest.
* The digest is scoped to a single **UTC day**, so the same visitor produces a
  different hash tomorrow: cross-day tracking is impossible even if the
  database *and* the salt leak.
* The salt makes brute-forcing the (tiny) IPv4+UA space infeasible. Rotating
  `SALT` instantly "forgets" all previous visitor identities.
* No cookies, no localStorage ids, no fingerprinting, no third-party calls.
  Only aggregate counters are stored, which is why this endpoint can run
  without a cookie-consent banner — the personal data (IP/UA) is ephemeral and
  used solely for the counting purpose (legitimate interest under GDPR
  Art. 6(1)(f)). Document your own retention policy; a reasonable one is
  deleting raw visitor rows after 180–400 days:

  ```sql
  DELETE FROM page_visitors WHERE visit_date < date('now', '-400 day');
  DELETE FROM site_visitors WHERE visit_date < date('now', '-400 day');
  ```

  (Deleting rows lowers the reported lifetime `visitors` numbers; `views` is
  unaffected.)
* If `SALT` is unset, the server falls back to the public constant
  `srp-blog-upv-dev-salt` **and logs a warning**. Never run production without
  `SALT`; set it via `wrangler secret put SALT` / `UPV_SALT` in compose.

### Counting semantics

* **PV** — every accepted `POST /api/hit` increments `page_views[path]` and
  `site_stats.total_views` (unless the request is throttled or identified as a
  bot, in which case the current counters are returned unchanged).
* **Article UV** — reported as `COUNT(*)` of `page_visitors` rows for that
  path, i.e. distinct (visitor, UTC day) pairs accumulated over time
  ("visitor-days"). Two hits from one browser on the same day count once, and a
  second visitor adds one.
* **Site UV** — `total_visitors` is bumped only when the `INSERT OR IGNORE`
  into `site_visitors` actually created a row (`meta.changes > 0`), so one
  visitor reading five articles in a day still counts as one site visitor.
* `UPVStore.recount()` recomputes both materialised site counters from the raw
  tables — use it after manual SQL cleanup or if a write was interrupted.

---

## 3. HTTP API

All responses are JSON with `content-type: application/json; charset=utf-8`
and `cache-control: no-store`. Batch endpoints are additive and never fail on
unknown paths.

### `GET /api/health`

```bash
$ curl https://upv.example.com/api/health
{"ok":true,"service":"srp-blog-upv"}
```

### `POST /api/hit`

Request body: `{ "path": "/posts/hello", "referrer": "https://example.com" }`
(`referrer` is optional, validated, and currently not persisted).

```bash
$ curl -X POST https://upv.example.com/api/hit \
    -H 'content-type: application/json' \
    -H 'user-agent: SmokeTest/1.0' \
    -d '{"path":"/posts/hello"}'
{"path":"/posts/hello","views":1,"visitors":1,"site":{"views":1,"visitors":1}}
```

```bash
# same browser, same day -> PV advances, UV does not
$ curl -X POST .../api/hit -d '{"path":"/posts/hello"}' -H 'user-agent: SmokeTest/1.0'
{"path":"/posts/hello","views":2,"visitors":1,"site":{"views":2,"visitors":1}}

# different user agent (i.e. different visitor_hash) -> UV advances
$ curl -X POST .../api/hit -d '{"path":"/posts/hello"}' -H 'user-agent: SmokeTest/2.0'
{"path":"/posts/hello","views":3,"visitors":2,"site":{"views":3,"visitors":2}}
```

### `GET /api/stats?paths=/posts/a,/posts/b`

Missing paths come back as zeros; `site` is always included. At most 100 paths
per request.

```bash
$ curl 'https://upv.example.com/api/stats?paths=/posts/hello,/posts/missing'
{"items":{"/posts/hello":{"views":3,"visitors":2},"/posts/missing":{"views":0,"visitors":0}},"site":{"views":3,"visitors":2}}
```

### Errors

Errors are structured, never HTML, and always carry an HTTP status:

| Status | `code` | When |
| --- | --- | --- |
| 400 | `invalid_json` | body is not a JSON object / malformed |
| 400 | `invalid_path` | empty, > 512 chars, no leading `/`, whitespace, control chars or `< > " ' \` ` |
| 400 | `invalid_referrer` | `referrer` is not a string ≤ 2048 chars |
| 400 | `too_many_paths` | more than 100 paths in one stats request |
| 404 | `not_found` | unknown route |
| 405 | `method_not_allowed` | wrong verb (`allow` header included) |
| 500 | `internal_error` | unexpected exception (logged, not leaked) |
| 500 | `missing_binding` | Workers deploy without the `DB` D1 binding |

```json
{"error":{"code":"invalid_path","message":"path must start with '/'"}}
```

Every `path` is additionally bound as a SQL parameter, so the validation regex
is defence in depth rather than the only protection against injection.

### CORS

`ALLOWED_ORIGINS` is a comma-separated allow-list (`*` by default). Preflight
`OPTIONS` requests are answered with `204`, `access-control-allow-methods:
GET, POST, OPTIONS`, `access-control-allow-headers: content-type, accept` and
`access-control-max-age: 86400`. When the allow-list is not `*`, the matching
origin is echoed and `vary: origin` is set.

### Abuse handling (honest limits)

* **Bot filter** — a keyword match on the User-Agent (`bot`, `crawler`,
  `spider`, `scrapy`, `headlesschrome`, `python-requests`, …). Crawlers get a
  truthful `200` snapshot but do not change counters. Disable with
  `BLOCK_BOTS=false`. This is a courtesy filter, not security.
* **PV throttle** — in-memory per-IP/per-path window
  (`THROTTLE_WINDOW_MS`, default `0` = off). Because a Worker has many isolates
  and a VPS may run several processes, this is **best-effort only**. Real rate
  limiting belongs in nginx / Cloudflare WAF / Rate Limiting rules. Correctness
  of UV never depends on it: the database primary key is what deduplicates.
  The default is off so that every request is counted as a page view.
* `/api/hit` is unauthenticated by design (it is called from the browser). If
  you need write protection, put it behind a signed token or a Cloudflare
  Turnstile check with a tiny amount of work in `app.ts`.

---

## 4. Store abstraction

```ts
// src/types.ts
export type SqlValue = string | number | bigint | null | Uint8Array;

export interface SqlRunner {
  execute(sql: string, params?: readonly SqlValue[]): Promise<{ changes: number }>;
  first<T>(sql: string, params?: readonly SqlValue[]): Promise<T | null>;
  all<T>(sql: string, params?: readonly SqlValue[]): Promise<T[]>;
}

// src/store.ts
export interface UPVStore {
  /** Record one page view (+ unique-visitor bookkeeping). */
  hit(input: HitInput): Promise<HitResult>;             // HitInput = { path, visitorHash, visitDate }
  /** Batch read; unknown paths report { views: 0, visitors: 0 }. */
  getStats(paths: readonly string[]): Promise<StatsPayload>;
  /** Apply the idempotent schema (safe on every boot). */
  migrate(): Promise<void>;
  /** Recompute materialised site counters from the raw tables. */
  recount(): Promise<SiteStats>;
}

export class SqlUPVStore implements UPVStore { constructor(runner: SqlRunner) }

export const SCHEMA_STATEMENTS: readonly string[];
export function validatePath(path: unknown): string | null;      // null = ok
export function utcDate(nowMs?: number): string;                 // YYYY-MM-DD
export function computeVisitorHash(ip: string, userAgent: string, visitDate: string, salt: string): Promise<string>;
export function isBotUserAgent(userAgent: string | null | undefined): boolean;
```

Drivers:

```ts
createSqliteStore(dbPath?: string): SqliteUPVStore & { close(): void }   // Node
createBunSqliteStore(dbPath?: string): BunSqliteUPVStore & { close(): void }
createD1Store(db: D1DatabaseLike): UPVStore
initD1Schema(db: D1DatabaseLike): Promise<void>
```

`D1DatabaseLike` is a local structural subset of Cloudflare's `D1Database`, so
the real binding is assignable without depending on `@cloudflare/workers-types`.

---

## 5. Local development

```bash
cd services/upv

# Node (22.5+; the sqlite flag is a no-op on 24.x but required on 22.5-22.12)
PORT=8787 DB_PATH=./upv.sqlite SALT=dev-salt \
  node --experimental-sqlite --experimental-strip-types src/server.ts
# or: npm start     /    bun run src/server.bun.ts

curl http://127.0.0.1:8787/api/health
```

Type-check (no build output, no dependencies installed):

```bash
npx tsc --noEmit -p services/upv/tsconfig.json
```

End-to-end smoke test (starts a real server on a throwaway SQLite file in
`$TMPDIR`, exercises every endpoint with curl, then removes its temp files):

```bash
bash services/upv/smoke-test.sh
```

Sample output (trimmed):

```
### 2. POST /api/hit /posts/hello (twice, same UA -> PV=2, UV=1)
{"path":"/posts/hello","views":1,"visitors":1,"site":{"views":1,"visitors":1}}   HTTP 200
{"path":"/posts/hello","views":2,"visitors":1,"site":{"views":2,"visitors":1}}   HTTP 200

### 3. POST /api/hit /posts/hello (different UA -> PV=3, UV=2)
{"path":"/posts/hello","views":3,"visitors":2,"site":{"views":3,"visitors":2}}   HTTP 200

### 5. GET /api/stats?paths=/posts/hello,/posts/second,/posts/missing
{"items":{"/posts/hello":{"views":3,"visitors":2},"/posts/second":{"views":1,"visitors":1},"/posts/missing":{"views":0,"visitors":0}},"site":{"views":4,"visitors":2}}   HTTP 200

### 6. POST /api/hit with an illegal path -> 400
{"error":{"code":"invalid_path","message":"path must start with '/'"}}           HTTP 400
```

---

## 6. Deploy — VPS / Docker

```bash
cd services/upv

# 1. Build and start (the healthcheck waits until /api/health answers)
export UPV_SALT="$(openssl rand -hex 32)"
export UPV_ALLOWED_ORIGINS="https://blog.example.com"
docker compose up -d --build

# 2. Verify
curl -s http://127.0.0.1:8787/api/health
docker compose logs -f upv

# 3. Upgrade / rollback
docker compose build --pull && docker compose up -d
```

Counters live in the `upv-data` volume (`/data/upv.sqlite`). Without Compose:

```bash
docker build -t srp-blog-upv ./services/upv
docker run -d --name srp-blog-upv --restart unless-stopped \
  -p 127.0.0.1:8787:8787 \
  -e SALT="$(openssl rand -hex 32)" \
  -e ALLOWED_ORIGINS="https://blog.example.com" \
  -v upv-data:/data srp-blog-upv
```

Hardened systemd-less setup: bind the port to `127.0.0.1` and reverse-proxy
with nginx/Caddy for TLS, gzip and rate limiting (`limit_req`).

Backups are a file copy (WAL mode, so also copy the `-wal`/`-shm` siblings, or
use `sqlite3 upv.sqlite ".backup '/backup/uv-$(date +%F).sqlite'"`).

---

## 7. Deploy — Cloudflare Workers + D1

```bash
cd services/upv

# 1. Create the database, copy the printed database_id into wrangler.toml
npx wrangler d1 create srp-blog-upv

# 2. Apply the schema (local for `wrangler dev`, --remote for production)
npx wrangler d1 execute srp-blog-upv --file=./schema.sql
npx wrangler d1 execute srp-blog-upv --file=./schema.sql --remote

# 3. Secret salt (never put SALT in wrangler.toml)
npx wrangler secret put SALT

# 4. Local edge emulation (Miniflare + local D1)
npx wrangler dev

# 5. Ship it
npx wrangler deploy
# -> https://srp-blog-upv.<account>.workers.dev

# 6. Verify + query D1 directly
curl -s https://srp-blog-upv.<account>.workers.dev/api/health
npx wrangler d1 execute srp-blog-upv --remote \
  --command "SELECT * FROM page_views ORDER BY views DESC LIMIT 10"
```

Find the database id with `npx wrangler d1 list`. Bind a custom domain under
Workers → Settings → Domains & Routes (e.g. `upv.example.com`), then point
`NEXT_PUBLIC_UPV_API` at it. `wrangler` is only needed for deploys — it is not a
runtime dependency of the service and is intentionally not in `package.json`.

Optional: enable D1 read replication or Workers analytics later; the counters
are plain SQL and portable, so `sqlite3 upv.sqlite .dump` can seed D1 if you
migrate from the VPS deployment.

---

## 8. Blog front-end integration

The front end is already wired in — three files, two mount points:

* `src/lib/upv/client.ts` — `UPVAdapter { getStats(paths), hit(path) }`,
  `HttpUPVAdapter` (reads `NEXT_PUBLIC_UPV_API`), `NullUPVAdapter`, and the
  auto-selected `upvClient` singleton. Every failure (unset env, offline,
  CORS, timeout, malformed JSON, ad-blocker) resolves to `null`, so the blog
  can never break because of analytics.
* `src/components/blog/upv-counter.tsx` — `'use client'` counter that hits once
  per path per browser session (`sessionStorage` guard) and otherwise reads,
  shows a skeleton while loading, renders **nothing** when the API is
  unavailable, and takes all copy through props (no language hard-coded).
  `localized-upv-counter.tsx` wraps it with the i18n template.
* `src/components/blog/site-upv-cards.tsx` — the site-wide PV and UV cards.

Mount points:

| Where | What | File |
| --- | --- | --- |
| Article page | per-article PV/UV line | `article-view.tsx` — `<LocalizedUPVCounter path={`/posts/${post.slug}`} />` |
| Archives page | site-wide PV + UV cards | `archives-view.tsx` — `<SiteUpvCards />` |

Direct use of the primitive (copy passed in, no language baked in):

```tsx
import { UPVCounter } from "@/components/blog/upv-counter";

<UPVCounter
  path={`/posts/${slug}`}
  template="{views} views · {visitors} visitors"
  className="mt-1"
/>
```

Set the API base URL in `.env.local` (see the repository-root `.env.example`):

```bash
NEXT_PUBLIC_UPV_API=https://upv.example.com
```

Leaving it empty disables the counters without any code change. **This is a
build-time value** — Next.js inlines it into the client bundle, so changing it
requires a rebuild (and a redeploy on Cloudflare Pages).

---

## 9. Known limitations

* No authentication on write endpoints (public counter by design) — rate limit
  at the edge if it is abused.
* The in-memory PV throttle is per process/isolate and therefore best-effort;
  UV correctness is guaranteed by the database, not by the throttle.
* `visitors` counts visitor-days, not distinct people over all time (by
  design: the hash is day-scoped, so lifetime-unique humans are unknowable).
* D1 has no interactive transactions; `hit()` is written as idempotent
  statements, so a retried request can inflate PV by one but never UV. Use
  `recount()` if the site counters ever look off.
* No referrer/geo/device reporting yet — the tables only need the columns above
  to serve the blog UI.
