export interface NavItem {
  name: string;
  href: string;
  external?: boolean;
  /** Dictionary key under `nav` used by the navbar for localized labels. */
  i18nKey?: "home" | "posts" | "archives" | "tags" | "categories" | "friends" | "about";
}

export interface SocialItem {
  name: string;
  url: string;
  /** Icon key the footer maps to a lucide icon, or to a local brand component. */
  icon: SocialIcon;
}

/**
 * Social platforms the footer links to.
 *
 * lucide ships no brand marks for QQ, Bilibili, Steam or Folo, so the footer
 * pairs a generic lucide glyph with each name (and uses the real artwork for
 * Folo, see `@/components/icons/brands`).
 */
export type SocialIcon = "bilibili" | "steam" | "github" | "folo";

/** Brand mark to render for a CDN provider, resolved in the footer. */
export type CdnBrand = "edgeone" | "cloudflare" | "esa";

export interface CdnProvider {
  name: string;
  url: string;
  brand: CdnBrand;
}

export interface FilingItem {
  name: string;
  url: string;
  icon?: string;
}

export const siteConfig = {
  title: "SrP-BloG",
  subtitle: "技术分享与实践",
  description:
    "分享编程开发、游戏配置、服务器运维、网络技术、内网穿透、CDN优化、容器化部署等技术教程与实践经验的个人技术博客, 记录学习与折腾的点点滴滴。",
  keywords: [
    "编程开发",
    "游戏配置",
    "服务器运维",
    "网络技术",
    "内网穿透",
    "CDN优化",
    "容器化部署",
  ],
  author: "RoL1n",
  bio: "Entities should not be multiplied unnecessarily.",
  avatar: "/favicon/favicon.ico",
  url: "https://blog.srprolin.top",
  /** Absolute-site-relative path of the RSS 2.0 feed (built by `app/rss.xml`). */
  rssUrl: "/rss.xml",
  /** Absolute-site-relative path of the generated sitemap (built by `app/sitemap.ts`). */
  sitemapUrl: "/sitemap.xml",
  /**
   * CDN providers the site is served through, rendered as muted brand marks in
   * the footer.
   *
   * Replaces the old `officialSites` mirror-domain list: that existed to feed a
   * runtime domain switcher which the Next.js rewrite dropped, and it held a
   * single entry pointing at the site's own URL.
   */
  cdnProviders: [
    { name: "EdgeOne", url: "https://edgeone.ai/", brand: "edgeone" },
    { name: "Cloudflare", url: "https://www.cloudflare.com/", brand: "cloudflare" },
    { name: "ESA", url: "https://www.aliyun.com/product/esa", brand: "esa" },
  ] as CdnProvider[],
  /** 开往 (Travellings) — the friend-link relay this site takes part in. */
  travellingsUrl: "https://www.travellings.cn/go.html",
  homeUrl: "https://www.srprolin.top",
  launchYear: "2024",
  license: {
    name: "CC BY-NC-SA 4.0",
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  },
  filing: [
    {
      name: "豫ICP备2025140316号-1",
      url: "https://beian.miit.gov.cn/",
      icon: "/favicon/foot-icp.png",
    },
    {
      name: "萌ICP备20259601号",
      url: "https://icp.gov.moe/?keyword=20259601",
      icon: "/favicon/foot-meng.ico",
    },
  ] as FilingItem[],
  socials: [
    {
      name: "Bilibili",
      url: "https://space.bilibili.com/422744280",
      icon: "bilibili",
    },
    {
      name: "Steam",
      url: "https://steamcommunity.com/profiles/76561199516828933/",
      icon: "steam",
    },
    {
      name: "GitHub",
      url: "https://github.com/RolinShmily",
      icon: "github",
    },
    {
      name: "Folo",
      url: "https://app.folo.is/share/feeds/248766985642333184",
      icon: "folo",
    },
  ] as SocialItem[],
  nav: [
    { name: "Posts", href: "/", i18nKey: "posts" },
    { name: "Tags", href: "/tags", i18nKey: "tags" },
    { name: "Archives", href: "/archives", i18nKey: "archives" },
    { name: "Friends", href: "/friends", i18nKey: "friends" },
    { name: "About", href: "https://www.srprolin.top", external: true, i18nKey: "about" },
  ] as NavItem[],
};
