import type {
  ExpressiveCodeConfig,
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
  subtitle: "欢迎🎉",
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
    // 注：此处src已无效，在public/js/redirect-random.js处配置URL
    src: "", // Background image URL (supports HTTPS)
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
  favicon: [
    // Leave this array empty to use the default favicon
    {
      src: "/favicon/favicon.ico", // Path of the favicon, relative to the /public directory
      //   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
      //   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
    },
  ],
  officialSites: [
    { url: "https://blog.srprolin.top", alias: "ESA" },
    { url: "https://cf-blog.srprolin.top", alias: "Cloudflare" }
  ],
};

export const navBarConfig: NavBarConfig = {
  links: [
    LinkPreset.Home,
    LinkPreset.Archive,
    LinkPreset.About,
    {
      name: "追番",
      url: "/anime/", // Internal links should not include the base path, as it is automatically added
      external: false, // Show an external link icon and will open in a new tab
    },
    {
      name: "友链",
      url: "/frlinks/", // Internal links should not include the base path, as it is automatically added
      external: false, // Show an external link icon and will open in a new tab
    },
    {
      name: "开往",
      url: "https://www.travellings.cn/train.html", // Internal links should not include the base path, as it is automatically added
      external: true, // Show an external link icon and will open in a new tab
    },
    {
      name: "名片",
      url: "https://link.srprolin.top", // Internal links should not include the base path, as it is automatically added
      external: true, // Show an external link icon and will open in a new tab
    },
    {
      name: "统计",
      url: "https://umami.srprolin.top/share/UiFLP8hXMRLuRR5T", // Internal links should not include the base path, as it is automatically added
      external: true, // Show an external link icon and will open in a new tab
    },
  ],
};

export const profileConfig: ProfileConfig = {
  avatar: "assets/images/mzm-cyan.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
  name: "RoL1n",
  bio: "私はバンド楽しいっておもったこと、一度もない",
  links: [
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
