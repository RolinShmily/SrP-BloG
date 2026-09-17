"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Eye, Users } from "lucide-react";
import type { UPVSiteStats } from "@/lib/upv/client";
import { upvClient } from "@/lib/upv/client";
import { useLocale } from "@/i18n/locale-provider";
import { Card, CardContent } from "@/components/ui/card";

type SiteStatsState =
  | { status: "loading"; stats: null }
  | { status: "empty"; stats: null }
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
  const { t, locale } = useLocale();
  const [state, setState] = useState<SiteStatsState>({ status: "loading", stats: null });

  useEffect(() => {
    let cancelled = false;
    void upvClient
      .getStats([])
      .then((stats) => {
        if (cancelled) return;
        setState(
          stats === null ? { status: "empty", stats: null } : { status: "ready", stats: stats.site },
        );
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.warn("[upv] site stats request failed", error);
          setState({ status: "empty", stats: null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status !== "ready") return null;

  const format = (value: number) =>
    new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US").format(value);

  return (
    <>
      <StatCard
        icon={<Eye className="h-3.5 w-3.5" />}
        label={t.stats.totalViews}
        value={format(state.stats.views)}
        unit={t.stats.views}
      />
      <StatCard
        icon={<Users className="h-3.5 w-3.5" />}
        label={t.stats.totalVisitors}
        value={format(state.stats.visitors)}
        unit={t.stats.visitors}
      />
    </>
  );
}

/** Matches the markup of the static cards in `archives-view.tsx`. */
function StatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <Card className="card-spotlight card-interactive border-border/70 bg-card/60 hover:border-border hover:bg-card/90 shadow-none">
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
