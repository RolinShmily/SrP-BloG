-- ---------------------------------------------------------------------------
-- srp-blog-upv schema (SQLite / Cloudflare D1)
--
-- Idempotent: safe to run on every boot/deploy.
--
--   Node / Bun : applied automatically on startup (src/store.ts)
--   Cloudflare : wrangler d1 execute srp-blog-upv --file=./schema.sql
--                (add --remote to target the production database)
--
-- This file is a verbatim copy of SCHEMA_STATEMENTS in src/store.ts; keep both
-- in sync when changing the model.
--
-- Privacy: `visitor_hash` is sha256(ip + userAgent + utcDate + SALT).slice(0,32).
-- A raw IP address is never stored, so the tables hold aggregate counts, not
-- personal data. The hash is scoped to one UTC day, which prevents cross-day
-- tracking of an individual visitor.
-- ---------------------------------------------------------------------------

-- Page views per path (article PV). `views` is a materialised counter.
CREATE TABLE IF NOT EXISTS page_views (
	path TEXT PRIMARY KEY,
	views INTEGER NOT NULL DEFAULT 0
);

-- Unique visitor-days per path: one row per (visitor_hash, path, UTC day).
-- `visitors` is reported as COUNT(*) over these rows.
CREATE TABLE IF NOT EXISTS page_visitors (
	visitor_hash TEXT NOT NULL,
	path TEXT NOT NULL,
	visit_date TEXT NOT NULL,
	PRIMARY KEY (visitor_hash, path, visit_date)
);

-- Materialised site-wide counters: `total_views`, `total_visitors`.
CREATE TABLE IF NOT EXISTS site_stats (
	key TEXT PRIMARY KEY,
	value INTEGER NOT NULL DEFAULT 0
);

-- Unique visitor-days for the whole site (drives `total_visitors`).
CREATE TABLE IF NOT EXISTS site_visitors (
	visitor_hash TEXT NOT NULL,
	visit_date TEXT NOT NULL,
	PRIMARY KEY (visitor_hash, visit_date)
);

INSERT OR IGNORE INTO site_stats (key, value) VALUES ('total_views', 0);
INSERT OR IGNORE INTO site_stats (key, value) VALUES ('total_visitors', 0);
