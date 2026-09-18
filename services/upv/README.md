# srp-blog-upv

A self-contained page-view (PV) / unique-visitor (UV) counting service for the
blog, running on **Cloudflare Workers + D1** only.

**Zero runtime dependencies.** No Express, no Hono, no npm install step at all:
the whole service is `src/app.ts` (a Web `Request` → `Response` handler),
`src/store.ts` (all counting logic), `src/store-d1.ts` (a ~60-line D1 adapter)
and `src/worker.ts` (the Workers entry point). There is nothing to keep patched.

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
                       └───────────────┬───────────────────────┘
                                       │
                              src/store-d1.ts
                              (D1Database binding `DB`)
```

Path validation, visitor hashing (Web Crypto), the INSERT/UPDATE statements,
PV/UV/site semantics, error mapping and CORS all live in files that never touch
a runtime-specific API, so the same logic is trivially unit-testable.

### Directory tree

```
services/upv/
├── package.json                      # name: srp-blog-upv, type: module, zero deps
├── tsconfig.json                     # strict, ES2022 + DOM, allowImportingTsExtensions
├── wrangler.toml                     # Workers + D1 binding `DB` + [vars]
├── schema.sql                        # idempotent DDL (verbatim copy of SCHEMA_STATEMENTS)
├── .dev.vars.example                 # local secrets/vars for `wrangler dev`
└── src/
    ├── types.ts                      # Env, StatsPayload, HitResult, SqlRunner, D1 subset
    ├── store.ts                      # UPVStore + SqlUPVStore + hashing + validation + normalizePath
    ├── store-d1.ts                   # Cloudflare D1 driver
    ├── app.ts                        # fetch handler: routing, CORS, throttle, bot filter, errors
    └── worker.ts                     # export default { fetch } for Workers
```

---

## 2. Data model & privacy

`schema.sql` / `SCHEMA_STATEMENTS` (idempotent, `CREATE TABLE IF NOT EXISTS`;
also applied per isolate on cold start, which is just a safety net):

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
* If `SALT` is unset, the service falls back to the public constant
  `srp-blog-upv-dev-salt` **and logs a warning**. Never run production without
  `SALT`; set it with `wrangler secret put SALT`.

### Path normalisation

The blog is exported with `trailingSlash: true`, so one article is reachable as
both `/posts/foo` and `/posts/foo/`. `normalizePath()` strips trailing slashes
(root stays `/`) before anything touches the database, so the two spellings
cannot split a counter in two. `/api/stats` echoes each requested spelling back
in its response, so callers can look up exactly the path they asked for.

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
per request. Both spellings of a path return the same counters.

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
| 500 | `missing_binding` | deployed without the `DB` D1 binding |

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
  serving traffic concurrently, this is **best-effort only**. Real rate
  limiting belongs in Cloudflare WAF / Rate Limiting rules. Correctness of UV
  never depends on it: the database primary key is what deduplicates. The
  default is off so that every request is counted as a page view.
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
export function assertValidPath(path: unknown): asserts path is string;
export function normalizePath(path: string): string;            // trailing slash -> canonical
export function utcDate(nowMs?: number): string;                 // YYYY-MM-DD
export function computeVisitorHash(ip: string, userAgent: string, visitDate: string, salt: string): Promise<string>;
export function isBotUserAgent(userAgent: string | null | undefined): boolean;
```

Driver:

```ts
createD1Store(db: D1DatabaseLike): UPVStore
initD1Schema(db: D1DatabaseLike): Promise<void>
```

`D1DatabaseLike` is a local structural subset of Cloudflare's `D1Database`, so
the real binding is assignable without depending on `@cloudflare/workers-types`.

---

## 5. Local development

```bash
cd services/upv

cp .dev.vars.example .dev.vars     # local SALT + CORS origins (gitignored)

# Miniflare-backed local D1 (no Cloudflare account needed); applies migrations
# to a local database and serves on http://127.0.0.1:8787
npx wrangler dev

curl http://127.0.0.1:8787/api/health
```

Type-check (no build output, no dependencies installed):

```bash
npx tsc --noEmit -p services/upv/tsconfig.json
# or: npm run typecheck
```

`npm run` scripts available:

| Script | What it does |
| --- | --- |
| `dev` | `wrangler dev` — local Miniflare + local D1 |
| `deploy` | `wrangler deploy` |
| `typecheck` | `tsc --noEmit` |
| `db:schema` | apply `schema.sql` to the **remote** database |
| `db:export` | dump the remote database to `./backup-YYYYMMDD.sql` |

---

## 6. Deploy — Cloudflare Workers + D1

`wrangler.toml` is already pointed at the live database
(`database_name = "srp-blog-stats"`, `database_id = "427d66da-…"`), which is the
same D1 instance the previous Astro+Worker stack used — see §7 for carrying its
data over.

```bash
cd services/upv

# 1. Apply the schema (idempotent; also applied automatically on cold start)
npm run db:schema

# 2. Secret salt (never put SALT in wrangler.toml)
npx wrangler secret put SALT

# 3. Local edge emulation
npx wrangler dev

# 4. Ship it
npm run deploy
# -> https://srp-blog-upv.<account>.workers.dev

# 5. Verify + query D1 directly
curl -s https://srp-blog-upv.<account>.workers.dev/api/health
npx wrangler d1 execute srp-blog-stats --remote \
  --command "SELECT * FROM page_views ORDER BY views DESC LIMIT 10"
```

Production `[vars]` live in `wrangler.toml`; `ALLOWED_ORIGINS` should be
narrowed from `*` to the blog's origin before launch, e.g.

```toml
[vars]
ALLOWED_ORIGINS = "https://blog.example.com,https://www.blog.example.com"
```

