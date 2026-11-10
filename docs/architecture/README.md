# 架构规范

本文描述 SrP-BloG 的运行时边界、构建管线、内容数据流与部署拓扑。目标是让维护者在改动任何一层之前，能判断**哪些东西在构建期发生、哪些在浏览器发生、哪些绝对不能进入客户端**。

## 1. 概览

SrP-BloG 是一个**完全静态预渲染**的个人技术博客，没有服务端运行时：

- **构建期**：Vite + React Router（framework mode，`ssr: false`）在 Node 中执行每个路由的 `loader`，把结果渲染成 `build/client/**/index.html` 与 `.data` 文件。
- **运行期**：浏览器只加载静态 HTML/CSS/JS；客户端路由负责后续导航、主题、语言、搜索、评论与统计。
- **部署**：Cloudflare Workers Static Assets 直接托管 `build/client/`，未知路径交给 `404.html`。

```text
┌──────────────────────────── 构建期 (Node) ────────────────────────────┐
│  content/**  ──►  内容管线  ──►  route loader  ──►  React 预渲染       │
│       │              │                                  │             │
│       │              ├── public/posts/**                ▼             │
│       │              ├── public/og/posts/**      build/client/**      │
│       │              ├── public/fonts/**                │             │
│       │              └── public/pagefind/**             │             │
└───────┼─────────────────────────────────────────────────┼─────────────┘
        │                                                 │
        ▼                                                 ▼
   Git 仓库内容                                 Cloudflare Workers
                                                 Static Assets
```

## 2. 技术栈与职责

| 层 | 技术 | 职责 |
| --- | --- | --- |
| 构建 | Vite 7 | 开发服务器、生产打包、静态资源处理 |
| 路由/渲染 | React Router 7（framework mode） | 路由表、loader、meta、资源路由、预渲染 |
| UI | React 19、Tailwind CSS 3、shadcn/ui、Radix UI | 组件与样式 |
| 内容 | gray-matter、unified、remark、rehype、Shiki、KaTeX | frontmatter 解析、Markdown 渲染、代码高亮、公式 |
| 搜索 | Pagefind | 构建期生成索引，浏览器端离线检索 |
| 字体 | 自托管 WOFF2 | 构建期下载，同源提供，按 unicode-range 切片 |
| 社交卡片 | Satori + Sharp | 构建期生成 1200×630 Open Graph 图 |
| 评论 | Waline | 客户端嵌入，可选 |
| 统计 | UPV（Cloudflare Workers + D1） | 客户端请求，可选 |
| 部署 | Cloudflare Workers Static Assets | 静态托管与 404 处理 |

## 3. 渲染模型

### 3.1 路由表

路由在 [`src/router/routes.ts`](../../src/router/routes.ts) 中显式声明，`appDirectory` 为 `src/router`（见 [`react-router.config.ts`](../../react-router.config.ts)）。

| 路径 | 模块 | 说明 |
| --- | --- | --- |
| `/` | `routes/home.tsx` | 首页，置顶文章 + 分页列表 |
| `/posts` | `routes/posts.tsx` | 全部文章列表 |
| `/posts/:slug` | `routes/post-detail.tsx` | 文章详情 |
| `/tags` | `routes/tags.tsx` | 标签云与筛选 |
| `/tags/:tag` | `routes/tag-detail.tsx` | 单标签文章列表 |
| `/archives` | `routes/archives.tsx` | 时间线、站点统计 |
| `/friends` | `routes/friends.tsx` | 友链与赞助 |
| `/404` | `routes/not-found.tsx` | 404 页面，`noindex` |
| `/rss.xml` | `routes/rss.ts` | RSS 2.0 资源路由 |
| `/sitemap.xml` | `routes/sitemap.ts` | Sitemap 资源路由 |
| `/robots.txt` | `routes/robots.ts` | robots 资源路由 |

路径声明不带尾斜杠；React Router 对 `/tags` 与 `/tags/` 等价匹配，预渲染输出为 `<path>/index.html`。

### 3.2 预渲染

[`react-router.config.ts`](../../react-router.config.ts) 中：

- `ssr: false`：不启动生产服务器，所有页面由预渲染产生。
- `prerender({ getStaticPaths })`：返回 `getStaticPaths()` 的静态路径，再追加：
  - 所有非草稿文章：`/posts/<slug>`；
  - 所有非草稿标签：`/tags/<tag>`。

构建时每个匹配路由的 `loader` 在 Node 中执行一次，输出：

- `build/client/<path>/index.html`；
- 对应的 `.data` 文件，供客户端导航时复用 loader 数据。

