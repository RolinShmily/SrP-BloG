export interface LocalizedText {
  zh: string;
  en: string;
}

export interface NavItem {
  name: string;
  href: string;
  external?: boolean;
  /** Dictionary key under `nav` used by the navbar for localized labels. */
  i18nKey?: "home" | "posts" | "archives" | "tags" | "friends" | "about";
}

/**
 * Supported social platforms the footer can link to.
 */
export type SocialIcon =
  | "bilibili"
  | "steam"
  | "github"
  | "folo"
  | "twitter"
  | "x"
  | "mail"
  | "telegram";

export interface SocialItem {
  name: string;
  url: string;
  icon: SocialIcon;
}

/** Brand mark icon for tech stack badge in the footer marquee. */
export type TechIcon =
  | "cloudflare"
  | "nextjs"
  | "react"
  | "typescript"
  | "tailwind"
  | "shadcn"
  | "radix"
  | "lucide"
  | "sveltia"
  | "waline"
  | "github-actions"
  | "google-analytics"
  | "google-search"
  | "bing"
  | "indexnow";

export interface TechItem {
  name: string;
  url: string;
  icon: TechIcon;
}

export interface FilingItem {
  name: string;
  url: string;
  icon?: string;
}

export interface FriendSiteInfo {
  name: string | LocalizedText;
  url: string;
  description: string | LocalizedText;
  avatar: string;
  backlink: string;
  [key: string]: string | LocalizedText;
}

export interface FriendApplicationConfig {
  /** Master switch to enable/disable friend link application buttons. */
  enabled: boolean;
  /** URL for applying via GitHub Issue template. */
  issueUrl?: string;
  /** URL for applying via GitHub Pull Request. */
  prUrl?: string;
}

export interface SponsorshipConfig {
  /** Master switch to show/hide all sponsorship UI (QR codes, bottom tabs, sections). */
  enabled: boolean;
  /** Custom Alipay payment QR image (default: /sponsors/alipay.png). */
  alipay?: string;
  /** Custom WeChat Pay QR image (default: /sponsors/wechat.png). */
  wechat?: string;
}

export interface UpvConfig {
  /**
   * Master switch for the UPV counting service.
   * If false, disables all PV/UV network requests and hides all counter UI components.
   */
  enabled: boolean;
  /**
   * Base API URL of the UPV counting service (e.g. "https://upv.srprolin.top" or Workers URL).
   * If omitted or empty, automatically falls back to `process.env.NEXT_PUBLIC_UPV_API`.
   */
  api?: string;
  /**
   * Whether to display the page views counter in article meta header.
   * Default: true.
   */
  showPostCounter?: boolean;
  /**
   * Whether to display the page views counter in post listing cards.
   * Default: true.
   */
  showCardCounter?: boolean;
  /**
   * Whether to display the total PV/UV stat cards on the /archives page.
   * Default: true.
   */
  showArchivesStats?: boolean;
}

export interface CommentConfig {
  /**
   * Master switch for the Waline comment system.
   * If false:
   *  - Completely hides comment areas on article pages and friends page
   *  - Automatically hides Waline from the footer tech stack
   * Default: true.
   */
  enabled: boolean;
  /**
   * Waline server backend URL (e.g. "https://waline.srprolin.top" or Docker self-hosted endpoint).
   */
  serverUrl: string;
  /**
   * Preset emoji packages (default: Weibo + Bilibili emojis).
   */
  emoji?: string[];
  /**
   * Comment editor placeholder.
   */
  placeholder?: string;
  /**
   * Whether to enable pageview tracking via Waline (default: false, handled by UPV service).
   */
  pageview?: boolean;
  /**
   * Required meta fields (e.g. ["nick", "mail"]).
   */
  requiredMeta?: string[];
}

/**
 * Bing Webmaster Tools config.
 */
export interface BingWebmasterConfig {
  /** Master switch for Bing Webmaster Tools integration and footer badge. */
  enabled: boolean;
  /**
   * HTML meta tag authentication code (<meta name="msvalidate.01" content="..." />).
   */
  metaCode?: string;
}

