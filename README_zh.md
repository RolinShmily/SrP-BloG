<h1 align="center">SrP-BloG</h1>

<p align="center">
  <b>基于 Next.js 15 构建、纯静态导出的现代化个人技术博客</b>
</p>

<div align="center">

[![stars](https://img.shields.io/github/stars/RolinShmily/SrP-BloG.svg?style=flat&color=green)](https://github.com/RolinShmily/SrP-BloG)
[![fork](https://img.shields.io/github/forks/RolinShmily/SrP-BloG.svg?style=flat&color=critical)](https://github.com/RolinShmily/SrP-BloG)
[![license](https://img.shields.io/github/license/RolinShmily/SrP-BloG)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)

[English](./README.md) • [简体中文](./README_zh.md)

</div>

---

## 🌟 特性

- **纯静态导出**：Next.js 15 App Router (`output: 'export'`)，全站预渲染为 HTML，极速加载，零服务端运行时，原生契合 Cloudflare Pages。
- **单源 Markdown**：`content/posts/<slug>/index.md`，一文一目录，图片等资源同目录就近存放，便于维护与迁移。
- **现代化设计**：基于 shadcn/ui Zinc 风格定制，搭配卡片光标聚光灯特效、冬梅背景画布 (`ArtPlum`)、平滑页面转场与自适应暗色模式。
- **轻量双语**：UI 界面中英双语即时切换，无多余路由前缀与重复构建。
- **隐私统计 (UPV)**：内置可选的 Cloudflare Workers + D1 独立统计服务，加盐哈希去重，不存明文 IP，服务异常或未配置时静默降级。
- **完整周边**：内置客户端全文检索、标签多选筛选、RSS 2.0、Sitemap、IndexNow 自动推送与友链自动校验工作流。

---

## 📁 目录概览

```
├── content/              # 内容源：posts/ (文章)、friends/ (友链)、sponsors/ (赞助)
├── public/               # 静态资源与生成物 (favicon, og, 自动同步的封面等)
├── scripts/              # 辅助脚本 (资源同步、搜索索引、内容校验、新建文章等)
├── services/upv/         # 可选的独立 PV/UV 统计服务 (Cloudflare Workers + D1)
├── src/                  # 核心源码 (app, components, config, i18n, lib)
└── .github/workflows/   # CI/CD 自动化 (部署、IndexNow、友链 PR 校验)
```

---

## 🚀 快速上手

### 环境要求
- **Node.js** ≥ 22
- **pnpm** ≥ 9

### 本地开发

```bash
pnpm install            # 安装依赖
pnpm dev                # 启动本地开发服务 (http://localhost:3000)
pnpm build              # 静态预渲染导出 (产物位于 out/)
```

### 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 自动同步资源、生成搜索索引并启动开发服务器 |
| `pnpm build` | 执行静态预渲染导出，生成 `out/` 纯静态目录 |
| `pnpm lint` | 执行 ESLint 代码规范检查 |
| `pnpm verify-content` | 校验文章目录、frontmatter 与友链数据完整性 |
| `pnpm new-post -- <slug>` | 快速创建新文章模板目录 |

---

## ✍️ 写作说明

使用 `pnpm new-post -- <slug>` 或直接在 `content/posts/` 下新建目录。**目录名即为文章 URL slug**。

**文章示例** (`content/posts/<slug>/index.md`)：

```markdown
---
title: 文章标题
published: 2026-01-01
description: 文章一句话简介（用于列表摘要、搜索与 SEO）
image: ./cover.png       # 可选，支持同目录下相对路径图片
tags: [Next.js, Web]    # 可选，文章标签
draft: false            # 为 true 时不输出
pinned: false           # 为 true 时在首页置顶
---

这里是 Markdown 正文...
```

> **图片就近存放**：文章引用的本地图片建议直接存放在对应文章目录下（如 `./image.png`），构建时会自动同步到静态目录，免去集中管理图片的负担。

---

## ⚙️ 站点配置

全局站点配置统一收拢在 [`src/config/site.ts`](./src/config/site.ts)，可在此定制站点标题、作者信息、社交链接、ICP 备案号、友链申请指引及 UPV 统计开关等。

---

## 🚢 部署与 CI/CD

### 1. Cloudflare Pages 部署
本项目通过 `.github/workflows/deploy.yml` 自动打包并部署至 Cloudflare Pages：
- 在 GitHub 仓库设置中配置 Secrets：`CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID`。
- 推送代码至 `main` 分支即可自动触发构建与发布。
- *提示：若旧站曾使用 Cloudflare Worker，需先解绑或删除旧 Worker 的路由，再将域名绑定到 Pages 项目。*

### 2. （可选）UPV 统计服务部署
统计服务位于 `services/upv/`，基于 Cloudflare Workers + D1：
```bash
cd services/upv
cp .dev.vars.example .dev.vars
npm run db:schema                  # 应用 D1 数据库表结构
npm run db:migrate-slugs           # （可选）迁移旧 Astro 站历史统计数据
npx wrangler secret put SALT       # 配置加盐哈希密钥
npm run deploy                     # 部署 Worker
```
部署完成后，在 `src/config/site.ts` 中配置 `upv.api` 地址即可启用。

---

## 🤝 友链申请

本站友链采用单文件管理，欢迎提交 PR 互换：
1. Fork 本仓库。
2. 在 `content/friends/` 下新建 `<你的站点名>.json`：
   ```json
   {
     "name": "站点名称",
     "url": "https://example.com",
     "description": "一句话介绍",
     "avatar": "https://example.com/avatar.png",
     "backlink": "https://example.com/friends/"
   }
   ```
3. 提交 Pull Request，GitHub Actions 将自动完成可达性与双向链接校验。

---

## 📄 开源协议与致谢

- 本项目源码基于 **[MIT License](./LICENSE)** 开源。
- 博客原创文章与内容采用 **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)** 许可。
- 前身源于 [Fuwari](https://github.com/saicaca/fuwari) 模板，感谢原作者 [saicaca](https://github.com/saicaca) 的开源贡献。
