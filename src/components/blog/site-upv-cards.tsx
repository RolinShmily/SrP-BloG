"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Eye, Users } from "lucide-react";
import type { UPVSiteStats } from "@/lib/upv/client";
import { upvClient, isUpvConfigured } from "@/lib/upv/client";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/i18n/locale-provider";
import { Card, CardContent } from "@/components/ui/card";

type SiteStatsState =
  | { status: "loading"; stats: null }
  | { status: "ready"; stats: UPVSiteStats };

/**
 * Site-wide PV (page views) and UV (unique visitors) cards, for the archives
 * stats row.
 *
 * Reads `upvClient.getStats([])`, which maps to `GET /api/stats?paths=` and
 * returns the `site` aggregate only — one request feeds both cards.
 *
 * They appear together or not at all. While loading, and whenever the service
 * is unconfigured or unreachable, this renders `null` so the surrounding stats
 * grid keeps its remaining cards instead of showing a misleading zero. The
 * backend is `services/upv`.
 */
export function SiteUpvCards() {
  const isEnabled =
    siteConfig.upv?.enabled !== false && siteConfig.upv?.showArchivesStats !== false;
  const configured = isUpvConfigured();
  const { t, locale } = useLocale();

  // If no backend API is configured, display zero placeholder counts immediately.
  const [state, setState] = useState<SiteStatsState>(() => {
    if (!configured) {
      return { status: "ready", stats: { views: 0, visitors: 0 } };
    }
    return { status: "loading", stats: null };
  });

  useEffect(() => {
    if (!isEnabled || !configured) return;

    let cancelled = false;
    void upvClient
      .getStats([])
      .then((stats) => {
        if (cancelled) return;
        setState({
          status: "ready",
          stats: stats ? stats.site : { views: 0, visitors: 0 },
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.warn("[upv] site stats request failed", error);
          setState({ status: "ready", stats: { views: 0, visitors: 0 } });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isEnabled, configured]);

  if (!isEnabled) return null;

  if (state.status === "loading") {
    return (
      <>
        <SkeletonCard staggerIndex={2} />
        <SkeletonCard staggerIndex={3} />
      </>
    );
  }

  const format = (value: number) =>
    new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US").format(value);

  return (
    <>
      <StatCard
        icon={<Eye className="h-3.5 w-3.5" />}
        label={t.stats.totalViews}
        value={format(state.stats.views)}
        unit={t.stats.views}
        staggerIndex={2}
      />
      <StatCard
        icon={<Users className="h-3.5 w-3.5" />}
        label={t.stats.totalVisitors}
        value={format(state.stats.visitors)}
        unit={t.stats.visitors}
        staggerIndex={3}
      />
    </>
  );
}

function SkeletonCard({ staggerIndex }: { staggerIndex: number }) {
  return (
    <Card
      className="card-animate-in card-spotlight card-interactive flex-1 basis-0 min-w-[45%] md:min-w-0 border-border/70 bg-card/60 shadow-none"
      style={{ "--stagger-index": staggerIndex } as React.CSSProperties}
    >
      <CardContent className="relative z-10 p-4 space-y-2">
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        <div className="h-7 w-20 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

/** Matches the markup of the static cards in `archives-view.tsx`. */
function StatCard({
  icon,
  label,
  value,
  unit,
  staggerIndex,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
  staggerIndex: number;
}) {
  return (
    <Card
      className="card-animate-in card-spotlight card-interactive flex-1 basis-0 min-w-[45%] md:min-w-0 border-border/70 bg-card/60 hover:border-border hover:bg-card/90 shadow-none"
      style={{ "--stagger-index": staggerIndex } as React.CSSProperties}
    >
      <CardContent className="relative z-10 p-4 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="text-2xl font-semibold tracking-tight text-foreground font-mono">
          {value}{" "}
          <span className="text-xs font-normal text-muted-foreground font-sans">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}
