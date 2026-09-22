<h1 align="center">SrP-BloG</h1>

<h4 align="center">基于 Next.js 15 构建、纯静态导出的现代化个人技术博客</h4>

<div align="center">

[![stars](https://img.shields.io/github/stars/RolinShmily/SrP-BloG.svg?style=flat&color=green)](https://github.com/RolinShmily/SrP-BloG)
![license](https://img.shields.io/github/license/RolinShmily/SrP-BloG)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat&logo=cloudflare)](https://workers.cloudflare.com/)

<br>

[English](README.md) | [简体中文](README_zh.md)

</div>

---

## 🌟 特性

- **纯静态导出**：基于 Next.js 15 App Router (`output: 'export'`)，全站预渲染为 HTML，极速加载，零服务端运行时。
- **单源 Markdown**：`content/posts/<slug>/index.md`，一文一目录，图片等资源同目录就近存放并自动同步。
- **可视化内容管理 (Sveltia CMS)**：集成原生 Git 存储的无头 CMS，位于 `/admin` (`public/admin/`)，支持文章、友链与赞助的可视化编辑，由独立的静态文件配置驱动。
- **现代化互动评论 (Waline)**：文章详情页与友链页面无缝嵌入 Waline 评论区，支持微博/Bilibili 表情包、Markdown 语法与深浅双色自适应主题定制，支持 `siteConfig.comment.enabled` 一键启闭。
- **现代化设计**：基于 shadcn Zinc 风格，内置卡片光标微光（Card Spotlight）、冬梅背景画布 (`ArtPlum`)、平滑转场与自适应暗色模式。
- **轻量双语**：UI 界面支持中英即时切换，无额外路由前缀与重复构建开销。
- **全方位 SEO 与统计**：原生集成 Google Analytics 4 (GA4)、Google Search Console 与 Bing Webmaster 的 Meta 标签鉴权，集成 IndexNow 增量实时推送到搜索引擎。
- **隐私统计 (UPV)**：可选基于 Cloudflare Workers + D1 的独立统计服务，加盐哈希去重，不存明文 IP，未配置时静默降级。
- **开箱即用**：集成客户端全文检索、多标签过滤、RSS 2.0、Sitemap 与友链自动校验工作流。

---

## 📁 目录结构

```
├── content/              # 内容源：posts/ (文章)、friends/ (友链)、sponsors/ (赞助)
├── public/               # 静态资源与自动生成的封面、搜索索引、第三方声明
├── scripts/              # 辅助脚本 (资源同步、搜索索引、第三方声明、内容校验等)
├── services/upv/         # 可选的独立 PV/UV 统计服务 (Cloudflare Workers + D1)
├── src/                  # 核心源码 (app, components, config, i18n, lib)
├── CODE_OF_CONDUCT.md    # 行为准则 (Contributor Covenant 2.1)
├── CONTRIBUTING.md       # 贡献指南 (友链、勘误、代码、提交前检查)
├── SECURITY.md           # 安全政策与漏洞报告渠道
├── LICENSE               # MIT 源码许可（保持原文，便于 GitHub 识别）
├── licenses/             # 第三方许可证原文 (MIT/Apache-2.0/ISC/BSD/OFL-1.1/CC-BY-4.0)
├── Notice.md             # 授权范围说明 (文章/字体/第三方不在 MIT 内)
└── .github/workflows/    # CI/CD 自动化 (部署、IndexNow、友链校验)
```

---

## ⚡ 快速上手

```bash
pnpm install            # 安装依赖
pnpm dev                # 启动本地开发服务 (http://localhost:3000)
pnpm build              # 静态导出构建 (产物位于 out/)
pnpm lint               # 代码规范检查
pnpm verify-content     # 内容管线完整性校验 (78 项检测)
pnpm new-post -- <slug> # 创建新文章模板目录
```

---

## ✍️ 写作说明

使用 `pnpm new-post -- <slug>` 或在 `content/posts/` 下新建目录，**目录名即为文章 slug**：

```markdown
---
title: 文章标题
published: 2026-01-01
description: 文章简介（用于摘要、搜索与 SEO）
image: ./cover.png       # 可选：同目录下图片相对路径
tags: [Next.js, Web]    # 可选：标签
draft: false            # 为 true 时不发布
pinned: false           # 为 true 时在首页置顶
---

Markdown 正文...
```

> **图片就近存放**：引用图片直接放在文章目录下（如 `./cover.png`），构建时自动同步至静态目录，并由 `sharp` 压缩为 768px 的 WebP 卡片缩略图（`<name>.thumb.webp`，体积约减少 95%）——CI 工作流将该步骤独立执行。若构建环境无法运行缩略图步骤，请在 `src/config/site.ts` 中设置 `cardThumbnail: false`，卡片将回退使用原图。

---

## ⚙️ 站点配置

全局配置统一收拢在 [`src/config/site.ts`](./src/config/site.ts)，集中维护全站核心元数据与服务集成开关：

- **基础与展示**：站点标题、作者身份、社交媒体链接、ICP 备案号、友链申请信息及页脚技术栈。
- **互动评论 (`comment`)**：集成 Waline 评论区，支持配置服务端 URL 及全站一键启闭。
- **SEO 与站长生态 (`seo`)**：集成 Google Analytics 4、Google Search Console、Bing Webmaster 鉴权及 IndexNow 实时推送。
- **隐私统计 (`upv`)**：集成自建 Cloudflare Workers + D1 的 PV/UV 统计服务 API。
- **图片优化 (`cardThumbnail`)**：卡片封面使用构建期 `sharp` 生成的 WebP 缩略图，无法运行缩略图步骤时可关闭并回退原图。

---

## 🌐 部署与 CI/CD

### 1. 博客静态部署 (Cloudflare Workers)

通过 `.github/workflows/deploy.yml` 自动构建部署：

- 在 GitHub 仓库中配置 Secrets：`CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID`。
- 推送至 `main` 分支即可自动构建并部署至 Cloudflare Workers（基于 `wrangler.jsonc` 静态资产托管）。

### 2. （可选）UPV 统计服务与 D1 迁移

统计服务位于 `services/upv/`：

```bash
cd services/upv && cp .dev.vars.example .dev.vars
npm run db:schema                  # 初始化 D1 表结构
npx wrangler secret put SALT       # 配置加盐哈希密钥
npm run deploy                     # 部署 Worker
```

部署后在 `src/config/site.ts` 中配置 `upv.api` 即可。

**D1 版本化迁移（Wrangler Migrations）**：

```bash
npm run db:migrate:create -- <name> # 创建迁移文件 (migrations/0001_<name>.sql)
npm run db:migrate:local            # 本地沙箱测试
npm run db:migrate:remote           # 部署到线上 D1
npm run db:migrate:list             # 查看迁移状态
```

---

## 🤝 友链申请

在 `content/friends/<站点名>.json` 下新增单对象文件后提交 PR，GitHub Actions 将自动完成可达性与双向链接校验：

```json
{
  "name": "站点名称",
  "url": "https://example.com",
  "description": "一句话介绍",
  "avatar": "https://example.com/avatar.png",
  "backlink": "https://example.com/friends/"
}
```

更多贡献方式（文章勘误、代码与界面改进）与提交前必须通过的检查见 **[CONTRIBUTING.md](./CONTRIBUTING.md)**；安全问题的报告渠道见 **[SECURITY.md](./SECURITY.md)**。

---

## 📄 开源协议与致谢

- 博客源码基于 **[MIT License](./LICENSE)** 开源；授权范围见 **[授权范围说明](./Notice.md)** —— 文章内容、Web 字体与第三方组件不在 MIT 范围内。
- 博客原创文章与内容采用 **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)** 许可。
- 参考并致谢（界面设计参考，未搬运源码）：[cworld1/astro-theme-pure](https://github.com/cworld1/astro-theme-pure)（Apache-2.0）、[Dancncn/DansBlog](https://github.com/Dancncn/DansBlog)（MIT）、[antfu/antfu.me](https://github.com/antfu/antfu.me)（MIT）。

### 第三方组件

随站点分发的第三方代码由 [`scripts/generate-third-party-licenses.ts`](./scripts/generate-third-party-licenses.ts) 在构建期生成声明到 `public/third-party-licenses.txt`（即 [`/third-party-licenses.txt`](/third-party-licenses.txt)），逐包携带上游版权行与全部许可原文；原文另存于 [`licenses/`](./licenses/)。仅构建期出现、不随产物分发的组件（`devDependencies`、`sharp`/libvips 等平台二进制、`caniuse-lite` 这类构建期数据）不触发分发义务，不在声明之列。

### Web 字体（OFL-1.1，随产物分发）

字体是本站唯一以二进制形式分发的第三方作品，OFL-1.1 第 2 条要求每一份副本都包含版权声明与本许可证，故必须署名：

| 字体 | 用途 | 版权行 |
| --- | --- | --- |
| [Inter](https://rsms.me/inter/) | 英文正文 | Copyright (c) 2016-2023 The Inter Project Authors |
| [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | 代码块与 UI 界面的西文/数字 | Copyright (c) 2020 The JetBrains Mono Authors |
| [Noto Sans SC 思源黑体](https://fonts.google.com/noto/specimen/Noto+Sans+SC) | 全站中文（Google 与 Adobe 联合出品） | Copyright (c) 2014-2025 Adobe, Google, and the Noto Project Authors |
| [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) | 品牌展示衬线 | Copyright (c) 2022 The Instrument Serif Project Authors |
| **KaTeX 字体**（20 款 × `ttf`/`woff`/`woff2` = 60 个文件） | 数学公式渲染，随 `katex/dist/katex.min.css` 分发 | Copyright (c) 2009-2010, Design Science, Inc. (www.mathjax.org)；Copyright (c) 2014 Khan Academy — **with Reserved Font Name `KaTeX_Main`** 等 |

KaTeX 字体随 `katex` 包发布（该包声明 MIT），但字体二进制依自身元数据以 OFL-1.1 授权（上游确认：[KaTeX/KaTeX#339](https://github.com/KaTeX/KaTeX/issues/339)），故在此显式登记。
