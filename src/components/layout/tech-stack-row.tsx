"use client";

import { useRef, useState, useEffect, useCallback, type ComponentType } from "react";
import { siteConfig, type TechIcon, type TechItem } from "@/config/site";
import {
  CloudflareIcon,
  NextjsIcon,
  ReactIcon,
  TypeScriptIcon,
  TailwindIcon,
  ShadcnIcon,
  RadixUiIcon,
  LucideIcon,
  SveltiaCmsIcon,
  WalineIcon,
  GoogleAnalyticsIcon,
  GoogleSearchConsoleIcon,
  BingIcon,
  IndexNowIcon,
} from "@/components/icons/brands";

const techIcons: Record<TechIcon, ComponentType<{ className?: string }>> = {
  cloudflare: CloudflareIcon,
  nextjs: NextjsIcon,
  react: ReactIcon,
  typescript: TypeScriptIcon,
  tailwind: TailwindIcon,
  shadcn: ShadcnIcon,
  radix: RadixUiIcon,
  lucide: LucideIcon,
  sveltia: SveltiaCmsIcon,
  waline: WalineIcon,
  "google-analytics": GoogleAnalyticsIcon,
  "google-search": GoogleSearchConsoleIcon,
  bing: BingIcon,
  indexnow: IndexNowIcon,
};

function renderItem(item: TechItem, keyPrefix = "") {
  const Icon = techIcons[item.icon] || LucideIcon;
  return (
    <a
      key={`${keyPrefix}-${item.name}`}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      title={item.name}
      aria-label={item.name}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100 shrink-0 px-2 py-1 rounded-md hover:bg-muted/40"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium whitespace-nowrap">{item.name}</span>
    </a>
  );
}

export function TechStackRow() {
  const techStack = (siteConfig.techStack || []).filter((item) => {
    if (item.icon === "sveltia" && siteConfig.cms?.enabled === false) return false;
    if (item.icon === "waline" && siteConfig.comment?.enabled === false) return false;
    if (item.icon === "google-analytics" && siteConfig.seo?.googleAnalytics?.enabled === false) return false;
    if (item.icon === "google-search" && siteConfig.seo?.googleSearch?.enabled === false) return false;
    if (item.icon === "bing" && siteConfig.seo?.bingWebmaster?.enabled === false) return false;
    if (item.icon === "indexnow" && siteConfig.seo?.indexNow?.enabled === false) return false;
    return true;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkOverflow = useCallback(() => {
    if (containerRef.current && measureRef.current) {
      const contentWidth = measureRef.current.scrollWidth;
      const containerWidth = containerRef.current.clientWidth;
      setIsOverflowing(contentWidth > containerWidth);
    }
  }, []);

  useEffect(() => {
    checkOverflow();

    const ro = new ResizeObserver(() => {
      checkOverflow();
    });

    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    window.addEventListener("resize", checkOverflow);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, [checkOverflow]);

  if (techStack.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={
        isOverflowing
          ? {
              maskImage:
                "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
            }
          : undefined
      }
    >
      {/* Invisible measurement element to reliably track natural single-line width */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="invisible absolute top-0 left-0 pointer-events-none flex items-center gap-6 w-max opacity-0"
      >
        {techStack.map((item) => renderItem(item, "measure"))}
      </div>

      {isOverflowing ? (
        <div className="animate-tech-marquee flex items-center gap-6 py-1">
          {techStack.map((item) => renderItem(item, "set1"))}
          {/* Duplicated track for seamless infinite scroll */}
          {techStack.map((item) => renderItem(item, "set2"))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-start gap-4 py-1">
          {techStack.map((item) => renderItem(item, "static"))}
        </div>
      )}
    </div>
  );
}
