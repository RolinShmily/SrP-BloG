"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { siteConfig } from "@/config/site";
import {
  CloudflareIcon,
  NextjsIcon,
  ReactIcon,
  TypeScriptIcon,
  TailwindIcon,
  ShadcnIcon,
  RadixUiIcon,
  LucideIcon,
} from "@/components/icons/brands";

interface TechItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const techStack: TechItem[] = [
  {
    name: "Cloudflare",
    href: "https://www.cloudflare.com/",
    icon: CloudflareIcon,
  },
  {
    name: "Next.js",
    href: "https://nextjs.org/",
    icon: NextjsIcon,
  },
  {
    name: "React",
    href: "https://react.dev/",
    icon: ReactIcon,
  },
  {
    name: "TypeScript",
    href: "https://www.typescriptlang.org/",
    icon: TypeScriptIcon,
  },
  {
    name: "Tailwind CSS",
    href: "https://tailwindcss.com/",
    icon: TailwindIcon,
  },
  {
    name: "shadcn/ui",
    href: "https://ui.shadcn.com/",
    icon: ShadcnIcon,
  },
  {
    name: "Radix UI",
    href: "https://www.radix-ui.com/",
    icon: RadixUiIcon,
  },
  {
    name: "Lucide",
    href: "https://lucide.dev/",
    icon: LucideIcon,
  },
];

function renderItem(item: TechItem, keyPrefix = "") {
  const Icon = item.icon;
  return (
    <a
      key={`${keyPrefix}-${item.name}`}
      href={item.href}
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