/**
 * Google Search Console config.
 */
export interface GoogleSearchConfig {
  /** Master switch for Google Search Console integration and footer badge. */
  enabled: boolean;
  /**
   * HTML meta verification code (<meta name="google-site-verification" content="..." />).
   * Automatically emitted into Next.js metadata.verification.google.
   */
  verificationCode?: string;
}

/**
 * Google Analytics (GA4) config.
 */
export interface GoogleAnalyticsConfig {
  /** Master switch for Google Analytics tracking and footer badge. */
  enabled: boolean;
  /**
   * Google Analytics 4 Measurement ID (e.g. "G-3BJMF4MP44").
   */
  measurementId: string;
}

/**
 * IndexNow instant indexing protocol config (used with Bing, Yandex, etc.).
 */
export interface IndexNowConfig {
  /** Master switch for IndexNow instant indexing and footer badge. */
  enabled: boolean;
  /**
   * IndexNow API key (hex / UUID string).
   * Also verified via https://<host>/<key>.txt containing the key.
   */
  key: string;
  /** IndexNow endpoint URL (default: "https://api.indexnow.org/indexnow"). */
  apiUrl?: string;
  /** Batch submission size limit (max 10000). */
  batchSize?: number;
}

/**
 * Integrated SEO & Analytics configuration section.
 */
export interface SeoConfig {
  /** Bing Webmaster Tools verification & indexing */
  bingWebmaster: BingWebmasterConfig;
  /** Google Search Console verification & indexing */
  googleSearch: GoogleSearchConfig;
  /** Google Analytics 4 (GA4) traffic analytics */
  googleAnalytics: GoogleAnalyticsConfig;
  /** IndexNow protocol real-time submission to Bing & other engines */
  indexNow: IndexNowConfig;
}

