/**
 * Shared types for the srp-blog UPV service (Cloudflare Workers + D1).
 *
 * This file must stay dependency-free and must not import anything from
 * `node:*`, so the Worker bundle stays clean.
 */

/** Bindings/environment, as declared in wrangler.toml `[vars]` + secrets. */
export interface Env {
	/** Cloudflare D1 binding (declared in wrangler.toml as `DB`). */
	DB?: D1DatabaseLike;
	/** Secret salt mixed into the visitor hash. See computeVisitorHash(). */
	SALT?: string;
	/** Comma-separated CORS allow-list, or `*`. Defaults to `*`. */
	ALLOWED_ORIGINS?: string;
	/** Best-effort PV throttle window in ms. `0`/unset disables it. */
	THROTTLE_WINDOW_MS?: string;
	/** `false` disables the UA keyword bot filter. Defaults to enabled. */
	BLOCK_BOTS?: string;
}

/** Per-path counters. */
export interface PathStats {
	views: number;
	visitors: number;
}

/** Site-wide counters. */
export interface SiteStats {
	views: number;
	visitors: number;
}

/** Response body of `POST /api/hit`. */
export interface HitResult extends PathStats {
	path: string;
	site: SiteStats;
}

/** Response body of `GET /api/stats`. */
export interface StatsPayload {
	items: Record<string, PathStats>;
	site: SiteStats;
}

/** Arguments passed from the HTTP layer into the store. */
export interface HitInput {
	path: string;
	/** sha256-derived, non-reversible visitor identity (never a raw IP). */
	visitorHash: string;
	/** UTC calendar day, `YYYY-MM-DD`. */
	visitDate: string;
}

/** Values accepted by a parameterised SQL statement. */
export type SqlValue = string | number | bigint | null | Uint8Array;

/**
 * Minimal SQL surface needed by store.ts, implemented by the D1 driver.
 */
export interface SqlRunner {
	execute(sql: string, params?: readonly SqlValue[]): Promise<{ changes: number }>;
	first<T>(sql: string, params?: readonly SqlValue[]): Promise<T | null>;
	all<T>(sql: string, params?: readonly SqlValue[]): Promise<T[]>;
}

/**
 * Structural subset of Cloudflare's `D1Database`.
 *
 * Declared locally (instead of depending on `@cloudflare/workers-types`) so
 * this package keeps zero dependencies. The real binding from
 * `@cloudflare/workers-types` / `wrangler types` is structurally assignable.
 */
export interface D1DatabaseLike {
	prepare(query: string): D1PreparedStatementLike;
	exec(query: string): Promise<unknown>;
	batch<T = unknown>(statements: D1PreparedStatementLike[]): Promise<T[]>;
}

export interface D1PreparedStatementLike {
	bind(...values: SqlValue[]): D1PreparedStatementLike;
	first<T = unknown>(): Promise<T | null>;
	all<T = unknown>(): Promise<{ results?: T[] }>;
	run(): Promise<{ meta?: { changes?: number; last_row_id?: number } }>;
}
