# 开发规范

本文覆盖本地环境、编码约定、内容流程、验证命令与协作方式。贡献流程与许可以及友链规则见 [CONTRIBUTING](../../CONTRIBUTING.md)；系统分层与构建顺序见 [架构规范](../architecture/README.md)。

## 1. 环境要求

| 工具 | 版本 | 说明 |
| --- | --- | --- |
| Node.js | `>=22.5` | `package.json` 的 `engines` 约束；CI 使用 Node 22 |
| pnpm | `>=11` | 仓库提交 `pnpm-lock.yaml`，CI 使用 pnpm 11 |
| Git | 任意近期版本 | 提交信息遵循 Conventional Commits |

安装依赖时默认禁用生命周期脚本：

```bash
pnpm install --ignore-scripts
```

构建链（React Router / Vite / esbuild / sharp）通过可选依赖提供预编译二进制，不需要 `postinstall`。新增需要本地编译的依赖前，先确认构建环境具备对应工具链，并在 PR 中说明。

## 2. 首次启动

```bash
pnpm install --ignore-scripts
pnpm dev
```

`pnpm dev` 会依次执行：

1. `scripts/fetch-fonts.ts` — 首次下载约 5 MB 字体到 `public/fonts/`（已 gitignore），之后复用；
2. `scripts/sync-post-assets.ts` — 同步文章资源并生成卡片缩略图；
3. `scripts/generate-og-image.ts --dev` — 生成缺失的站点社交卡片；
4. `scripts/generate-third-party-licenses.ts` — 生成第三方许可声明；
5. `vite` — 启动开发服务器（默认 `http://localhost:5173`）。

搜索索引不在 dev 中生成。**首次使用搜索前先执行一次 `pnpm build`**，之后 `public/pagefind/` 会被 dev server 直接提供。

## 3. 常用命令

| 命令 | 作用 | 何时运行 |
| --- | --- | --- |
| `pnpm dev` | 开发服务器 + 预构建资源 | 日常开发 |
| `pnpm build` | 完整静态构建到 `build/client/` | 改动构建链、配置、依赖，或提交前 |
| `pnpm typecheck` | `react-router typegen` + `tsc --noEmit` | 每次提交前 |
| `pnpm lint` | ESLint（TypeScript + react-hooks，零警告） | 每次提交前 |
| `pnpm verify-content` | 内容管线完整性校验（85 项） | 改文章/配置/i18n 后 |
| `pnpm verify-seo` | 审计已构建的 HTML/Sitemap/JSON-LD | `pnpm build` 之后 |
| `pnpm fonts` | 下载或复用自托管字体 | 字体缓存缺失时 |
| `pnpm fonts -- --force` | 强制重新下载字体 | 字体源或抓取脚本变更后 |
| `pnpm sync-assets` | 单独同步文章资源 | 只想刷新 `public/posts/` 时 |
| `pnpm pagefind` | 对 `build/client/` 重建搜索索引 | 调试搜索结果时 |
| `pnpm generate-og-image` | 重新生成社交卡片 | 修改 OG 模板或文章标题后 |
| `pnpm generate-licenses` | 重新生成第三方许可声明 | 依赖变更后 |
| `pnpm new-post -- <slug>` | 创建文章目录与模板 | 新文章 |

## 4. 目录职责

| 路径 | 职责 | 不要放什么 |
| --- | --- | --- |
| `src/router/` | 路由表、根文档、页面模块、`.server.ts` 数据入口、SEO helper | 可复用 UI、业务工具函数 |
| `src/components/` | 展示组件：`blog/`、`layout/`、`art/`、`ui/`、`theme/`、`i18n/`、`icons/` | 文件系统访问、构建脚本 |
| `src/config/site.ts` | 站点级配置与功能开关 | 组件内部状态 |
| `src/i18n/` | 中英文字典、格式化、LocaleProvider | 页面级一次性文案可放在 `<T>` |
| `src/lib/` | 内容、导航、搜索、UPV、工具函数 | JSX 页面 |
| `src/styles/` | 全局样式、字体变量、Waline 定制 | 单组件样式（优先 Tailwind） |
| `content/` | 文章、友链、赞助等源数据 | 生成物 |
| `scripts/` | 构建期脚本（Node） | 浏览器运行时代码 |
| `services/` | 独立部署的 Worker 服务（UPV、CMS） | 博客前端代码 |
| `public/` | 直接映射为 URL 的静态源文件 + 构建期派生目录 | 手工编辑派生目录 |
| `docs/` | 项目规范与截图 | 用户向营销内容 |

