/**
 * HTTP layer: pure Web `Request` -> `Response` handler.
 *
 * No runtime-specific API is used here, so the handler stays a plain
 * `Request` -> `Response` function driven by worker.ts.
 */

import {
	DEFAULT_SALT,
	InvalidInputError,
	SERVICE_NAME,
	assertValidPath,
	computeVisitorHash,
	isBotUserAgent,
	normalizePath,
	utcDate,
	type UPVStore,
} from "./store.ts";
import type { Env, HitResult, PathStats } from "./types.ts";

export interface Logger {
	error(...args: unknown[]): void;
	warn(...args: unknown[]): void;
}

export interface HandlerOptions {
	store: UPVStore;
	env: Env;
	/** Injectable clock; mainly for tests. */
	now?: () => number;
	/** Overrides `env.THROTTLE_WINDOW_MS`. */
	throttleWindowMs?: number;
	logger?: Logger;
}

export type FetchHandler = (request: Request) => Promise<Response>;

/**
 * Best-effort per-IP/per-path PV throttle.
 *
 * IMPORTANT: this is a courtesy measure only. A Cloudflare Worker isolate is
 * recycled at will and multiple isolates serve traffic concurrently, so the
 * map is per-process and cannot be authoritative. UV dedup (the database
 * primary key) is what actually keeps the numbers honest; put rate limiting
 * in front of the service (nginx / Cloudflare WAF) for real protection.
 * Default window is 0 = disabled.
 */
class PvThrottle {
	readonly #windowMs: number;
	readonly #seen = new Map<string, number>();

	constructor(windowMs: number) {
		this.#windowMs = windowMs;
	}

	/** Returns true when the hit should not be counted again. */
	shouldSkip(key: string, nowMs: number): boolean {
		if (this.#windowMs <= 0) return false;
		if (this.#seen.size > 10_000) this.#prune(nowMs);
		const previous = this.#seen.get(key);
		if (previous !== undefined && nowMs - previous < this.#windowMs) return true;
		this.#seen.set(key, nowMs);
		return false;
	}

	#prune(nowMs: number): void {
		for (const [key, timestamp] of this.#seen) {
			if (nowMs - timestamp >= this.#windowMs) this.#seen.delete(key);
		}
	}
}

const JSON_HEADERS: Record<string, string> = {
	"content-type": "application/json; charset=utf-8",
	"cache-control": "no-store",
};

function corsHeaders(origin: string | null, allowedOrigins: readonly string[]): Record<string, string> {
	const headers: Record<string, string> = {
		"access-control-allow-methods": "GET, POST, OPTIONS",
		"access-control-allow-headers": "content-type, accept",
		"access-control-max-age": "86400",
		vary: "origin",
	};
	if (allowedOrigins.includes("*")) {
		headers["access-control-allow-origin"] = "*";
	} else if (origin !== null && allowedOrigins.includes(origin)) {
		headers["access-control-allow-origin"] = origin;
	}
	return headers;
}

function parseAllowedOrigins(raw: string | undefined): string[] {
	const list = (raw ?? "*")
		.split(",")
		.map((value) => value.trim())
		.filter((value) => value.length > 0);
	return list.length > 0 ? list : ["*"];
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
	return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...headers } });
}

function errorBody(code: string, message: string): { error: { code: string; message: string } } {
	return { error: { code, message } };
}

/** Prefer the CDN-provided client IP; fall back to proxy headers. */
function clientIp(request: Request): string {
	const direct = request.headers.get("cf-connecting-ip");
	if (direct) return direct.trim();
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		const first = forwarded.split(",")[0]?.trim();
		if (first) return first;
	}
	return request.headers.get("x-real-ip")?.trim() || "0.0.0.0";
}

/** Reads a JSON object body, mapping malformed input to a 400. */
async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
	let parsed: unknown;
	try {
		parsed = await request.json();
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new InvalidInputError("invalid_json", "request body must be valid JSON");
		}
		throw error;
	}
	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new InvalidInputError("invalid_json", "request body must be a JSON object");
	}
	return parsed as Record<string, unknown>;
}

function parsePathsParam(url: URL): string[] {
	return url.searchParams
		.getAll("paths")
		.flatMap((value) => value.split(","))
		.map((value) => value.trim())
		.filter((value) => value.length > 0);
}