export const siteConfig = {
  // ==========================================
  // 1. Basic Site Info & Branding (站点基本信息与品牌)
  // ==========================================
  /** Main site title used in title tags, branding, and RSS feed. */
  title: "SrP-BloG",
  /** Subtitle used in page title templates and Open Graph cards. */
  subtitle: "技术分享与实践",
  /** Meta description for search engines and social cards. */
  description:
    "分享编程开发、游戏配置、服务器运维、网络技术、内网穿透、CDN优化、容器化部署等技术教程与实践经验的个人技术博客, 记录学习与折腾的点点滴滴。",
  /** Search engine keywords. */
  keywords: [
    "编程开发",
    "游戏配置",
    "服务器运维",
    "网络技术",
    "内网穿透",
    "CDN优化",
    "容器化部署",
  ],
  /** Site author name. */
  author: "RoL1n_SrP",
  /** Navbar brand author display name (defaults to author if omitted). */
  brandAuthor: "RoL1n",
  /** Navbar brand suffix wordmark (e.g. "BloG", "Notes", "Wiki"). */
  brandTitle: "BloG",
  /** Short biography / motto displayed in social cards and about contexts. */
  bio: "Entities should not be multiplied unnecessarily.",
  /** Path to site favicon. */
  avatar: "/favicon/favicon.ico",
  /** Canonical base URL of the blog without trailing slash. */
  url: "https://blog.srprolin.top",
  /** Personal homepage / external about link. */
  homeUrl: "https://www.srprolin.top",
  /** Open source repository URL of this blog. */
  repoUrl: "https://github.com/RolinShmily/SrP-BloG",

  // ==========================================
  // 2. SEO & Feed (SEO与订阅输出)
  // ==========================================
  /** Default Open Graph image (1200x630) used for social cards and embeds. */
  ogImage: "/og/og.png",
  /** Absolute-site-relative path of the RSS 2.0 feed. */
  rssUrl: "/rss.xml",
  /** Absolute-site-relative path of the generated sitemap. */
  sitemapUrl: "/sitemap.xml",

  // ==========================================
  // 3. Blog Reading & Aesthetics (阅读体验与背景艺术)
  // ==========================================
  /** Number of posts displayed per page on the home and posts list pages. */
  postsPerPage: 8,
  /**
   * Background ambient canvas art mode:
   * - 'plum': winter plum blossom branches across all pages (default)
   * - 'dots': always fluid wave dots
   * - 'auto': route-based dispatch
   * - 'none': disable ambient canvas
   */
  ambientArt: "plum" as "plum" | "dots" | "auto" | "none",
  /**
   * Whether listing cards load the build-time compressed card cover.
   *
   * - `true`  : cards request `/posts/<slug>/<name>.thumb.webp`, a 768px WebP
   *             produced by `scripts/sync-post-assets.ts` (sharp, ~95% smaller).
   *             This is what the bundled GitHub Actions workflow runs.
   * - `false` : cards load the untouched original cover, and the build skips
   *             thumbnail generation entirely — no sharp, no `.thumb.webp`.
   *             Use this when nothing in your pipeline can run the thumbnail
   *             step (deploying a fork without that CI, a sharp-less builder),
   *             otherwise cards would request a file that was never generated.
   */
  cardThumbnail: true,

  // ==========================================
  // 4. Navigation & Socials (导航与社交链接)
  // ==========================================
  nav: [
    { name: "Posts", href: "/", i18nKey: "posts" },
    { name: "Tags", href: "/tags", i18nKey: "tags" },
    { name: "Archives", href: "/archives", i18nKey: "archives" },
    { name: "Friends", href: "/friends", i18nKey: "friends" },
    { name: "About", href: "https://www.srprolin.top", external: true, i18nKey: "about" },
  ] as NavItem[],
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

  // ==========================================
  // 5. Footer, Badges & Tech Stack (页脚、徽标与技术栈)
  // ==========================================
  /** Year the site was founded for copyright display (e.g. 2024-2026). */
  launchYear: "2024",
  /** Content copyright license name and URL. */
  license: {
    name: "CC BY-NC-SA 4.0",
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  },
  /**
   * Whether to display the "Human Authored / Not by AI" (真人撰写 · 非AI生成)
   * badge on the article copyright card.
   * Default: true.
   */
  humanAuthoredBadge: true,
  /** 开往 (Travellings) friend-link relay URL. Set to empty string to hide badge. */
  travellingsUrl: "https://www.travellings.cn/go.html",
  /** ICP and security filings displayed at the footer bottom. */
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
  /** Tech stack badges rendered in the footer marquee row. */
  techStack: [
    { name: "Cloudflare", url: "https://www.cloudflare.com/", icon: "cloudflare" },
    { name: "Next.js", url: "https://nextjs.org/", icon: "nextjs" },
    { name: "React", url: "https://react.dev/", icon: "react" },
    { name: "TypeScript", url: "https://www.typescriptlang.org/", icon: "typescript" },
    { name: "Tailwind CSS", url: "https://tailwindcss.com/", icon: "tailwind" },
    { name: "shadcn/ui", url: "https://ui.shadcn.com/", icon: "shadcn" },
    { name: "Radix UI", url: "https://www.radix-ui.com/", icon: "radix" },
    { name: "Lucide", url: "https://lucide.dev/", icon: "lucide" },
    { name: "Sveltia CMS", url: "https://sveltiacms.app/", icon: "sveltia" },
    { name: "Waline", url: "https://waline.js.org/", icon: "waline" },
    { name: "GitHub Actions", url: "https://github.com/features/actions", icon: "github-actions" },
    { name: "Google Analytics", url: "https://analytics.google.com/", icon: "google-analytics" },
    { name: "Google Search", url: "https://search.google.com/search-console", icon: "google-search" },
    { name: "Bing Webmaster", url: "https://www.bing.com/webmasters", icon: "bing" },
    { name: "IndexNow", url: "https://www.indexnow.org/", icon: "indexnow" },
  ] as TechItem[],

  // ==========================================
  // 6. Interactive Features: Friends & Sponsorship (友链与赞助互动)
  // ==========================================
  /**
   * Information for exchanging friend links (本站友链信息), configured here
   * and displayed on the /friends page with i18n support and one-click copy.
   */
  friendSiteInfo: {
    name: "SrP-BloG",
    url: "https://blog.srprolin.top/",
    description: {
      zh: "如无必要，勿增实体。",
      en: "Entities should not be multiplied unnecessarily.",
    },
    avatar: "https://blog.srprolin.top/favicon/favicon.ico",
    backlink: "https://blog.srprolin.top/friends/",
  } as FriendSiteInfo,
  /** Quick application shortcuts on the /friends page. */
  friendApplication: {
    enabled: true,
    issueUrl: "https://github.com/RolinShmily/SrP-BloG/issues/new?template=friend_link.yml",
    prUrl: "https://github.com/RolinShmily/SrP-BloG/tree/main/content/friends",
  } as FriendApplicationConfig,
  /**
   * Sponsorship / Coffee donation settings.
   * Disabling this hides the `#sponsors` section on `/friends` and the article bottom coffee link.
   */
  sponsorship: {
    enabled: true,
    alipay: "/sponsors/alipay.png",
    wechat: "/sponsors/wechat.png",
  } as SponsorshipConfig,

  // ==========================================
  // 7. UPV Analytics Service (PV/UV 独立统计服务)
  // ==========================================
  /**
   * Lightweight self-hosted page views (PV) & unique visitors (UV) counting service.
   * Backed by services/upv (Cloudflare Workers + D1 or Node/Docker + SQLite).
   */
  upv: {
    /** Whether UPV analytics are enabled across the site. */
    enabled: true,
    /**
     * Backend API URL. You can set it directly here, or leave blank to read
     * from the NEXT_PUBLIC_UPV_API environment variable.
     *
     * Must be a host the Worker actually answers on. `services/upv` is bound to
     * the zone route `stats.srprolin.top/*` (see services/upv/README.md, Workers
     * -> Domains & Routes); its `<name>.<subdomain>.workers.dev` hostname is NOT
     * published, and a workers.dev request to an unpublished Worker returns a
     * bare 404 `error code: 1042`, which the client can only read as "offline" —
     * every counter then silently renders 0.
     */
    api: "https://stats.srprolin.top",
    /** Whether to display the page views counter on article pages. */
    showPostCounter: true,
    /** Whether to display the page views counter on post listing cards. */
    showCardCounter: true,
    /** Whether to display "Total Views" and "Total Visitors" cards on /archives. */
    showArchivesStats: true,
  } as UpvConfig,

  // ==========================================
  // 9. Comment System: Waline (Waline 评论系统配置)
  // ==========================================
  /**
   * Waline comment system configuration.
   * Supports self-hosted Docker backend, Vercel, or custom server.
   */
  comment: {
    enabled: true,
    serverUrl: "https://waline.srprolin.top",
    emoji: [
      "https://unpkg.com/@waline/emojis@1.4.0/weibo",
      "https://unpkg.com/@waline/emojis@1.4.0/bilibili",
    ],
    placeholder: "说点什么吧... (支持 Markdown 语法与 Emoji 表情)",
    pageview: false,
    requiredMeta: ["nick", "mail"],
  } as CommentConfig,

  // ==========================================
  // 10. SEO, Webmasters & Analytics (搜索引擎收录、站长平台与数据统计)
  // ==========================================
  /**
   * Integrated SEO, Search Console, Google Analytics and IndexNow configuration.
   */
  seo: {
    /** Bing Webmaster Tools (支持 HTML Meta 标签鉴权) */
    bingWebmaster: {
      enabled: true,
      metaCode: "5DB2C9A2A7E7F356A6BC4294D57820DA",
    },
    /** Google Search Console (DNS验证为主，支持嵌入 HTML Meta 标签验证) */
    googleSearch: {
      enabled: true,
      verificationCode: "2fcc9d4a94d0a3f7",
    },
    /** Google Analytics 4 (GA4) */
    googleAnalytics: {
      enabled: true,
      measurementId: "G-3BJMF4MP44",
    },
    /** IndexNow 实时推送协议（配合 Bing / Yandex / Seznam） */
    indexNow: {
      enabled: true,
      key: "e6d05f27754c43a6b547e1df433311df",
      apiUrl: "https://api.indexnow.org/indexnow",
      batchSize: 10000,
    },
  } as SeoConfig,
};