## 5. 编码约定

### 5.1 TypeScript

- `tsconfig.json` 为 `strict: true`，模块解析 `bundler`，JSX `react-jsx`。
- 路径别名：
  - `@/*` → `src/*`；
  - `@nav` → `src/lib/navigation/index.ts`。
- 不用 `any` 处理业务数据；Markdown AST 边界是既有例外（`@typescript-eslint/no-explicit-any` 已关闭并注明原因）。
- 导出类型优先放在 `src/lib/content/types.ts`、`src/config/site.ts` 等已有类型模块，避免散落。
- 不要引入新的运行时依赖而不更新锁文件与许可声明；依赖变更需在 PR 中单独说明。

### 5.2 React 与路由

- 这是 React Router framework mode，不是 Next.js App Router：
  - 页面模块导出 `loader`、`meta`、默认组件；
  - 路由在 [`src/router/routes.ts`](../../src/router/routes.ts) 注册；
  - 静态路径由 `prerender` 自动收集，文章与标签路径由 `react-router.config.ts` 追加。
- 客户端导航统一使用 `@nav` 的 `Link`（传 `href`），不要从 `react-router` 直接导入 `Link` 再改属性名，也不要使用 `next/link`。
- 图片使用 `@nav` 的 `Image`（支持 `fill` / `priority`），不要使用 `next/image`；需要原生行为时直接用 `<img>`，并补齐 `alt`。
- 只有 loader 需要且只能在 Node 运行的模块使用 `.server.ts` 后缀；客户端组件不得导入它。
- 页面必须导出完整的 `meta`：使用 `pageMeta()` 或 `postMeta()`，不要依赖根路由补齐（React Router 会用最深匹配路由的 meta 覆盖父级）。
- loader 找不到资源时抛 `new Response("Not Found", { status: 404 })`，不要返回半成品页面。
- 本项目不是 RSC，新增客户端组件不需要写 `"use client"` 指令；已有文件中的该指令无运行时作用，可逐步清理，但不要为此单独制造大 diff。

### 5.3 样式

