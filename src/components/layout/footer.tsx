import Link from "next/link";
import Image from "next/image";
import type { ComponentType } from "react";
import { siteConfig, type CdnBrand, type SocialIcon } from "@/config/site";
import { dictionaries } from "@/i18n";
import { T } from "@/components/i18n/t";
import {
  FaBilibiliIcon,
  FaGithubIcon,
  FaSteamIcon,
  FoloIcon,
  TravellingsBadge,
} from "@/components/icons/brands";
import { TechStackRow } from "@/components/layout/tech-stack-row";
import {
  ArrowUpRight,
  Map,
  Rss,
  Scale,
} from "lucide-react";

const zh = dictionaries.zh;
const en = dictionaries.en;

/** Footer quick links rendered bilingually via the server-side <T> component. */
const quickLinks = [
  { href: "/", label: { zh: zh.nav.posts, en: en.nav.posts } },
  { href: "/tags", label: { zh: zh.nav.tags, en: en.nav.tags } },
  { href: "/archives", label: { zh: zh.nav.archives, en: en.nav.archives } },
  { href: "/friends", label: { zh: zh.nav.friends, en: en.nav.friends } },
];

/**
 * Social channels using official Font Awesome and dedicated brand SVGs.
 */
const socialIcons: Record<SocialIcon, ComponentType<{ className?: string }>> = {
  bilibili: FaBilibiliIcon,
  steam: FaSteamIcon,
  github: FaGithubIcon,
  folo: FoloIcon,
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background text-muted-foreground text-sm transition-colors mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top row: Quick links & Socials */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-foreground transition-colors">
                <T zh={link.label.zh} en={link.label.en} />
              </Link>
            ))}
            <a
              href={siteConfig.rssUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
              aria-label={`${zh.footer.rss} / ${en.footer.rss}`}
            >
              <Rss className="h-3 w-3 opacity-80" />
              <T zh={zh.footer.rss} en={en.footer.rss} />
            </a>
            <a
              href={siteConfig.sitemapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
              aria-label={`${zh.footer.sitemap} / ${en.footer.sitemap}`}
            >
              <Map className="h-3 w-3 opacity-80" />
              <T zh={zh.footer.sitemap} en={en.footer.sitemap} />
            </a>
            <a
              href={siteConfig.travellingsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center"
              aria-label={`${zh.footer.travellings} / ${en.footer.travellings}`}
              title={`${zh.footer.travellings} / ${en.footer.travellings}`}
            >
              <TravellingsBadge className="h-[18px] w-auto shrink-0 grayscale opacity-75 hover:grayscale-0 hover:opacity-100 transition-all" />
            </a>
          </div>

          {/* Socials */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {siteConfig.socials.map((s) => {
              const Icon = socialIcons[s.icon];
              return (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Icon className="h-3.5 w-3.5 opacity-80" />
                  <span>{s.name}</span>
                  <ArrowUpRight className="h-2.5 w-2.5 opacity-60" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Tech stack & ecosystem row */}
        <div className="pt-4 border-t border-border/40">
          <TechStackRow />
        </div>

        {/* Bottom row: Copyright, Source, Licenses & Filings */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/40 text-xs text-muted-foreground/80">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span>
              &copy; {siteConfig.launchYear}&ndash;{currentYear}
            </span>
            <a
              href="https://github.com/RolinShmily/SrP-BloG"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors font-medium"
              title="GitHub Source Repository"
            >
              {siteConfig.title}
            </a>
            <span>&bull;</span>
            <a
              href={siteConfig.license.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <Scale className="h-3 w-3 opacity-80" />
              {siteConfig.license.name}
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {siteConfig.filing.map((f) => (
              <a
                key={f.name}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                {f.icon && (
                  <Image
                    src={f.icon}
                    alt=""
                    width={12}
                    height={12}
                    className="inline-block object-contain opacity-75"
                  />
                )}
                <span>{f.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
