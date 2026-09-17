<h1 align="center">SrP-BloG</h1>

<p align="center">
  <b>基于 Next.js 15 构建、纯静态导出的个人技术博客</b>
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

## 概述说明

**SrP-BloG** 是一个**纯静态导出**（`next build` + `output: 'export'`）的个人技术博客，部署在 Cloudflare Pages 上。Markdown 文件是唯一数据源：构建时从磁盘读取文章、预渲染为 HTML 并输出到 `out/`。

本项目最初是基于 [Fuwari](https://github.com/saicaca/fuwari) 模版的 [Astro](https://astro.build/) 站点，后重写为 Next.js App Router 架构；上游署名保留在文末。

### 技术栈

| 层次 | 选型 |
| --- | --- |
| 框架 | [Next.js 15](https://nextjs.org/) App Router（`output: 'export'`、`trailingSlash: true`） |
| UI 运行时 | [React 19](https://react.dev/) + TypeScript 5 |
| 样式 | [Tailwind CSS 3](https://tailwindcss.com/) + [`@tailwindcss/typography`](https://github.com/tailwindlabs/tailwindcss-typography) |
| 组件 | [shadcn/ui](https://ui.shadcn.com/)（Radix 原语 + `cva` + `tailwind-merge`） |
| 内容 | `unified`/`remark`/`rehype` 渲染 Markdown，`gray-matter` 解析 frontmatter |
| 代码块 | [`rehype-pretty-code`](https://rehype-pretty.pages.dev/) + [Shiki](https://shiki.style/) |
| 数学公式 | [`remark-math`](https://github.com/remarkjs/remark-math) + [`rehype-katex`](https://github.com/remarkjs/rehype-katex) + KaTeX |
| 主题 | [`next-themes`](https://github.com/pacocoursey/next-themes) |
| 国际化 | `src/i18n/` 自研字典（客户端切换，不增加路由前缀） |
| Lint | ESLint（`eslint-config-next`） |
| 统计 | 可选的自托管 `services/upv/`（Node + SQLite **或** Cloudflare Workers + D1） |
| 托管 | Cloudflare Pages（`out/`） |

---

## 目录结构

```
.
├── content/
│   ├── posts/
│   │   └── <slug>/                 # 一篇文章一个目录；目录名即 URL slug
│   │       ├── index.zh.md         # 中文正文（必需）
│   │       ├── index.en.md         # 可选的英文机翻
│   │       └── cover.png           # 可选的同目录局部资源（会复制到 public/posts/<slug>/）
│   ├── friends/                    # 友链：每个站点一个 JSON 文件（<站点名>.json）
│   │   └── <站点名>.json             # 单个对象：name / url / description / avatar [ / backlink ]
│   ├── _orphan-images/             # 暂存：没有任何文章引用的图片（可安全删除）
│   └── sponsors/                   # 赞助者：每人一个 JSON 文件（<姓名>.json）
│       └── <姓名>.json               # 单个对象：name / amount / date [ / platform ] [ / avatar ]
├── public/
│   ├── posts/                      # 构建产物：文章局部资源（已 gitignore）
│   ├── search-index.json           # 构建产物：客户端搜索索引（已 gitignore）
│   ├── og/                         # 默认 1200x630 Open Graph 卡片（母版 og.svg + 位图 og.png）
│   ├── favicon/                    # favicon.ico 与备案徽标图
│   ├── sponsors/                   # 赞助区的支付宝 / 微信收款码
│   └── ...                         # 各搜索引擎站点校验文件
├── scripts/
│   ├── sync-post-assets.ts         # content/posts/** -> public/posts/**
│   ├── generate-search-index.ts    # 生成 public/search-index.json
│   ├── generate-og-image.ts        # 重新生成 public/og/og.svg 并转出 public/og/og.png (resvg)
│   ├── verify-content.ts           # 内容/frontmatter 校验（CI 门禁）
│   ├── new-post.js                 # `pnpm new-post -- <slug>` 脚手架
│   └── indexnow-submit.js          # 从 out/sitemap.xml 提取 URL 提交 IndexNow
├── src/
│   ├── app/                        # App Router 路由（见「路由表」）
│   ├── components/
│   │   ├── ui/                     # shadcn/ui 基础组件
│   │   ├── layout/                 # 顶栏、页脚、卡片光标聚光灯动效
│   │   ├── blog/                   # 文章列表、正文视图、TOC、标签、友链、PV/UV 计数器
│   │   ├── icons/                  # lucide 没有的品牌标（Cloudflare/Folo/开往）与支付宝/微信支付
│   │   ├── i18n/                   # <T> 双语 DOM 组件、语言切换按钮
│   │   └── theme/                  # 主题 Provider 与切换按钮
│   ├── config/site.ts              # 站点元信息、导航、社交、CDN 厂商、协议、备案
│   ├── i18n/                       # zh.ts / en.ts 字典、LocaleProvider、格式化
│   └── lib/
│       ├── content/                # 内容层（文件扫描、Markdown 渲染、类型定义）
│       ├── friends.ts              # 友链数据提供者（content/friends/）
│       ├── sponsors.ts             # 赞助者数据提供者（content/sponsors/）
│       ├── seo.ts                  # Open Graph 与 Twitter 元数据构造工具
│       └── upv/                    # UPV 客户端 + 空实现（未配置时降级）
├── services/
│   └── upv/                        # 独立的 PV/UV 统计服务（自带 package.json，零运行时依赖）
├── .github/workflows/              # deploy.yml、indexnow.yml、friend-link.yml、auto-pr.yml
├── .env.example                    # NEXT_PUBLIC_UPV_API
└── next.config.mjs / tailwind.config.ts / tsconfig.json
```

---

## 本地开发

环境要求：**Node.js ≥ 22** 与 **pnpm**。

```bash
pnpm install            # CI 使用：pnpm install --frozen-lockfile --ignore-scripts
pnpm dev                # http://localhost:3000
```

### 可用脚本

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | `sync-assets` → `generate-search-index` → `next dev` |
| `pnpm build` | `sync-assets` → `generate-search-index` → `next build`，静态产物输出到 `out/` |
| `pnpm lint` | 通过 `next lint` 执行 ESLint |
| `pnpm verify-content` | 校验所有文章目录、frontmatter 与友链数据 |
| `pnpm sync-assets` | 把文章同目录资源复制到 `public/posts/` |
| `pnpm generate-search-index` | 重新生成 `public/search-index.json` |
| `pnpm generate-og-image` | 重新生成 `public/og.svg` 并渲染 `public/og.png` |
| `pnpm new-post -- <slug>` | 生成 `content/posts/<slug>/index.zh.md`（默认 draft） |

`pnpm start` 对站点本身没有意义：`output: 'export'` 不含服务端运行时，`out/` 由静态托管服务提供。

---

## 写作指南

### 1. 创建文章目录

```bash
pnpm new-post -- my-first-post
# 或手动创建：
mkdir -p content/posts/my-first-post
```

**目录名就是 URL slug**（`/posts/my-first-post/`）。中文、空格等非 ASCII slug 同样支持，URL 中会自动百分号编码。

### 2. frontmatter 字段

`content/posts/<slug>/index.zh.md`：

```markdown
---
title: 我的第一篇文章
published: 2026-01-01
updated: 2026-01-05        # 可选
description: 一句话摘要，用于列表、搜索与 meta 标签。
image: ./cover.png                  # 可选；路径相对于文章目录
tags: [Next.js, TypeScript]
category: Web
lang: zh                   # 可选的信息性标注；实际语言由文件名决定
draft: true                # draft 不会进入构建产物
pinned: false              # true 时置顶
---
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题。 |
| `published` | 是 | `YYYY-MM-DD`，用于排序与归档时间线。 |
| `updated` | 否 | 最后更新日期。 |
| `draft` | 否 | `true` 时该文章不参与输出。 |
| `description` | 否 | 列表摘要、搜索结果与 `<meta>`。 |
| `image` | 否 | 封面图（见「图片引用」）。 |
| `tags` | 否 | 标签数组，驱动 `/tags` 页面。 |
| `category` | 否 | 单个分类徽标。 |
| `lang` | 否 | 信息性内容语言标注。 |
| `pinned` | 否 | 置顶文章优先展示。 |

`pnpm verify-content` 会校验上述规则，并且是 CI 的一环。

### 3. 添加英文机翻

在同目录下新增 `index.en.md`（frontmatter 保持一致）。文章页的元信息栏会出现**机翻开关**（中文 ⇄ English）；两个版本都预渲染在同一个 HTML 里，切换无需额外请求。没有 `index.en.md` 的文章不显示开关。默认阅读语言始终是中文。

### 图片引用

所有图片都与使用它的文章**同目录存放**：放在 `content/posts/<slug>/` 中、Markdown 文件旁边，用 `./cover.png` 引用。`pnpm sync-assets`（`dev`/`build` 已内置）会复制到 `public/posts/<slug>/`，导出后的地址是 `/posts/<slug>/cover.png`。

已不再有共享图片目录。一张图被两篇文章用到时，就在两篇文章目录里各存一份—— 多占几百 KB，换来的是每篇文章都能独立地移动、改名或删除。

`public/posts/` 是 `content/posts/` 的生成镜像；同步步骤还会**清理**源文章已不存在的目标目录，因此重命名文章不会在导出物里留下孤儿目录。

用绝对 `https://` 地址引用的图片（例如外部 CDN）会原样保留。

---

## 路由表

| 路由 | 说明 |
| --- | --- |
| `/` | 文章列表（置顶优先，其余按时间倒序） |
| `/posts/[slug]` | 文章详情 + 目录 + 机翻开关 + 单篇 UV |
| `/tags` | 标签总览，支持 `?tag=` 客户端筛选 |
| `/friends` | 读取 `content/friends/` 的友链页 + 赞助区（`#sponsors`） |
| `/archives` | 统计卡片、全文检索、年份时间线、全站 UV |
| `/rss.xml` | 已发布文章的 RSS 2.0 订阅源 |
| `/sitemap.xml` | 站点地图（同时是 IndexNow 的 URL 来源） |
| `/robots.txt` | 爬虫规则与 sitemap 声明 |

`trailingSlash: true` 意味着所有页面都输出为 `out/<route>/index.html`。

---

## UI 双语与文章双语的区别

这是两件独立的事：

* **UI 文案** —— `src/i18n/zh.ts` / `src/i18n/en.ts` 字典（编译期强制 key 一致），顶栏提供客户端切换。由于是预渲染导出，服务端组件通过 `<T zh en>` 组件把**两种语言同时渲染进 DOM**，再由 CSS 按 `html[data-locale]` 隐藏非当前语言；客户端组件使用 `useLocale()`。选择会持久化在 `localStorage["srp-locale"]`，也支持用 `?lang=en` 强制指定。一次构建同时服务两种语言，不会产生 `/en/` 路由副本。
* **文章内容** —— 由文件决定：`index.zh.md`（默认）+ 可选的 `index.en.md`，在文章页内逐篇切换。

---

## 部署 —— Cloudflare Pages

构建产物就是普通静态目录（`out/`），任何静态托管均可。Cloudflare Pages 有两种方式：

**方式 A — Git 集成（控制台）**

1. Pages → *Create project* → 关联本仓库。
2. 框架预设 `Next.js (Static HTML Export)`，构建命令 `pnpm build`，输出目录 `out`。
3. 可选环境变量 `NEXT_PUBLIC_UPV_API`（见下），然后部署。

**方式 B — GitHub Actions（wrangler 直传）**

`.github/workflows/deploy.yml` 会在每次 push 到 `main`（以及手动 `workflow_dispatch`）时执行：checkout → pnpm 11 → Node 22 → `pnpm install --frozen-lockfile --ignore-scripts` → `pnpm lint` → `pnpm verify-content` → `pnpm build` → `wrangler pages deploy out --project-name=srp-blog --branch=main`。

需要的仓库 Secrets：

| Secret | 取值 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 具备 *Cloudflare Pages: Edit* 权限的 API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |

`--ignore-scripts` 会屏蔽依赖的生命周期脚本；当前工具链（`next`、`esbuild`/`tsx`）都以 `optionalDependencies` 形式提供预编译二进制，无需 `postinstall`。

另外两个工作流：

* `indexnow.yml` —— 重新构建，读取 `out/sitemap.xml` 中所有 `<loc>`，把新增 URL 提交到 IndexNow，并提交更新后的 `.last-urls.json`。
* `friend-link.yml` / `auto-pr.yml` —— 友链 Issue 指引与 PR 校验（打标签、schema 校验、URL 可达性、双向链接验证），合并始终由站长人工完成。

---

## UV / PV 统计服务（可选）

统计逻辑放在独立的 [`services/upv/`](./services/upv/README.md) 包中：一份共享核心、零运行时依赖，两种部署目标（Node ≥ 22.5 + SQLite，或 Cloudflare Workers + D1）。

启用方式是把前端指向该服务：

```bash
# .env.local
NEXT_PUBLIC_UPV_API=https://upv.example.com
```

**VPS / Docker**

```bash
cd services/upv
export UPV_SALT="$(openssl rand -hex 32)"
export UPV_ALLOWED_ORIGINS="https://blog.example.com"
docker compose up -d --build   # 计数持久化在 upv-data 卷中
curl -s http://127.0.0.1:8787/api/health
```

**Cloudflare Workers + D1**

```bash
cd services/upv
npx wrangler d1 create srp-blog-upv        # 把输出的 database_id 填进 wrangler.toml
npx wrangler d1 execute srp-blog-upv --file=./schema.sql --remote
npx wrangler secret put SALT
npx wrangler deploy
```

**降级行为**：未设置 `NEXT_PUBLIC_UPV_API` 时——或请求因任何原因失败（离线、CORS、广告拦截、超时）——客户端会退化为空实现：计数器不渲染任何内容，页面功能完全不受影响。服务端从不保存明文 IP（访客标识为加盐后的当日哈希）。

---

## 友链提交方式

友链存放于 [`content/friends/`](./content/friends) 目录：**每个站点一个 JSON 文件**，文件内容为**单个对象**（不是数组）。新建 `content/friends/<站点名>.json` 并提交 PR：

```json
{
  "name": "站点名",
  "url": "https://example.com",
  "description": "一句话简介",
  "avatar": "https://example.com/avatar.png"
}
```

四个字段均为必填。可选的 `backlink`（你站点中回链本站的页面绝对地址）用于自动双向链接验证；不填写时机器人会在 PR 中给出指引。工作流会自动打标签、校验 JSON 对象、检查 URL 可达性与双向链接，然后**等待人工合并**——不会自动合并。

### 文件命名约定

**文件名是条目的稳定标识符，展示用的名称以 `name` 字段为准。**

- 新增友链时**建议**用站点名作文件名（不得包含文件系统非法字符 `/ \ : * ? " < > |`），但**并非强制**要求与 `name` 字段相同。
- 文件一经合并**不建议再改名**：改名会使历史 PR、外部引用与 diff 追溯指向失效。
- 目录中部分文件沿用了上游仓库的历史文件名（例如 `雨月空间.json` 的 `name` 为 `Mintimate's Blog`），这与 `name` 字段不同属于**既有约定而非疏漏**，请勿“顺手修正”。
- 校验脚本只检查「文件数量 + 字段完整性 + URL 合法性 + `url`/`name` 全局唯一」，**不校验文件名与 `name` 一致**。

---

## 开源协议与版权声明

本项目严格遵循开源许可规范并尊重上游作者版权，具体授权细则如下：

1. **博客源码与二次开发代码**：
   - 本仓库的源代码及后续新增/修改功能均基于 **[MIT License](./LICENSE)**（Copyright &copy; 2025-2026 RoL1n_SrP）开源。
2. **上游模板致谢与版权**：
   - 源头来自 [Fuwari](https://github.com/saicaca/fuwari)（Astro 模版，版权所有 &copy; 2024 [saicaca](https://github.com/saicaca)，MIT License）；本站后来用 Next.js 重写，并保留该署名。
3. **博客文章与原创内容**：
   - 博客内所有原创文章及多媒体内容（除特殊注明外）均采用 **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)**（知识共享 署名-非商业性使用-相同方式共享 4.0 国际许可协议）进行许可。

<details>
<summary><b>点击展开查看 Fuwari 原作者 MIT 许可证文本</b></summary>

```text
MIT License

Copyright (c) 2024 saicaca

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

</details>
