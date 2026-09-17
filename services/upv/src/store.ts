/**
 * Platform-agnostic core of the UPV service.
 *
 * Everything that decides *what* is counted lives here and talks to the
 * database only through the `SqlRunner` interface (see types.ts). The three
 * concrete drivers — node:sqlite, bun:sqlite and Cloudflare D1 — are thin
 * adapters that implement `SqlRunner`, so VPS and Workers provably share one
 * implementation of the counting semantics.
 *
 * Privacy design (important):
 *   * A raw client IP is NEVER persisted and never leaves the request scope.
 *   * It is combined with the user agent, the UTC day and a server-side SALT
 *     and reduced to a truncated SHA-256 digest before it touches the DB:
 *         visitor_hash = sha256(ip + ua + utcDate + SALT).slice(0, 32)
 *     The digest is scoped to a single UTC day, so it cannot be used to
 *     follow a visitor across days even if the salt leaks. The salt makes
 *     preimage/rainbow-table recovery of IP+UA pairs infeasible.
 *   * Consequently the stored data is aggregate, not personal: no IP, no
 *     cookie, no device id. Rotating SALT "forgets" all visitor identity.
 *   * `/api/*` is served with CORS but the endpoint is public by design;
 *     deploy it behind your own proxy/CDN rate limiting.
 */

import type {
	HitInput,
	HitResult,
	PathStats,
	SqlRunner,
	StatsPayload,
	SiteStats,
} from "./types.ts";

export const SERVICE_NAME = "srp-blog-upv";

/** Fallback salt; a loud warning is logged when it is used. */
export const DEFAULT_SALT = "srp-blog-upv-dev-salt";

/** Longest accepted path. Longer values are rejected with 400. */
export const MAX_PATH_LENGTH = 512;

/** Maximum number of paths accepted by one `GET /api/stats` request. */
export const MAX_PATHS_PER_REQUEST = 100;

/**
 * Canonical schema. `schema.sql` (used by `wrangler d1 execute`) is a verbatim
 * copy of these statements; keep both in sync. Every statement is idempotent.
 */
export const SCHEMA_STATEMENTS: readonly string[] = [
	`CREATE TABLE IF NOT EXISTS page_views (
		path TEXT PRIMARY KEY,
		views INTEGER NOT NULL DEFAULT 0
	)`,
	`CREATE TABLE IF NOT EXISTS page_visitors (
		visitor_hash TEXT NOT NULL,
		path TEXT NOT NULL,
		visit_date TEXT NOT NULL,
		PRIMARY KEY (visitor_hash, path, visit_date)
	)`,
	`CREATE TABLE IF NOT EXISTS site_stats (
		key TEXT PRIMARY KEY,
		value INTEGER NOT NULL DEFAULT 0
	)`,
	`CREATE TABLE IF NOT EXISTS site_visitors (
		visitor_hash TEXT NOT NULL,
		visit_date TEXT NOT NULL,
		PRIMARY KEY (visitor_hash, visit_date)
	)`,
	`INSERT OR IGNORE INTO site_stats (key, value) VALUES ('total_views', 0)`,
	`INSERT OR IGNORE INTO site_stats (key, value) VALUES ('total_visitors', 0)`,
];

/** SQL used by the shared counting logic. */
const SQL = {
	upsertPageView: `INSERT INTO page_views (path, views) VALUES (?, 1)
		ON CONFLICT(path) DO UPDATE SET views = views + 1`,
	insertPageVisitor: `INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date) VALUES (?, ?, ?)`,
	insertSiteVisitor: `INSERT OR IGNORE INTO site_visitors (visitor_hash, visit_date) VALUES (?, ?)`,
	bumpTotalViews: `UPDATE site_stats SET value = value + 1 WHERE key = 'total_views'`,
	bumpTotalVisitors: `UPDATE site_stats SET value = value + 1 WHERE key = 'total_visitors'`,
	selectPageViews: `SELECT views FROM page_views WHERE path = ?`,
	selectPageVisitors: `SELECT COUNT(*) AS visitors FROM page_visitors WHERE path = ?`,
	selectSiteStat: `SELECT value FROM site_stats WHERE key = ?`,
	recountTotalViews: `UPDATE site_stats SET value = (SELECT COALESCE(SUM(views), 0) FROM page_views) WHERE key = 'total_views'`,
	recountTotalVisitors: `UPDATE site_stats SET value = (SELECT COUNT(*) FROM site_visitors) WHERE key = 'total_visitors'`,
} as const;

/** Thrown for domain-level input problems; the HTTP layer maps it to a 400. */
export class InvalidInputError extends Error {
	readonly code: string;

	constructor(code: string, message: string) {
		super(message);
		this.name = "InvalidInputError";
		this.code = code;
	}
}

/**
 * Storage abstraction implemented by SqlUPVStore for every runtime.
 * Swapping in a mock (tests) or a future KV-based store only requires this
 * interface, nothing in app.ts / worker.ts / server.ts changes.
 */
export interface UPVStore {
	/** Record one page view (+unique visitor bookkeeping) atomically-ish. */
	hit(input: HitInput): Promise<HitResult>;
	/** Batch read; unknown paths are reported as `{ views: 0, visitors: 0 }`. */
	getStats(paths: readonly string[]): Promise<StatsPayload>;
	/** Apply the idempotent schema. Safe to call on every boot. */
	migrate(): Promise<void>;
	/** Recompute the materialised site counters from the raw tables. */
	recount(): Promise<SiteStats>;
}

