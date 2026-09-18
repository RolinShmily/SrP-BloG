"use client";

import { useEffect, useState, Fragment, type ReactNode } from "react";
import { Eye } from "lucide-react";
import {
	upvClient,
	isUpvConfigured,
	getCachedPathStats,
	isPathCacheFresh,
	createStatsFromPath,
	subscribePathStats,
	type UPVStats,
} from "@/lib/upv/client";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";

export interface UPVCounterProps {
	/** Path whose counters are displayed, e.g. `/posts/hello`. */
	path: string;
	/** Extra classes for the wrapping element. */
	className?: string;
	/**
	 * Copy for the counter line, with `{views}` and `{visitors}` placeholders.
	 * Passed in by the caller so no language is hard-coded here.
	 * Defaults to `{views} views`.
	 */
	template?: string;
	/** Number formatter; defaults to `Intl.NumberFormat()` in the user locale. */
	formatNumber?: (value: number) => string;
	/** Only read counters, never record a hit (useful for previews/cards). */
	readOnly?: boolean;
	/** Prefix with a bullet dot when rendered (&bull;). Useful inside inline meta lists. */
	prefixDot?: boolean;
	/** Whether to show a pulse skeleton while loading. Defaults to true. */
	showSkeleton?: boolean;
	/** Target context: "post" (article detail) or "card" (listing card). Defaults to "post". */
	context?: "post" | "card";
}

const DEFAULT_TEMPLATE = "{views} views";
const HIT_STORAGE_PREFIX = "upv:hit:";

type CounterState =
	| { status: "loading"; stats: null }
	| { status: "ready"; stats: UPVStats };

function zeroStats(path: string): UPVStats {
	return {
		items: { [path]: { views: 0, visitors: 0 } },
		site: { views: 0, visitors: 0 },
		path,
		views: 0,
		visitors: 0,
	};
}

function readSessionHit(key: string): boolean {
	try {
		return window.sessionStorage.getItem(key) === "1";
	} catch (error) {
		// Storage can be unavailable (Safari private mode, blocked cookies).
		if (error instanceof DOMException) return false;
		console.warn("[upv] unexpected sessionStorage error", error);
		return false;
	}
}

function markSessionHit(key: string): void {
	try {
		window.sessionStorage.setItem(key, "1");
	} catch (error) {
		if (error instanceof DOMException) return;
		console.warn("[upv] unexpected sessionStorage error", error);
	}
}

function renderCounterContent(
	template: string,
	viewsNode: ReactNode,
	visitorsNode: ReactNode,
): ReactNode {
	const parts = template.split(/(\{views\}|\{visitors\})/g);
	return parts.map((part, index) => {
		if (part === "{views}") {
			return <Fragment key={index}>{viewsNode}</Fragment>;
		}
		if (part === "{visitors}") {
			return <Fragment key={index}>{visitorsNode}</Fragment>;
		}
		return part;
	});
}

/**
 * Page-view / unique-visitor counter.
 *
 * Behaviour:
 *   * Records one hit per path per browser session (`sessionStorage` guard),
 *     otherwise just reads the current counters.
 *   * Renders a skeleton while loading and *nothing at all* when the UPV service
 *     is unavailable — a broken analytics backend must not leave a gap or an
 *     error in the article layout.
 */
export function UPVCounter({
	path,
	className,
	template = DEFAULT_TEMPLATE,
	formatNumber,
	readOnly = false,
	prefixDot = false,
	showSkeleton = true,
	context = "post",
}: UPVCounterProps) {
	const isEnabled =
		siteConfig.upv?.enabled !== false &&
		(context === "card"
			? siteConfig.upv?.showCardCounter !== false
			: siteConfig.upv?.showPostCounter !== false);
	const configured = isUpvConfigured();

	// Baseline state: for cards (showSkeleton === false), start at 0 so SSR matches client.
	// For post detail (showSkeleton === true), start at loading skeleton.
	const [state, setState] = useState<CounterState>(() => {
		if (!isEnabled || !configured) {
			return { status: "ready", stats: zeroStats(path) };
		}
		if (!showSkeleton) {
			return { status: "ready", stats: zeroStats(path) };
		}
		return { status: "loading", stats: null };
	});

	// Subscribe to real-time updates for this path
	useEffect(() => {
		return subscribePathStats((updatedPath, stats) => {
			if (updatedPath === path) {
				setState({ status: "ready", stats: createStatsFromPath(path, stats) });
			}
		});
	}, [path]);

	useEffect(() => {
		if (!isEnabled || !configured) return;

		// Immediately hydrate from cache on client mount (runs after hydration, safe!)
		const cached = getCachedPathStats(path);
		if (cached) {
			setState({ status: "ready", stats: createStatsFromPath(path, cached) });
		}

		let cancelled = false;
		const storageKey = `${HIT_STORAGE_PREFIX}${path}`;
		const shouldHit = !readOnly && !readSessionHit(storageKey);

		if (shouldHit) {
			markSessionHit(storageKey);
			void upvClient
				.hit(path)
				.then((stats) => {
					if (cancelled || !stats) return;
					setState({ status: "ready", stats });
				})
				.catch((error: unknown) => {
					if (!cancelled) {
						console.warn("[upv] counter hit failed", error);
					}
				});
		} else {
			// If cached and fresh (< TTL), skip redundant network fetch
			if (isPathCacheFresh(path)) return;

			void upvClient
				.getStats([path])
				.then((stats) => {
					if (cancelled || !stats) return;
					setState({ status: "ready", stats });
				})
				.catch((error: unknown) => {
					if (!cancelled) {
						console.warn("[upv] counter request failed", error);
					}
				});
		}

		return () => {
			cancelled = true;
		};
	}, [isEnabled, configured, path, readOnly]);

	if (!isEnabled) return null;

	if (state.status === "loading") {
		if (!showSkeleton) return null;
		return (
			<span className={cn("inline-flex items-center", className)} aria-hidden="true">
				<span className="inline-block h-3 w-16 animate-pulse rounded bg-muted" />
			</span>
		);
	}

	const { stats } = state;
	const pathStats = stats.items[path] ?? {
		views: stats.views ?? 0,
		visitors: stats.visitors ?? 0,
	};
	const format = formatNumber ?? ((value: number) => new Intl.NumberFormat().format(value));

	return (
		<>
			{prefixDot && (
				<span className="text-muted-foreground/40" aria-hidden="true">
					&bull;
				</span>
			)}
			<span
				className={cn(
					"inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground",
					className,
				)}
			>
				<Eye className="h-3.5 w-3.5 shrink-0" />
				{renderCounterContent(
					template,
					<AnimatedNumber value={pathStats.views} format={format} duration={600} />,
					<AnimatedNumber value={pathStats.visitors} format={format} duration={600} />,
				)}
			</span>
		</>
	);
}
