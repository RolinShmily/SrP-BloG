/**
 * Front-end adapter for the srp-blog UPV service (`services/upv/`).
 *
 * Design rules:
 *   * The blog must never break because analytics are unavailable. Every
 *     method resolves to `null` on any failure (unset env var, offline device,
 *     CORS rejection, malformed payload, timeout, ad-blocker, ...).
 *
 * Consumers use the components rather than this module directly:
 *   * `<UPVCounter />` (`@/components/blog/upv-counter`) — per-article PV/UV.
 *   * `<SiteUpvCards />` (`@/components/blog/site-upv-cards`) — site-wide PV/UV
 *     for the archives page.
 *
 * Configure with (see the repository-root `.env.example`):
 *   NEXT_PUBLIC_UPV_API=https://upv.example.com
 */

import { siteConfig } from "@/config/site";

export interface UPVPathStats {
	views: number;
	visitors: number;
}

export interface UPVSiteStats {
	views: number;
	visitors: number;
}

/**
 * Normalised response shape.
 *
 * `getStats()` fills `items` with one entry per requested path (missing paths
 * are reported as zeros by the API). `hit()` additionally sets `path`, `views`
 * and `visitors` to the counters of the path that was just recorded.
 */
export interface UPVStats {
	items: Record<string, UPVPathStats>;
	site: UPVSiteStats;
	path?: string;
	views?: number;
	visitors?: number;
}

/** Contract implemented by the HTTP adapter and the no-op fallback. */
export interface UPVAdapter {
	getStats(paths: string[]): Promise<UPVStats | null>;
	hit(path: string): Promise<UPVStats | null>;
}

export interface HttpUPVAdapterOptions {
	/** Abort a request after this many ms. Defaults to 4000. */
	timeoutMs?: number;
	/** Log failures to the console. Off by default: failures are silent. */
	debug?: boolean;
}

/** Used when no API is configured; keeps every caller branch-free with zero counts. */
export class NullUPVAdapter implements UPVAdapter {
	async getStats(paths: string[]): Promise<UPVStats> {
		const items: Record<string, UPVPathStats> = {};
		for (const path of paths) {
			items[path] = { views: 0, visitors: 0 };
		}
		return { items, site: { views: 0, visitors: 0 } };
	}

	async hit(path: string): Promise<UPVStats> {
		return {
			items: { [path]: { views: 0, visitors: 0 } },
			site: { views: 0, visitors: 0 },
			path,
			views: 0,
			visitors: 0,
		};
	}
}

class HttpUPVAdapter implements UPVAdapter {
	readonly #baseUrl: string;
	readonly #timeoutMs: number;
	readonly #debug: boolean;

	#pendingBatch: {
		paths: Set<string>;
		resolvers: Array<{
			resolve: (stats: UPVStats | null) => void;
		}>;
	} | null = null;

	constructor(baseUrl: string, options: HttpUPVAdapterOptions = {}) {
		this.#baseUrl = baseUrl.trim().replace(/\/+$/, "");
		this.#timeoutMs = options.timeoutMs ?? 4000;
		this.#debug = options.debug ?? false;
	}

	async getStats(paths: string[]): Promise<UPVStats | null> {
		const unique = [...new Set(paths)].filter((path) => typeof path === "string" && path.length > 0);
		// An empty path list is a valid request: the service answers with the
		// site-wide aggregate only (`{ items: {}, site: { views, visitors } }`).
		if (unique.length === 0) {
			return parseStatsPayload(await this.#request("/api/stats?paths="));
		}

		// Microtask batching: if multiple components call getStats in the same tick
		// (e.g. multiple post cards in a list), combine them into a single HTTP request.
		return new Promise<UPVStats | null>((resolve) => {
			if (!this.#pendingBatch) {
				const currentBatch: {
					paths: Set<string>;
					resolvers: Array<{
						resolve: (stats: UPVStats | null) => void;
					}>;
				} = {
					paths: new Set<string>(),
					resolvers: [],
				};
				this.#pendingBatch = currentBatch;

				const schedule =
					typeof queueMicrotask === "function"
						? queueMicrotask
						: (fn: () => void) => void Promise.resolve().then(fn);

				schedule(async () => {
					this.#pendingBatch = null;
					const allPaths = [...currentBatch.paths];
					const query = allPaths.map((p) => encodeURIComponent(p)).join(",");
					const payload = parseStatsPayload(await this.#request(`/api/stats?paths=${query}`));
					const result = payload ?? {
						items: Object.fromEntries(allPaths.map((p) => [p, { views: 0, visitors: 0 }])),
						site: { views: 0, visitors: 0 },
					};
					for (const item of currentBatch.resolvers) {
						item.resolve(result);
					}
				});
			}

			for (const p of unique) {
				this.#pendingBatch.paths.add(p);
			}
			this.#pendingBatch.resolvers.push({ resolve });
		});
	}

	async hit(path: string): Promise<UPVStats | null> {
		if (typeof path !== "string" || path.length === 0) return null;
		const raw = await this.#request("/api/hit", {
			method: "POST",
			body: JSON.stringify({ path }),
			headers: { "content-type": "application/json" },
		});
		const payload = parseHitPayload(raw, path);
		if (payload) return payload;
		return {
			items: { [path]: { views: 0, visitors: 0 } },
			site: { views: 0, visitors: 0 },
			path,
			views: 0,
			visitors: 0,
		};
	}

	async #request(
		resource: string,
		init: { method: string; body?: string; headers?: Record<string, string> } = { method: "GET" },
	): Promise<unknown | null> {
		if (typeof fetch !== "function") return null;
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.#timeoutMs);
		try {
			const response = await fetch(`${this.#baseUrl}${resource}`, {
				method: init.method,
				headers: { accept: "application/json", ...init.headers },
				body: init.body,
				cache: "no-store",
				credentials: "omit",
				referrerPolicy: "no-referrer",
				signal: controller.signal,
			});
			if (!response.ok) {
				this.#debugLog(`HTTP ${response.status} for ${resource}`);
				return null;
			}
			return await response.json();
		} catch (error) {
			// AbortError (timeout), TypeError (network/CORS), SyntaxError (bad JSON).
			if (error instanceof Error) this.#debugLog(`${error.name}: ${error.message}`);
			else this.#debugLog("unknown fetch failure");
			return null;
		} finally {
			clearTimeout(timer);
		}
	}

	#debugLog(message: string): void {
		if (this.#debug) console.warn(`[upv] ${message}`);
	}
}

