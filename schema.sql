-- D1 database schema for blog statistics
-- Idempotent: safe to run on every deploy

CREATE TABLE IF NOT EXISTS page_views (
  path TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS site_stats (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS page_visitors (
  visitor_hash TEXT NOT NULL,
  path TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  PRIMARY KEY (visitor_hash, path, visit_date)
);

INSERT OR IGNORE INTO site_stats (key, value) VALUES ('total_views', 0);
INSERT OR IGNORE INTO site_stats (key, value) VALUES ('total_visitors', 0);
