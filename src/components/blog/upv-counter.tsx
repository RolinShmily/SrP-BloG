"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { upvClient, isUpvConfigured, type UPVStats } from "@/lib/upv/client";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

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

function applyTemplate(template: string, views: string, visitors: string): string {
	return template.replaceAll("{views}", views).replaceAll("{visitors}", visitors);
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

	// When no API is configured or skeleton is disabled, initialize with zero counts immediately.
	const [state, setState] = useState<CounterState>(() => {
		if (!configured || !showSkeleton) {
			return { status: "ready", stats: zeroStats(path) };
		}
		return { status: "loading", stats: null };
	});

	useEffect(() => {
		if (!isEnabled || !configured) return;

		let cancelled = false;
		const storageKey = `${HIT_STORAGE_PREFIX}${path}`;
		const shouldHit = !readOnly && !readSessionHit(storageKey);
		if (shouldHit) markSessionHit(storageKey);

		const request = shouldHit ? upvClient.hit(path) : upvClient.getStats([path]);

		void request
			.then((stats) => {
				if (cancelled) return;
				setState({ status: "ready", stats: stats ?? zeroStats(path) });
			})
			.catch((error: unknown) => {
				if (!cancelled) {
					console.warn("[upv] counter request failed", error);
					setState({ status: "ready", stats: zeroStats(path) });
				}
			});

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
				<Eye className="h-3.5 w-3.5" />
				{applyTemplate(template, format(pathStats.views), format(pathStats.visitors))}
			</span>
		</>
	);
}