未知路径**不会**回退到 SPA shell：`finalize-vite-build.ts` 把 `404/index.html` 复制为 `404.html`，并删除未使用的 `__spa-fallback.html`。

### 3.3 服务端边界

只有 `.server.ts` 后缀的模块会被 React Router 从浏览器包中剥离：

- [`src/router/content.server.ts`](../../src/router/content.server.ts) — 文章、标签、站点统计；
- [`src/router/friends.server.ts`](../../src/router/friends.server.ts) — 友链与赞助。

这些模块底层使用 `node:fs`，只能在 loader / 构建期调用。**不要把 `node:*`、文件系统、Markdown 渲染链引入客户端组件。** 客户端需要的纯数据应通过 loader 返回值传递。

## 4. 内容管线

### 4.1 内容源

```text
content/
├── posts/
│   └── <slug>/
│       ├── index.md (或 index.mdx)   # 正文与 frontmatter
│       ├── cover.webp                # 可选：同目录资源
│       └── screenshot.png
├── friends/<站点>.json               # 单个 JSON 对象，不是数组
└── sponsors/<名称>.json              # 单个 JSON 对象
```

- **目录名即 slug**，保留 CJK 与特殊字符；文章文件固定为 `index.md` 或 `index.mdx`。
- 文章资源与正文同目录，构建期镜像到 `public/posts/<slug>/`。
- 草稿（`draft: true`）在预渲染、RSS、Sitemap 与列表中统一排除。

### 4.2 解析与排序

[`src/lib/content/provider.ts`](../../src/lib/content/provider.ts) 负责：

1. 递归扫描 `content/posts/**/index.{md,mdx}`；
2. 用 `gray-matter` 拆分 frontmatter 与正文；
3. 归一化日期为 `YYYY-MM-DD`（UTC）；
4. 计算字数、阅读时长、摘要：
   - CJK 字符按 1 字计，拉丁/数字连续串按 1 词计；
   - 阅读速度约 350 字/分钟；
   - 摘要优先取 `description`，否则截取纯文本前 160 字符；
5. 排序：`pinned` 优先，其余按 `published` 倒序。

### 4.3 Markdown 渲染

[`src/lib/content/markdown.ts`](../../src/lib/content/markdown.ts) 的管线顺序：

```text
remark-parse → remark-gfm → remark-math
  → remark-rehype
  → rehype-katex → rehype-slug → rehype-pretty-code
  → 标题降级 → TOC 提取 → 图片路径解析 → 懒加载/表格对齐
  → rehype-stringify
```

约定：

- 页面标题是唯一的 `<h1>`，正文标题整体降一级（`h1 → h2`，…），TOC 基于最终层级生成。
- 代码块由 Shiki 双主题高亮，明暗模式通过 `html.dark` 选择对应颜色变量。
- 图片相对路径解析：
  - `./cover.webp` → `/posts/<slug>/cover.webp`；
  - `../assets/...` → `/assets/...`；
  - 绝对路径、`http(s)://`、`data:` 原样保留。
- 正文图片自动补 `loading="lazy"` 与 `decoding="async"`。
- 表格的 `align` 同时写入 `data-align` 与内联 `text-align`，避免被全局样式覆盖。

### 4.4 文章资源同步

[`scripts/sync-post-assets.ts`](../../scripts/sync-post-assets.ts) 在 `pnpm dev` / `pnpm build` 开头运行：

- 复制 `content/posts/**` 下除 Markdown、隐藏文件外的所有资源到 `public/posts/**`；
- 对 `.png/.jpg/.jpeg/.webp` 生成同目录 `<name>.thumb.webp`（768px，`sharp`），用于列表卡片；
- 通过源文件大小 + mtime 做幂等跳过；
- 删除源目录已不存在的目标目录与孤儿缩略图，避免重命名/删除文章后残留；
- `siteConfig.cardThumbnail: false` 时完全跳过缩略图生成，卡片回退原图。

### 4.5 构建期生成物

| 路径 | 生成者 | 是否提交 |
| --- | --- | --- |
| `public/posts/**` | `sync-post-assets.ts` | 否（gitignore） |
| `public/og/posts/**` | `generate-og-image.ts` | 否 |
| `public/og/og.png` | `generate-og-image.ts` | 是（站点默认卡片） |
| `public/fonts/**` | `fetch-fonts.ts` | 否 |
| `public/pagefind/**` | `build-pagefind.ts` | 否 |
| `public/third-party-licenses.txt` | `generate-third-party-licenses.ts` | 否 |
| `build/client/**` | `react-router build` + 后处理 | 否 |

`public/` 采用**denylist**：只有上面这些派生目录被忽略，其余路径（favicon、赞助图、搜索引擎验证文件、`admin/`）都是源文件，路径本身即 URL。

