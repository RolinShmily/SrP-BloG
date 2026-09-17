"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { upvClient, type UPVStats } from "@/lib/upv/client";
import { cn } from "@/lib/utils";

export interface UPVCounterProps {
	/** Path whose counters are displayed, e.g. `/posts/hello`. */
	path: string;
	/** Extra classes for the wrapping element. */
	className?: string;
	/**
	 * Copy for the counter line, with `{views}` and `{visitors}` placeholders.
	 * Passed in by the caller so no language is hard-coded here (i18n wiring
	 * happens in a later step). Defaults to an English template.
	 */
	template?: string;
	/** Number formatter; defaults to `Intl.NumberFormat()` in the user locale. */
	formatNumber?: (value: number) => string;
	/** Only read counters, never record a hit (useful for previews/tests). */
	readOnly?: boolean;
}

const DEFAULT_TEMPLATE = "{views} views · {visitors} visitors";
const HIT_STORAGE_PREFIX = "upv:hit:";

type CounterState =
	| { status: "loading"; stats: null }
	| { status: "empty"; stats: null }
	| { status: "ready"; stats: UPVStats };

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
}: UPVCounterProps) {
	const [state, setState] = useState<CounterState>({ status: "loading", stats: null });

	useEffect(() => {
		let cancelled = false;
		const storageKey = `${HIT_STORAGE_PREFIX}${path}`;
		const shouldHit = !readOnly && !readSessionHit(storageKey);
		if (shouldHit) markSessionHit(storageKey);

		const request = shouldHit ? upvClient.hit(path) : upvClient.getStats([path]);

		void request
			.then((stats) => {
				if (cancelled) return;
				setState(stats === null ? { status: "empty", stats: null } : { status: "ready", stats });
			})
			.catch((error: unknown) => {
				// upvClient never rejects, but a custom adapter might.
				if (!cancelled) {
					console.warn("[upv] counter request failed", error);
					setState({ status: "empty", stats: null });
				}
			});

		return () => {
			cancelled = true;
		};
	}, [path, readOnly]);

	if (state.status === "loading") {
		return (
			<span className={cn("inline-flex items-center", className)} aria-hidden="true">
				<span className="inline-block h-3 w-28 animate-pulse rounded bg-muted" />
			</span>
		);
	}

	if (state.status === "empty") return null;

	const { stats } = state;
	const pathStats = stats.items[path] ?? {
		views: stats.views ?? 0,
		visitors: stats.visitors ?? 0,
	};
	const format = formatNumber ?? ((value: number) => new Intl.NumberFormat().format(value));

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground",
				className,
			)}
		>
			<Eye className="h-3.5 w-3.5" />
			{applyTemplate(template, format(pathStats.views), format(pathStats.visitors))}
		</span>
	);
}