Bind a custom domain under Workers → Settings → Domains & Routes (e.g.
`upv.example.com`), then point the blog at it (§8). `wrangler` is only needed
for deploys — it is not a runtime dependency and deliberately not in
`package.json`.

---

## 7. Cloudflare D1 数据库迁移与运维方案 (D1 Database Migration & Ops)

D1 是基于 SQLite 引擎构建的边缘分布式关系型数据库。以下是在日常维护、版本升级或跨库迁移时的标准最佳实践方案：

### 方案 A：Wrangler 官方标准迁移工作流（推荐：用于生产 Schema 演进）

Cloudflare 官方提供了内置的版本化迁移机制，底层通过 `d1_migrations` 追踪表保证每个 SQL 文件仅执行一次，避免重复应用。

1. **在 `wrangler.toml` 中配置迁移目录**：
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "srp-blog-stats"
   database_id = "427d66da-2ae5-43ff-8680-83f9065a9e64"
   migrations_dir = "migrations"
   ```

2. **创建新迁移文件**：
   ```bash
   npx wrangler d1 migrations create srp-blog-stats <migration_name>
   # 将在 migrations/ 目录下自动生成 0001_<migration_name>.sql
   ```

3. **本地沙箱环境验证**：
   ```bash
   npx wrangler d1 migrations apply srp-blog-stats --local
   ```

4. **安全应用至生产远程数据库**：
   ```bash
   # 查看待应用的迁移清单
   npx wrangler d1 migrations list srp-blog-stats --remote

   # 确认无误后应用到远端
   npx wrangler d1 migrations apply srp-blog-stats --remote
   ```

---

### 方案 B：直接 SQL 脚本执行（适用于初始化建表或单次数据修补）

对于一次性的 Schema 初始化或批量数据修复操作，可以直接通过 `execute` 指令加载 SQL 文件：

```bash
# 执行本地 SQL 文件到远端生产数据库
npx wrangler d1 execute srp-blog-stats --remote --file=./schema.sql

# 直接执行单条 SQL 命令（如查看表状态、核验行数）
npx wrangler d1 execute srp-blog-stats --remote --command="SELECT COUNT(*) FROM page_views;"
```

---

### 方案 C：全量备份与跨库恢复（容灾与克隆）

在任何重要数据变更前，务必先进行冷备份：

1. **备份/导出远端数据**：
   ```bash
   # 导出为标准 SQLite SQL dump 文件
   npx wrangler d1 export srp-blog-stats --remote --output=./backup-$(date +%Y%m%d).sql
   ```

2. **还原或克隆到新数据库**：
   ```bash
   # 导入到新建的或待恢复的 D1 数据库
   npx wrangler d1 execute <target_db_name> --remote --file=./backup-20260918.sql
   ```

---

## 8. Blog front-end integration

The front end is already wired in. Configuration lives in
`src/config/site.ts` under `siteConfig.upv`:

```ts
upv: {
  enabled: true,            // false hides every counter (no network requests)
  api: "https://upv.example.com",
  showPostCounter: true,    // article page + post cards
  showCardCounter: true,    // post cards specifically
  showArchivesStats: true,  // site-wide PV/UV cards on /archives
}
```

`siteConfig.upv.api` takes precedence over the build-time
`NEXT_PUBLIC_UPV_API`; leaving both empty keeps the components mounted but
reading zeros, so the layout never shifts.

* `src/lib/upv/client.ts` — `UPVAdapter { getStats(paths), hit(path) }`,
  `HttpUPVAdapter`, `NullUPVAdapter`, the auto-selected `upvClient` singleton
  (with microtask batching, so N post cards in one tick produce one request),
  and `isUpvConfigured()`. Every failure (unset API, offline, CORS, timeout,
  malformed JSON, ad-blocker) degrades to zeros rather than an error.
* `src/components/blog/upv-counter.tsx` — `'use client'` counter that hits once
  per path per browser session (`sessionStorage` guard) and otherwise reads.
  `context="card"` renders views only; skeletons are optional
  (`showSkeleton`). Takes all copy through props (no language hard-coded).
  `localized-upv-counter.tsx` wraps it with the i18n template.
* `src/components/blog/site-upv-cards.tsx` — the site-wide PV and UV cards.

Mount points:

| Where | What | File |
| --- | --- | --- |
| Article page | per-article views | `article-view.tsx` — `<LocalizedUPVCounter path={`/posts/${post.slug}`} />` |
| Post cards | per-article views | `post-card.tsx` — `context="card"` |
| Archives page | site-wide views + visitors | `archives-view.tsx` — `<SiteUpvCards />` |

Direct use of the primitive (copy passed in, no language baked in):

```tsx
import { UPVCounter } from "@/components/blog/upv-counter";

<UPVCounter
  path={`/posts/${slug}`}
  template="{views} views · {visitors} visitors"
  className="mt-1"
/>
```

**`NEXT_PUBLIC_UPV_API` is inlined at build time** — changing it requires a
rebuild and redeploy on Cloudflare Pages. The `siteConfig.upv.api` route avoids
that by being read from the exported bundle instead.

---

## 9. Known limitations

* No authentication on write endpoints (public counter by design) — rate limit
  at the edge if it is abused.
* The in-memory PV throttle is per isolate and therefore best-effort; UV
  correctness is guaranteed by the database, not by the throttle.
* `visitors` counts visitor-days, not distinct people over all time (by
  design: the hash is day-scoped, so lifetime-unique humans are unknowable).
* D1 has no interactive transactions; `hit()` is written as idempotent
  statements, so a retried request can inflate PV by one but never UV. Use
  `recount()` if the site counters ever look off.
* No referrer/geo/device reporting yet — the tables only need the columns above
  to serve the blog UI.