## 5. 构建顺序

`pnpm build` 依次执行：

| # | 步骤 | 产物 / 作用 |
| --- | --- | --- |
| 1 | `scripts/fetch-fonts.ts` | 下载/复用四套字体到 `public/fonts/`，生成 `font-faces.css` 与 `manifest.json` |
| 2 | `scripts/sync-post-assets.ts` | 文章资源镜像与卡片缩略图 |
| 3 | `scripts/generate-og-image.ts` | 站点与每篇文章的 1200×630 社交卡片 |
| 4 | `scripts/generate-third-party-licenses.ts` | `public/third-party-licenses.txt` |
| 5 | `react-router build` | 预渲染到 `build/client/` |
| 6 | `scripts/build-pagefind.ts` | 索引 `build/client/`，复制搜索包到 `public/pagefind/` 供本地 dev |
| 7 | `scripts/finalize-vite-build.ts` | 生成 `404.html`，删除 `__spa-fallback.html` |
| 8 | `scripts/verify-seo.ts` | 审计导出的 HTML、canonical、sitemap、JSON-LD 与图片 alt |

`pnpm dev` 只执行 1、2、3（`--dev`）、4，然后启动 Vite；Pagefind 不在 dev 中重建，Vite 中间件会在 `public/pagefind/pagefind.js` 存在时直接提供它。**首次本地搜索需要先跑过一次 `pnpm build`。**

## 6. 客户端运行时

根文档 [`src/router/root.tsx`](../../src/router/root.tsx) 负责：

- `<head>`：meta、字体 CSS、全局样式、RSS alternate、站长验证 meta、语言预置脚本；
- `<body>`：主题、语言、环境艺术、进度条、导航、页面过渡、页脚、回到顶部、图片预览、搜索对话框；
- 生产环境按 `siteConfig.seo.googleAnalytics` 注入 GA4。

客户端状态：

| 能力 | 实现 | 持久化 |
| --- | --- | --- |
| 主题 | `next-themes`，`attribute="class"`，默认跟随系统 | `localStorage` |
| 语言 | 根文档预置脚本 + `LocaleProvider`；`?lang=` > `localStorage` > `zh` | `localStorage` + URL |
| 页面过渡 | `PageTransition` 以 pathname 为 key | 无 |
| 搜索 | Pagefind 动态 import `/pagefind/pagefind.js` | 无 |
| 评论 | Waline，`siteConfig.comment` 控制 | Waline 服务端 |
| 统计 | UPV，`siteConfig.upv` / `VITE_UPV_API` 控制 | 远端 D1 |

所有可选服务都必须**静默降级**：未配置、网络失败或跨域被拒时，页面仍应完整渲染，不出现阻塞性错误。

## 7. SEO 与资源路由

React Router 的 meta 语义是**最深匹配路由的 `meta` 覆盖父级**，因此每个页面模块必须返回完整描述符，不能依赖根路由补齐。统一入口：

- [`src/router/seo.ts`](../../src/router/seo.ts)：`pageMeta()`、`postMeta()`、`articleJsonLd()`；
- 根路由只服务无独立 `meta` 的错误边界等场景。

约定：

- 页面 canonical 使用带尾斜杠的绝对 URL；
- 文章 meta 包含 `og:type=article`、发布时间/修改时间、作者、section、tags、Twitter card 与 JSON-LD `BlogPosting`；
- 文章无封面时使用 `/og/posts/<slug>.png`，并只在这种情况下声明 1200×630 尺寸；
- Sitemap 只收录可索引页面；标签页仅在文章数 `> 1` 时进入 Sitemap；
- 404 页面输出 `noindex`；
- `verify-seo.ts` 会检查：indexable 页面必须有 title/description/canonical、恰好一个 H1、图片必须有非空 alt；title/description/canonical 不得跨页重复；canonical 必须与 sitemap 双向对应；JSON-LD 必须可解析。

RSS、Sitemap、robots 都是资源路由：loader 返回 `Response`，预渲染直接写文件而不是 HTML 文档。

## 8. 搜索

- [`scripts/build-pagefind.ts`](../../scripts/build-pagefind.ts) 在 `react-router build` 之后对 `build/client/` 建索引；
- 索引产物同时复制到 `public/pagefind/`，让 Vite dev 能提供同一份搜索包；
- [`src/lib/pagefind.ts`](../../src/lib/pagefind.ts) 在浏览器中动态 `import("/pagefind/pagefind.js")`，用 `@vite-ignore` 避免打包器把 public 文件纳入依赖图；
- 文章正文容器标记 `data-pagefind-body`，确保只索引正文而不是导航/页脚；
- 索引重建后若 dev server 仍在运行，Vite 对 public 目录的文件清单可能已过期，**重启 dev server** 即可。