/** Returns `null` when the path is acceptable, otherwise a reason. */
export function validatePath(path: unknown): string | null {
	if (typeof path !== "string") return "path must be a string";
	if (path.length === 0) return "path must not be empty";
	if (path.length > MAX_PATH_LENGTH) return `path must be at most ${MAX_PATH_LENGTH} characters`;
	if (!path.startsWith("/")) return "path must start with '/'";
	// Reject control characters, whitespace and the classic injection sigils.
	// Values are always bound as SQL parameters, this is defence in depth.
	if (/[\u0000-\u001f\u007f\s]/.test(path)) return "path must not contain whitespace or control characters";
	if (/[<>"'`\\]/.test(path)) return "path contains illegal characters";
	return null;
}

export function assertValidPath(path: unknown): asserts path is string {
	const problem = validatePath(path);
	if (problem !== null) throw new InvalidInputError("invalid_path", problem);
}

/** UTC calendar day (`YYYY-MM-DD`) — the UV dedup bucket. */
export function utcDate(nowMs: number = Date.now()): string {
	return new Date(nowMs).toISOString().slice(0, 10);
}

/**
 * visitor_hash = sha256(ip + ua + utcDate + SALT).slice(0, 32)
 * Uses Web Crypto so the exact same code runs in Workers and Node >= 19.
 */
export async function computeVisitorHash(
	ip: string,
	userAgent: string,
	visitDate: string,
	salt: string,
): Promise<string> {
	const input = new TextEncoder().encode(`${ip}\n${userAgent}\n${visitDate}\n${salt}`);
	const digest = await crypto.subtle.digest("SHA-256", input);
	let hex = "";
	for (const byte of new Uint8Array(digest)) hex += byte.toString(16).padStart(2, "0");
	return hex.slice(0, 32);
}

/**
 * Very deliberately naive bot filter: keyword match on the user agent.
 * It is a courtesy filter for obvious crawlers, not a security control.
 */
const BOT_KEYWORDS: readonly string[] = [
	"bot",
	"crawler",
	"spider",
	"slurp",
	"scrapy",
	"headlesschrome",
	"phantomjs",
	"python-requests",
	"go-http-client",
	"okhttp",
	"semrush",
	"ahrefs",
	"yandex",
	"facebookexternalhit",
];

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
	if (!userAgent) return false;
	const ua = userAgent.toLowerCase();
	return BOT_KEYWORDS.some((keyword) => ua.includes(keyword));
}

/**
 * Shared implementation of the counting semantics on top of any SqlRunner.
 *
 * Semantics
 *   PV  : every accepted hit increments `page_views[path]` (and `total_views`).
 *   UV  : a row in `page_visitors(visitor_hash, path, visit_date)` — one per
 *         visitor + path + UTC day. `visitors` is the COUNT of those rows, so
 *         the number is cumulative over all days (visitor-days), matching the
 *         site-wide `total_visitors` counter.
 *   Site UV: one row per visitor + UTC day in `site_visitors`; the materialised
 *         `site_stats.total_visitors` counter is only bumped when that insert
 *         actually created a row (`changes > 0`).
 */
export class SqlUPVStore implements UPVStore {
	readonly #runner: SqlRunner;

	constructor(runner: SqlRunner) {
		this.#runner = runner;
	}

	async migrate(): Promise<void> {
		for (const statement of SCHEMA_STATEMENTS) {
			await this.#runner.execute(statement);
		}
	}

	async hit({ path, visitorHash, visitDate }: HitInput): Promise<HitResult> {
		assertValidPath(path);

		await this.#runner.execute(SQL.upsertPageView, [path]);
		await this.#runner.execute(SQL.insertPageVisitor, [visitorHash, path, visitDate]);
		const siteVisitor = await this.#runner.execute(SQL.insertSiteVisitor, [visitorHash, visitDate]);
		await this.#runner.execute(SQL.bumpTotalViews);
		if (siteVisitor.changes > 0) {
			await this.#runner.execute(SQL.bumpTotalVisitors);
		}

		const pathStats = await this.#readPathStats(path);
		const site = await this.#readSiteStats();
		return { path, ...pathStats, site };
	}

	async getStats(paths: readonly string[]): Promise<StatsPayload> {
		const unique = [...new Set(paths)];
		if (unique.length > MAX_PATHS_PER_REQUEST) {
			throw new InvalidInputError(
				"too_many_paths",
				`at most ${MAX_PATHS_PER_REQUEST} paths per request`,
			);
		}
		for (const path of unique) assertValidPath(path);

		const items: Record<string, PathStats> = {};
		for (const path of unique) {
			items[path] = await this.#readPathStats(path);
		}
		return { items, site: await this.#readSiteStats() };
	}

	async recount(): Promise<SiteStats> {
		await this.#runner.execute(SQL.recountTotalViews);
		await this.#runner.execute(SQL.recountTotalVisitors);
		return this.#readSiteStats();
	}

	async #readPathStats(path: string): Promise<PathStats> {
		const views = await this.#runner.first<{ views: number | bigint }>(SQL.selectPageViews, [path]);
		const visitors = await this.#runner.first<{ visitors: number | bigint }>(SQL.selectPageVisitors, [path]);
		return {
			views: Number(views?.views ?? 0),
			visitors: Number(visitors?.visitors ?? 0),
		};
	}

	async #readSiteStats(): Promise<SiteStats> {
		const views = await this.#runner.first<{ value: number | bigint }>(SQL.selectSiteStat, ["total_views"]);
		const visitors = await this.#runner.first<{ value: number | bigint }>(SQL.selectSiteStat, ["total_visitors"]);
		return {
			views: Number(views?.value ?? 0),
			visitors: Number(visitors?.value ?? 0),
		};
	}
}
