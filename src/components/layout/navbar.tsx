"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig, type NavItem } from "@/config/site";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LocaleToggle } from "@/components/i18n/locale-toggle";
import { navIconButtonClass } from "@/components/layout/nav-button";
import { BrandMark } from "@/components/layout/brand-mark";
import { useLocale } from "@/i18n/locale-provider";
import { Menu, X, ArrowUpRight, Rss } from "lucide-react";

/** Scroll offset past which the floating bar turns into a solid capsule. */
const MORPH_AT = 20;
/** Below this offset the bar stays visible, so short pages never lose it. */
const HIDE_AFTER = 350;

/**
 * Floating capsule header, ported from mengxiblog.top.
 *
 * Three states drive the look, mirroring the reference's `not-top` class and
 * `data-show` attribute:
 *
 * - at rest the capsule is transparent and borderless (`top-4`, rounded) and
 *   the links sit at the edges of the content column;
 * - past `MORPH_AT` it gains a hairline border, an opaque surface, a layered
 *   shadow, tightens its inline padding and — from 800px up — narrows by 8%
 *   per side, which is the reference's "gather" gesture;
 * - past `HIDE_AFTER` it retracts while scrolling down and returns as soon as
 *   the user scrolls up.
 *
 * The retract state is deliberately *not* evaluated on mount. The reference
 * only ever writes `data-show` from its scroll listener, which is why it can
 * never start up already retracted; evaluating it on mount races with the
 * browser's scroll restoration and makes the bar vanish on load.
 *
 * Retracting is pure motion, so it is skipped for `prefers-reduced-motion`.
 */
export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [retracted, setRetracted] = useState(false);
  const pathname = usePathname();
  const { t } = useLocale();
  const lastY = useRef(0);
  const menuOpen = useRef(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // The panel must never be retracted out of view while it is open.
  useEffect(() => {
    menuOpen.current = mobileMenuOpen;
    if (mobileMenuOpen) setRetracted(false);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Mount: settle the morph state only. The retract state stays untouched
    // until the user actually scrolls, so a restored scroll position cannot
    // hide the bar on load.
    lastY.current = window.scrollY;
    setScrolled(window.scrollY > MORPH_AT);

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > MORPH_AT);

      if (reducedMotion.matches || menuOpen.current) {
        setRetracted(false);
      } else {
        setRetracted(y > HIDE_AFTER && y > lastY.current);
      }

      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/posts" || pathname.startsWith("/posts/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLabel = (item: NavItem) => (item.i18nKey ? t.nav[item.i18nKey] : item.name);

  // Plain text items: no pill background, only a colour shift plus a 4px dot
  // marking the current page.
  const navLinkClass =
    "relative inline-flex items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors hover:text-primary";

  return (
    <header
      className="site-header sticky top-4 z-50"
      data-scrolled={scrolled}
      data-retracted={retracted}
      data-menu={mobileMenuOpen ? "open" : "closed"}
    >
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="site-header-capsule relative flex h-14 items-center justify-between rounded-xl border border-transparent sm:rounded-2xl">
          {/* Brand: animated "SrP" monogram + wordmark */}
          <Link href="/" className="site-brand site-header-brand shrink-0" aria-label={siteConfig.title}>
            <BrandMark className="h-[1.125rem] w-auto shrink-0 text-foreground" />
            <span className="site-brand-text" aria-hidden="true">
              RoL1n&apos;s <span className="site-brand-type">BloG</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {/* Desktop navigation */}
            <nav className="hidden items-center md:flex">
              {siteConfig.nav.map((item) => {
                const active = !item.external && isLinkActive(item.href);
                if (item.external) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${navLinkClass} text-muted-foreground`}
                    >
                      <span>{navLabel(item)}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-60" />
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`${navLinkClass} ${active ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {navLabel(item)}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#f75c7e] shadow-[0_0_6px_rgba(247,92,126,0.6)]"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Header controls — the cluster tightens once the bar is scrolled */}
            <div className="site-header-cluster flex items-center gap-2.5">
              <a
                href={siteConfig.rssUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={navIconButtonClass}
                aria-label={t.footer.rss}
                title={t.footer.rss}
              >
                <Rss className="h-4 w-4" />
              </a>
              <LocaleToggle />
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className={`${navIconButtonClass} md:hidden`}
                aria-label={t.nav.menu}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Mobile panel: always mounted, collapsed with the 0fr→1fr grid trick */}
          <div className="site-header-panel absolute inset-x-0 top-full mt-2 md:hidden">
            <div className="rounded-xl border border-border bg-background p-2 shadow-sm">
              {siteConfig.nav.map((item) => {
                const active = !item.external && isLinkActive(item.href);
                const itemClass = `flex w-full items-center justify-end gap-1 px-3 py-2 text-right text-sm font-medium transition-colors hover:text-primary ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`;

                if (item.external) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={itemClass}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>{navLabel(item)}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={itemClass}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{navLabel(item)}</span>
                  </Link>
                );
              })}

              <div className="mt-1 flex items-center justify-between border-t border-border px-3 pt-2.5">
                <span className="text-xs text-muted-foreground">{t.common.language}</span>
                <LocaleToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