## 9. 字体

- [`scripts/fetch-fonts.ts`](../../scripts/fetch-fonts.ts) 使用 Chrome UA 请求 Google Fonts CSS，解析所有 `@font-face`，下载 WOFF2 切片并生成：
  - `public/fonts/font-faces.css`（同源 URL + `unicode-range` + `font-display: swap`）；
  - `public/fonts/manifest.json`（来源列表、文件数、字节数）。
- 文件名带内容哈希；整批下载先写入临时目录，成功后原子替换旧目录。
- 缓存完整时完全跳过网络；`pnpm fonts -- --force` 强制刷新。
- 根文档先加载 `font-faces.css`，再加载 `globals.css`，最后加载 `fonts.css` 提供的字体变量。
- 四个家族：Inter（拉丁正文）、Noto Sans SC（中文）、JetBrains Mono（代码/元信息）、Instrument Serif（品牌展示）。字体二进制随站点分发，OFL-1.1 署名见 [Notice](../../Notice.md) 与构建期 `third-party-licenses.txt`。

## 10. 部署拓扑

[`wrangler.jsonc`](../../wrangler.jsonc)：

- `assets.directory = "./build/client"`；
- `not_found_handling = "404-page"`；
- 路由模式 `blog.srprolin.com/*`，要求该主机名在 Cloudflare zone 中已有**代理** DNS 记录。

CI（`.github/workflows/`）：

| 工作流 | 触发 | 作用 |
| --- | --- | --- |
| `deploy.yml` | push `main`（忽略 `services/cms/**`） | install → lint → typecheck → sync assets → verify-content → build → `wrangler deploy` |
| `indexnow.yml` | push `main` | build → 读取 sitemap 增量 → IndexNow 提交 → 提交 URL 记录 |
| `cms.yml` | PR / `main` | CMS OAuth 服务测试与部署 |
| `friend-link.yml` | PR | 友链可达性与双向链接校验 |
| `auto-pr.yml` | 定时/手动 | 自动 PR 流程 |

必需的仓库 Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`；CMS 额外需要 `CMS_GITHUB_CLIENT_ID`、`CMS_GITHUB_CLIENT_SECRET`。

## 11. 不变量

修改架构时，以下约束不应被破坏：

1. **没有服务端运行时**：所有路由必须可预渲染；不得引入需要请求时执行的 loader 逻辑。
2. **Node 依赖止步于 `.server.ts`**：文件系统、Markdown 渲染链、构建脚本不能进入浏览器包。
3. **每个页面返回完整 meta**：不能依赖父路由 meta 合并。
4. **内容源唯一**：文章只存在于 `content/posts/`；`public/posts/` 是派生物，不手工编辑。
5. **生成物不提交**：`public/` 下派生目录由构建重建；新增生成目录必须同步 `.gitignore`。
6. **字体同源**：运行时不请求 `fonts.googleapis.com` / `fonts.gstatic.com`。
7. **双语键一致**：`src/i18n/zh.ts` 与 `en.ts` 结构一致，由 `verify-content` 断言。
8. **依赖许可可声明**：新增生产依赖前确认许可族已被 `licenses/` 覆盖，否则构建失败。
9. **静态输出布局固定**：`build/client/`、`404.html`、无 SPA fallback。

## 12. 扩展路径

| 需求 | 步骤 |
| --- | --- |
| 新增静态页面 | 在 `src/router/routes/` 新建模块 → 在 `routes.ts` 注册 → 导出 `loader`/`meta`（用 `pageMeta`）→ 静态路径自动进入 `getStaticPaths()` |
| 新增文章 | `pnpm new-post -- <slug>` → 编辑 `content/posts/<slug>/index.md` → 同目录放图片 → `pnpm verify-content` |
| 新增构建产物 | 新脚本 → 接入 `package.json` 的 `dev`/`build` → 加 `.gitignore` → 更新本文与参考文档 |
| 新增字体 | 在 `fetch-fonts.ts` 的 `REQUESTS` 增加家族 → 在 `fonts.css` 增加变量 → 更新 `Notice.md` 与许可脚本的 `WEB_FONTS` |
| 新增可选服务 | 在 `src/config/site.ts` 增加开关与配置 → 组件内按开关渲染 → 保证未配置时静默降级 |

相关实现：[React Router 路由配置](../../react-router.config.ts)、[构建脚本目录](../../scripts/)、[CI 工作流](../../.github/workflows/)。