function toCount(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.trunc(value) : 0;
}

function parsePathStats(value: unknown): UPVPathStats | null {
	if (value === null || typeof value !== "object") return null;
	const record = value as Record<string, unknown>;
	return { views: toCount(record.views), visitors: toCount(record.visitors) };
}

function parseSiteStats(value: unknown): UPVSiteStats {
	const parsed = parsePathStats(value);
	return parsed ?? { views: 0, visitors: 0 };
}

function parseStatsPayload(raw: unknown): UPVStats | null {
	if (raw === null || typeof raw !== "object") return null;
	const record = raw as Record<string, unknown>;
	const items: Record<string, UPVPathStats> = {};
	const rawItems = record.items;
	if (rawItems !== null && typeof rawItems === "object") {
		for (const [path, value] of Object.entries(rawItems as Record<string, unknown>)) {
			items[path] = parsePathStats(value) ?? { views: 0, visitors: 0 };
		}
	}
	return { items, site: parseSiteStats(record.site) };
}

function parseHitPayload(raw: unknown, fallbackPath: string): UPVStats | null {
	if (raw === null || typeof raw !== "object") return null;
	const record = raw as Record<string, unknown>;
	const path = typeof record.path === "string" ? record.path : fallbackPath;
	const pathStats: UPVPathStats = { views: toCount(record.views), visitors: toCount(record.visitors) };
	return {
		items: { [path]: pathStats },
		site: parseSiteStats(record.site),
		path,
		views: pathStats.views,
		visitors: pathStats.visitors,
	};
}

/**
 * Pick an adapter for the current environment. Returns the no-op adapter when
 * `NEXT_PUBLIC_UPV_API` is missing/blank, so the app works without analytics.
 *
 * NOTE: the env var must be referenced literally for Next.js to inline it into
 * the client bundle — do not refactor this into a dynamic lookup.
 */
export function createUPVClient(
	apiBaseUrl: string | undefined,
	options?: HttpUPVAdapterOptions,
): UPVAdapter {
	const baseUrl = apiBaseUrl?.trim();
	if (!baseUrl || typeof fetch !== "function") return new NullUPVAdapter();
	return new HttpUPVAdapter(baseUrl, options);
}

/**
 * Resolves the active UPV base URL from siteConfig or the build-time env var.
 * Returns undefined if UPV is globally disabled in siteConfig or no API is set.
 */
export function resolveUpvApiUrl(): string | undefined {
	if (siteConfig.upv?.enabled === false) {
		return undefined;
	}
	const configApi = siteConfig.upv?.api?.trim();
	if (configApi && configApi.length > 0) {
		return configApi;
	}
	// NOTE: process.env.NEXT_PUBLIC_UPV_API must be referenced literally
	// for Next.js to inline it into client bundles at build time.
	const envApi = process.env.NEXT_PUBLIC_UPV_API?.trim();
	return envApi && envApi.length > 0 ? envApi : undefined;
}

/** Returns true if an active UPV backend endpoint is configured. */
export function isUpvConfigured(): boolean {
	return resolveUpvApiUrl() !== undefined;
}

export const upvClient: UPVAdapter = createUPVClient(resolveUpvApiUrl());
