import type {
  CmsEditConfig,
  ExpressiveCodeConfig,
  GitHubEditConfig,
  LicenseConfig,
  NavBarConfig,
  ProfileConfig,
  SiteConfig,
  UmamiConfig, // Umami 访问量配置
} from "./types/config";
import { LinkPreset } from "./types/config";

// umami 访问量统计配置
export const umamiConfig: UmamiConfig = {
  enable: true,
  baseUrl: "https://umami.srprolin.top",
  shareId: "UiFLP8hXMRLuRR5T",
  timezone: "Asia/Shanghai",
};

export const siteConfig: SiteConfig = {
  title: "SrP-BloG",
  subtitle: "技术分享与实践",
  description:
    "分享编程开发、游戏配置、服务器运维、网络技术、内网穿透、CDN优化、容器化部署等技术教程与实践经验的个人技术博客, 记录学习与折腾的点点滴滴。",
  keywords:
    "编程开发, 游戏配置, 服务器运维, 网络技术, 内网穿透, CDN优化, 容器化部署",
  lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
  themeColor: {
    hue: 345, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
    fixed: false, // Hide the theme color picker for visitors
  },

  // anime动漫墙(bangumi)
  bangumi: {
    userId: "990710", // 在此处设置你的Bangumi用户ID，可以设置为 "sai" 测试
  },
  anime: {
    mode: "bangumi", // 番剧页面模式："bangumi" 使用Bangumi API，"local" 使用本地配置
  },

  banner: {
    enable: false,
    src: "assets/images/wallhaven-1p6d79.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
    position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
    credit: {
      enable: true, // Display the credit text of the banner image
      text: "CopperHopper", // Credit text to be displayed
      url: "https://wallhaven.cc/w/1p6d79", // (Optional) URL link to the original artwork or artist's page
    },
  },

  // background image configuration
  background: {
    enable: true, // Enable background image
    src: "https://img.srprolin.top/pic?img=ua", // Background image URL (supports HTTPS)
    position: "center", // Background position: 'top', 'center', 'bottom'
    size: "cover", // Background size: 'cover', 'contain', 'auto'
    repeat: "no-repeat", // Background repeat: 'no-repeat', 'repeat', 'repeat-x', 'repeat-y'
    attachment: "fixed", // Background attachment: 'fixed', 'scroll', 'local'
    opacity: 1, // Background opacity (0-1)
  },

  toc: {
    enable: true, // Display the table of contents on the right side of the post
    depth: 3, // Maximum heading depth to show in the table, from 1 to 3
  },

  // 网站建站日期，格式：YYYY-MM-DD
  launchDate: "2024-01-01",

  favicon: [
    // Leave this array empty to use the default favicon
    {
      src: "/favicon/favicon.ico", // Path of the favicon, relative to the /public directory
      //   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
      //   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
    },
  ],

  officialSites: [{ url: "https://blog.srprolin.top", alias: "EdgeOne" }],
};

export const navBarConfig: NavBarConfig = {
  links: [
    LinkPreset.Home,
    LinkPreset.Archive,
    // LinkPreset.About,
    {
      name: "友链",
      url: "/frlinks/", // Internal links should not include the base path, as it is automatically added
      external: false, // Show an external link icon and will open in a new tab
    },
    {
      name: "赞助",
      url: "/sponsors/", // Internal links should not include the base path, as it is automatically added
      external: false, // Show an external link icon and will open in a new tab
    },
    {
      name: "封面",
      url: "/cover/", // Internal links should not include the base path, as it is automatically added
      external: false, // Show an external link icon and will open in a new tab
    },
    {
      name: "书签",
      url: "/navi/", // Internal links should not include the base path, as it is automatically added
      external: false, // Show an external link icon and will open in a new tab
    },
    {
      name: "追番",
      url: "/anime/", // Internal links should not include the base path, as it is automatically added
      external: false, // Show an external link icon and will open in a new tab
    },
    {
      name: "名片",
      url: "https://link.srprolin.top", // Internal links should not include the base path, as it is automatically added
      external: true, // Show an external link icon and will open in a new tab
    },
  ],
};

export const profileConfig: ProfileConfig = {
  avatar: "assets/images/mzm-cyan.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
  name: "RoL1n",
  bio: "Entities should not be multiplied unnecessarily.",
  links: [
    {
      name: "QQ交流群",
      icon: "fa6-brands:qq",
      url: "https://qm.qq.com/q/4eC5AuM0hi",
    },
    {
      name: "Bilibli",
      icon: "fa6-brands:bilibili",
      url: "https://space.bilibili.com/422744280",
    },
    {
      name: "Steam",
      icon: "fa6-brands:steam",
      url: "https://steamcommunity.com/profiles/76561199516828933/",
    },
    {
      name: "GitHub",
      icon: "fa6-brands:github",
      url: "https://github.com/RolinShmily",
    },
    {
      name: "Folo",
      icon: "folo",
      url: "https://app.folo.is/share/feeds/248766985642333184",
    },
  ],
};

export const licenseConfig: LicenseConfig = {
  enable: true,
  name: "CC BY-NC-SA 4.0",
  url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
  // Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
  // Please select a dark theme, as this blog theme currently only supports dark background color
  theme: "github-dark",
};

// GitHub 编辑配置
export const gitHubEditConfig: GitHubEditConfig = {
  enable: true,
  baseUrl:
    "https://github.com/RolinShmily/SrP-BloG/blob/main/src/content/posts",
};

// CMS 编辑配置
export const cmsEditConfig: CmsEditConfig = {
  enable: true,
  baseUrl: "/admin",
};
