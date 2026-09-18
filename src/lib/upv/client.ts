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

export interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

export const UPV_CACHE_TTL_MS = 60_000;
const STORAGE_KEY_PATHS = "upv:cache:paths";
const STORAGE_KEY_SITE = "upv:cache:site";
const MAX_CACHED_PATHS = 300;

// Level 1: In-memory cache singleton across SPA navigations
const memoryPathCache = new Map<string, CacheEntry<UPVPathStats>>();
let memorySiteCache: CacheEntry<UPVSiteStats> | null = null;
let storageInitialized = false;

type StatsListener = (path: string, stats: UPVPathStats) => void;
type SiteStatsListener = (site: UPVSiteStats) => void;
const pathListeners = new Set<StatsListener>();
const siteListeners = new Set<SiteStatsListener>();

function ensureStorageLoaded(): void {
	if (storageInitialized || typeof window === "undefined") return;
	storageInitialized = true;
	try {
		const rawPaths = window.localStorage.getItem(STORAGE_KEY_PATHS);
		if (rawPaths) {
			const parsed = JSON.parse(rawPaths) as Record<string, CacheEntry<UPVPathStats>>;
			if (parsed && typeof parsed === "object") {
				for (const [path, entry] of Object.entries(parsed)) {
					if (entry && typeof entry === "object" && entry.data && typeof entry.timestamp === "number") {
						memoryPathCache.set(path, entry);
					}
				}
			}
		}
		const rawSite = window.localStorage.getItem(STORAGE_KEY_SITE);
		if (rawSite) {
			const parsed = JSON.parse(rawSite) as CacheEntry<UPVSiteStats>;
			if (parsed && typeof parsed === "object" && parsed.data && typeof parsed.timestamp === "number") {
				memorySiteCache = parsed;
			}
		}
	} catch {
		// Ignore storage parse errors
	}
}

let persistTimeout: ReturnType<typeof setTimeout> | null = null;
function schedulePersist(): void {
	if (typeof window === "undefined") return;
	if (persistTimeout) return;
	persistTimeout = setTimeout(() => {
		persistTimeout = null;
		try {
			const pathsObj: Record<string, CacheEntry<UPVPathStats>> = {};
			let count = 0;
			for (const [path, entry] of memoryPathCache.entries()) {
				pathsObj[path] = entry;
				count++;
				if (count >= MAX_CACHED_PATHS) break;
			}
			window.localStorage.setItem(STORAGE_KEY_PATHS, JSON.stringify(pathsObj));
			if (memorySiteCache) {
				window.localStorage.setItem(STORAGE_KEY_SITE, JSON.stringify(memorySiteCache));
			}
		} catch {
			// Storage write failure (quota/private mode)
		}
	}, 100);
}

/** Synchronously retrieve cached stats for a path if available (0ms lookup). */
export function getCachedPathStats(path: string): UPVPathStats | null {
	ensureStorageLoaded();
	return memoryPathCache.get(path)?.data ?? null;
}

/** Synchronously retrieve cached site-wide stats if available (0ms lookup). */
export function getCachedSiteStats(): UPVSiteStats | null {
	ensureStorageLoaded();
	return memorySiteCache?.data ?? null;
}

/** Returns true if path stats exist in cache and were fetched within TTL. */
export function isPathCacheFresh(path: string, ttlMs: number = UPV_CACHE_TTL_MS): boolean {
	ensureStorageLoaded();
	const entry = memoryPathCache.get(path);
	if (!entry) return false;
	return Date.now() - entry.timestamp < ttlMs;
}

/** Returns true if site stats exist in cache and were fetched within TTL. */
export function isSiteCacheFresh(ttlMs: number = UPV_CACHE_TTL_MS): boolean {
	ensureStorageLoaded();
	if (!memorySiteCache) return false;
	return Date.now() - memorySiteCache.timestamp < ttlMs;
}

export function setCachedPathStats(path: string, stats: UPVPathStats): void {
	ensureStorageLoaded();
	memoryPathCache.set(path, { data: stats, timestamp: Date.now() });
	schedulePersist();
	for (const listener of pathListeners) {
		listener(path, stats);
	}
}

export function setCachedSiteStats(site: UPVSiteStats): void {
	ensureStorageLoaded();
	memorySiteCache = { data: site, timestamp: Date.now() };
	schedulePersist();
	for (const listener of siteListeners) {
		listener(site);
	}
}

export function subscribePathStats(listener: StatsListener): () => void {
	pathListeners.add(listener);
	return () => {
		pathListeners.delete(listener);
	};
}

export function subscribeSiteStats(listener: SiteStatsListener): () => void {
	siteListeners.add(listener);
	return () => {
		siteListeners.delete(listener);
	};
}

export function createStatsFromPath(path: string, stats: UPVPathStats): UPVStats {
	return {
		items: { [path]: stats },
		site: getCachedSiteStats() ?? { views: 0, visitors: 0 },
		path,
		views: stats.views,
		visitors: stats.visitors,
	};
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
			items[path] = getCachedPathStats(path) ?? { views: 0, visitors: 0 };
		}
		return { items, site: getCachedSiteStats() ?? { views: 0, visitors: 0 } };
	}

	async hit(path: string): Promise<UPVStats> {
		const cached = getCachedPathStats(path) ?? { views: 0, visitors: 0 };
		return {
			items: { [path]: cached },
			site: getCachedSiteStats() ?? { views: 0, visitors: 0 },
			path,
			views: cached.views,
			visitors: cached.visitors,
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
			if (isSiteCacheFresh()) {
				return { items: {}, site: getCachedSiteStats()! };
			}
			const payload = parseStatsPayload(await this.#request("/api/stats?paths="));
			if (payload) {
				setCachedSiteStats(payload.site);
			}
			return payload;
		}

		// If every requested path is fresh in cache, return immediately (0ms) without hitting network
		if (unique.every((p) => isPathCacheFresh(p))) {
			const items: Record<string, UPVPathStats> = {};
			for (const p of unique) {
				items[p] = getCachedPathStats(p)!;
			}
			return {
				items,
				site: getCachedSiteStats() ?? { views: 0, visitors: 0 },
			};
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
					if (payload) {
						for (const [path, stats] of Object.entries(payload.items)) {
							setCachedPathStats(path, stats);
						}
						setCachedSiteStats(payload.site);
					}
					const result = payload ?? {
						items: Object.fromEntries(allPaths.map((p) => [p, getCachedPathStats(p) ?? { views: 0, visitors: 0 }])),
						site: getCachedSiteStats() ?? { views: 0, visitors: 0 },
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
		if (payload) {
			const pathStats = payload.items[path] ?? { views: payload.views ?? 0, visitors: payload.visitors ?? 0 };
			setCachedPathStats(path, pathStats);
			setCachedSiteStats(payload.site);
			return payload;
		}
		const fallbackStats = getCachedPathStats(path) ?? { views: 0, visitors: 0 };
		return {
			items: { [path]: fallbackStats },
			site: getCachedSiteStats() ?? { views: 0, visitors: 0 },
			path,
			views: fallbackStats.views,
			visitors: fallbackStats.visitors,
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