export function createFetchHandler(options: HandlerOptions): FetchHandler {
	const { store, env } = options;
	const logger: Logger = options.logger ?? console;
	const now = options.now ?? Date.now;
	const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);
	const throttle = new PvThrottle(
		options.throttleWindowMs ?? (Number.parseInt(env.THROTTLE_WINDOW_MS ?? "0", 10) || 0),
	);
	const blockBots = env.BLOCK_BOTS !== "false";
	const salt = env.SALT?.trim() || DEFAULT_SALT;
	let warnedAboutSalt = false;

	async function snapshotHit(path: string): Promise<HitResult> {
		// `getStats` keys `items` by the canonical path, so look the normalised
		// form up and echo it back — otherwise a trailing-slash request would
		// report zeros for a path that has counters.
		const canonical = normalizePath(path);
		const stats = await store.getStats([canonical]);
		const pathStats: PathStats = stats.items[canonical] ?? { views: 0, visitors: 0 };
		return { path: canonical, views: pathStats.views, visitors: pathStats.visitors, site: stats.site };
	}

	return async function handle(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const cors = corsHeaders(request.headers.get("origin"), allowedOrigins);

		try {
			if (request.method === "OPTIONS") {
				return new Response(null, { status: 204, headers: cors });
			}

			if (url.pathname === "/api/health") {
				if (request.method !== "GET") {
					return json(errorBody("method_not_allowed", "use GET"), 405, { ...cors, allow: "GET, OPTIONS" });
				}
				return json({ ok: true, service: SERVICE_NAME }, 200, cors);
			}

			if (url.pathname === "/api/hit") {
				if (request.method !== "POST") {
					return json(errorBody("method_not_allowed", "use POST"), 405, {
						...cors,
						allow: "POST, OPTIONS",
					});
				}
				return await handleHit(request, cors);
			}

			if (url.pathname === "/api/stats") {
				if (request.method !== "GET") {
					return json(errorBody("method_not_allowed", "use GET"), 405, { ...cors, allow: "GET, OPTIONS" });
				}
				const requested = parsePathsParam(url);
				const payload = await store.getStats(requested);
				// The store keys `items` by the canonical path (no trailing slash);
				// echo every requested spelling back so callers can look up exactly
				// what they asked for.
				const items: Record<string, PathStats> = {};
				for (const path of requested) {
					items[path] = payload.items[normalizePath(path)] ?? { views: 0, visitors: 0 };
				}
				return json({ items, site: payload.site }, 200, cors);
			}

			if (url.pathname === "/") {
				return json(
					{
						ok: true,
						service: SERVICE_NAME,
						endpoints: ["GET /api/health", "GET /api/stats?paths=/a,/b", "POST /api/hit"],
					},
					200,
					cors,
				);
			}

			return json(errorBody("not_found", `no route for ${url.pathname}`), 404, cors);
		} catch (error) {
			if (error instanceof InvalidInputError) {
				return json(errorBody(error.code, error.message), 400, cors);
			}
			logger.error(`[${SERVICE_NAME}] unhandled error`, error);
			return json(errorBody("internal_error", "internal error"), 500, cors);
		}

		async function handleHit(request: Request, headers: Record<string, string>): Promise<Response> {
			const body = await readJsonBody(request);
			const path = body.path;
			const referrer = body.referrer;
			if (referrer !== undefined && (typeof referrer !== "string" || referrer.length > 2048)) {
				throw new InvalidInputError("invalid_referrer", "referrer must be a string of at most 2048 characters");
			}
			assertValidPath(path);

			const userAgent = request.headers.get("user-agent") ?? "";
			if (blockBots && isBotUserAgent(userAgent)) {
				// Crawlers get a truthful answer without polluting the counters.
				return json(await snapshotHit(path), 200, headers);
			}

			const timestamp = now();
			// Key the throttle by the canonical path so alternating between `/a` and
			// `/a/` cannot sidestep the window.
			if (throttle.shouldSkip(`${clientIp(request)}|${normalizePath(path)}`, timestamp)) {
				return json(await snapshotHit(path), 200, headers);
			}

			if (salt === DEFAULT_SALT && !warnedAboutSalt) {
				warnedAboutSalt = true;
				logger.warn(
					`[${SERVICE_NAME}] SALT is not set: using the public default salt. ` +
						"Visitor hashes are guessable — set SALT in production.",
				);
			}

			const visitDate = utcDate(timestamp);
			const visitorHash = await computeVisitorHash(clientIp(request), userAgent, visitDate, salt);
			const result = await store.hit({ path, visitorHash, visitDate });
			return json(result, 200, headers);
		}
	};
}
