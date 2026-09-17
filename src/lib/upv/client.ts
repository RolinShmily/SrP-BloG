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

/** Used when no API is configured; keeps every caller branch-free. */
export class NullUPVAdapter implements UPVAdapter {
	async getStats(_paths: string[]): Promise<UPVStats | null> {
		return null;
	}

	async hit(_path: string): Promise<UPVStats | null> {
		return null;
	}
}

class HttpUPVAdapter implements UPVAdapter {
	readonly #baseUrl: string;
	readonly #timeoutMs: number;
	readonly #debug: boolean;

	constructor(baseUrl: string, options: HttpUPVAdapterOptions = {}) {
		this.#baseUrl = baseUrl.trim().replace(/\/+$/, "");
		this.#timeoutMs = options.timeoutMs ?? 4000;
		this.#debug = options.debug ?? false;
	}

	async getStats(paths: string[]): Promise<UPVStats | null> {
		const unique = [...new Set(paths)].filter((path) => typeof path === "string" && path.length > 0);
		// An empty path list is a valid request: the service answers with the
		// site-wide aggregate only (`{ items: {}, site: { views, visitors } }`).
		const query = unique.map((path) => encodeURIComponent(path)).join(",");
		return parseStatsPayload(await this.#request(`/api/stats?paths=${query}`));
	}

	async hit(path: string): Promise<UPVStats | null> {
		if (typeof path !== "string" || path.length === 0) return null;
		const raw = await this.#request("/api/hit", {
			method: "POST",
			body: JSON.stringify({ path }),
			headers: { "content-type": "application/json" },
		});
		return parseHitPayload(raw, path);
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

export const upvClient: UPVAdapter = createUPVClient(process.env.NEXT_PUBLIC_UPV_API);
