import type { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants";

export type SiteConfig = {
  title: string;
  subtitle: string;
  description?: string;
  keywords?: string;

  lang:
    | "en"
    | "zh_CN"
    | "zh_TW"
    | "ja"
    | "ko"
    | "es"
    | "th"
    | "vi"
    | "tr"
    | "id";

  themeColor: {
    hue: number;
    fixed: boolean;
  };

  // 添加bangumi配置
  bangumi?: {
    userId?: string; // Bangumi用户ID
  };
  // 添加anime番剧页面配置
  anime?: {
    mode?: "bangumi" | "local"; // 番剧页面模式
  };

  banner: {
    enable: boolean;
    src: string;
    position?: "top" | "center" | "bottom";
    credit: {
      enable: boolean;
      text: string;
      url?: string;
    };
  };

  // 随机图透明背景类型
  background: {
    enable: boolean;
    src: string;
    position?: "top" | "center" | "bottom";
    size?: "cover" | "contain" | "auto";
    repeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
    attachment?: "fixed" | "scroll" | "local";
    opacity?: number;
  };

  toc: {
    enable: boolean;
    depth: 1 | 2 | 3;
  };

  // 网站建站日期，用于计算运行天数
  launchDate?: string;

  favicon: Favicon[];

  // 域名切换器
  officialSites?: (string | { url: string; alias: string })[];
};

export type Favicon = {
  src: string;
  theme?: "light" | "dark";
  sizes?: string;
};

// Umami 访问量统计配置类型
export type UmamiConfig = {
  enable: boolean;
  baseUrl: string;
  shareId: string;
  timezone: string;
};

export enum LinkPreset {
  Home = 0,
  Archive = 1,
  About = 2,
}

export type NavBarLink = {
  name: string;
  url: string;
  external?: boolean;
};

export type NavBarConfig = {
  links: (NavBarLink | LinkPreset)[];
};

export type ProfileConfig = {
  avatar?: string;
  name: string;
  bio?: string;
  links: {
    name: string;
    url: string;
    icon: string;
  }[];
};

export type LicenseConfig = {
  enable: boolean;
  name: string;
  url: string;
};

export type LIGHT_DARK_MODE =
  | typeof LIGHT_MODE
  | typeof DARK_MODE
  | typeof AUTO_MODE;

export type BlogPostData = {
  body: string;
  title: string;
  published: Date;
  description: string;
  tags: string[];
  draft?: boolean;
  image?: string;
  category?: string;
  prevTitle?: string;
  prevSlug?: string;
  nextTitle?: string;
  nextSlug?: string;
};

export type ExpressiveCodeConfig = {
  theme: string;
};

// GitHub 编辑配置类型
export type GitHubEditConfig = {
  enable: boolean;
  baseUrl: string; // 例如: https://github.com/RolinShmily/SrP-BloG/blob/main/src/content/posts
};

// CMS 编辑配置类型
export type CmsEditConfig = {
  enable: boolean;
  baseUrl: string; // 例如: /admin
};