- 优先 Tailwind 语义类（`bg-background`、`text-muted-foreground`、`border-border`），颜色与圆角来自 `src/styles/globals.css` 的 token。
- 条件类使用 `cn()`（`clsx` + `tailwind-merge`）；自定义字号 token 必须同时注册到 `tailwind.config.ts` 与 `CUSTOM_FONT_SIZE_TOKENS`。
- 跨组件、需要伪元素/关键帧/复杂选择器的样式放 `src/styles/globals.css`；单组件状态用 Tailwind。
- 不引入新的全局 CSS 框架或图标库；图标优先 Lucide，品牌图标在 `src/components/icons/`。
- 动效遵守 [设计规范 · 动效](../design/README.md#6-动效)：不用 `transition: all`，装饰性动画必须在 `prefers-reduced-motion` 下关闭。

### 5.4 国际化

- 共享文案放入 `src/i18n/zh.ts` 与 `en.ts`，两者结构必须一致；`verify-content` 会断言 key 对齐。
- 预渲染可见的成对文案用 `<T zh={...} en={...} />`；它同时输出两个 `data-i18n` 节点，由根元素 `data-locale` 控制显示。
- 客户端需要当前语言或字典时使用 `useLocale()`（`locale`、`t`、`setLocale`、`toggleLocale`）。
- 不要用 `navigator.language` 在渲染期直接分支，否则预渲染 HTML 与客户端状态会不一致。
- 新增 UI 文案必须同时提供中英文；不要留下只有中文或只有英文的字符串。

### 5.5 错误处理

- 脚本和 loader 抛出的错误要带上下文（文件路径、URL、状态码），不要 `catch {}` 后静默返回空数据。
- 仅允许在明确可降级的边界吞掉异常，并写注释说明（例如 `localStorage` 不可用、可选统计服务离线）。
- 可选服务（Waline、UPV、GA）失败时页面必须继续可用，不能阻塞渲染。

## 6. 内容开发

### 6.1 新建文章

```bash
pnpm new-post -- <slug>
```

生成 `content/posts/<slug>/index.md`。目录名就是 URL slug，支持中文与特殊字符。

frontmatter：

```yaml
---
title: 文章标题
published: 2026-01-01
updated: 2026-01-01        # 必填，且不得早于 published
description: 摘要，用于列表、搜索与 SEO
image: ./cover.webp        # 可选，同目录资源
tags: [Vite, Web]          # 可选
draft: false               # true 时不发布
pinned: false              # true 时首页置顶
lang: zh                   # 可选，影响 og:locale
---
```

规则：

- 正文文件固定为 `index.md` 或 `index.mdx`。
- `title`、`published`、`updated` 为必填；日期必须是 `YYYY-MM-DD`，且 `updated >= published`。
- 已发布文章必须有显式、非空的 `description`；标题与 description 在所有已发布文章间必须唯一。
- 图片与文章同目录，引用 `./cover.webp`；构建期同步到 `/posts/<slug>/cover.webp` 并生成缩略图。
- `draft: true` 的文章不会出现在列表、RSS、Sitemap 或预渲染结果中，但仍需通过字段校验。
- `updated` 在修改内容时更新；文章页据此显示更新标记与“较旧文章”提示。
- 修改后运行 `pnpm verify-content`，再视情况运行 `pnpm build` 检查渲染结果。

### 6.2 友链与赞助

- `content/friends/<站点>.json`：单个 JSON 对象，必填 `name`、`url`、`description`、`avatar`，`backlink` 可选。
- `content/sponsors/<名称>.json`：单个 JSON 对象，必填 `name`、`amount`、`date`；`currency` 可选（`CNY` / `USD`），`platform`、`avatar` 可选。
- 文件名是稳定标识，显示名称取 `name` 字段；两者允许不同，不要为了“对齐”重命名文件。
- 格式错误会在构建期直接抛出并指向具体文件。

详细字段见 [参考规范 · 内容 schema](../reference/README.md#3-内容-schema)。

## 7. 验证与 CI

提交前至少运行：

```bash
pnpm lint
pnpm typecheck
pnpm verify-content
```

改动以下内容时还要运行 `pnpm build`：

- `vite.config.ts`、`react-router.config.ts`、`package.json`、锁文件；
- `scripts/`、`src/router/`、`src/lib/content/`、`src/styles/`；
- 任何影响预渲染输出、SEO、字体、搜索或部署路径的改动。

`pnpm build` 末尾会自动执行 `verify-seo`。CI 的 `deploy.yml` 顺序与本地一致：install → lint → typecheck → sync assets → verify-content → build（内含字体、OG、许可、Pagefind、404 处理、SEO 审计）→ 部署。

`indexnow.yml` 在 push `main` 后读取 `build/client/sitemap.xml`，增量提交新 URL。CI 还需要 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`；CMS 工作流额外需要 `CMS_GITHUB_CLIENT_ID`、`CMS_GITHUB_CLIENT_SECRET`。

## 8. 提交与 PR

- 一个 PR 只做一件事；大改动先开 issue 讨论方向。
- 提交信息使用 Conventional Commits：`feat:`、`fix:`、`content:`、`docs:`、`ci:`、`chore:` 等。
- 改动行为、配置或视觉基线时，同步更新 `docs/` 对应规范；新增截图放入 `docs/screenshot/` 并保持命名。
- 不要提交 `.env`、密钥、生成的 `public/posts/`、`public/fonts/`、`public/pagefind/`、`build/`。
- 新增生产依赖前确认许可族已被 `licenses/` 覆盖；未知许可族会让 `generate-licenses` 失败。

## 9. 常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| 首次 `pnpm dev` 较慢 | 正在下载约 5 MB 自托管字体；之后复用缓存 |
| 搜索在 dev 中 404 | 尚未执行过 `pnpm build`；构建一次生成 `public/pagefind/` |
| 重新构建后 dev 搜索仍是旧结果 | Vite 启动时缓存了 public 文件清单；重启 dev server |
| UPV 请求被 CORS 拒绝 | 本地 origin 不在统计服务白名单；不影响页面，生产域名正常 |
| 卡片缩略图 404 | 构建环境无法运行 sharp；在 `src/config/site.ts` 设 `cardThumbnail: false` 回退原图 |
| `pnpm typecheck` 报路由类型缺失 | 运行 `pnpm typecheck` 本身会先执行 `react-router typegen`；确认命令未被跳过 |
| 新依赖导致许可生成失败 | 在 `licenses/` 补充该许可族原文，或在 PR 中更换依赖 |
| 中文/英文文案缺失 | 检查 `zh.ts` 与 `en.ts` 结构，运行 `pnpm verify-content` |

## 10. 文档维护

- 行为变更与文档变更同 PR；不要事后补“历史文档”。
- 架构变化改 `docs/architecture/`；视觉/交互变化改 `docs/design/`；流程/约定变化改 `docs/development/`；字段/命令变化改 `docs/reference/`。
- 文档中的路径与命令要可点击/可复制；外部链接优先官方文档。
