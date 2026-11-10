# 参考规范

速查表优先。字段的完整类型与注释以源文件为准，本文只列常用项、默认值与约束。

## 1. 命令速查

| 命令 | 实际脚本 | 说明 |
| --- | --- | --- |
| `pnpm dev` | `fetch-fonts` → `sync-assets` → `generate-og-image --dev` → `generate-licenses` → `vite` | 开发服务器，默认 `http://localhost:5173` |
| `pnpm build` | `fetch-fonts` → `sync-assets` → `generate-og-image` → `generate-licenses` → `react-router build` → `build-pagefind` → `finalize-vite-build` → `verify-seo` | 完整静态构建，输出 `build/client/` |
| `pnpm typecheck` | `react-router typegen && tsc --noEmit` | 先补全路由类型再检查 |
| `pnpm lint` | `eslint --ext .ts,.tsx --max-warnings 0 .` | 零警告 |
| `pnpm verify-content` | `tsx scripts/verify-content.ts` | 内容/排序/i18n/SEO helper 等 85 项校验 |
| `pnpm verify-seo` | `tsx scripts/verify-seo.ts` | 审计 `build/client/`，需先构建 |
| `pnpm fonts` | `tsx scripts/fetch-fonts.ts` | 复用缓存或下载字体 |
| `pnpm fonts -- --force` | 同上，带 `--force` | 强制重新下载 |
| `pnpm sync-assets` | `tsx scripts/sync-post-assets.ts` | 同步文章资源与缩略图 |
| `pnpm pagefind` | `tsx scripts/build-pagefind.ts` | 重建搜索索引 |
| `pnpm generate-og-image` | `tsx scripts/generate-og-image.ts` | 生成站点/文章社交卡片 |
| `pnpm generate-licenses` | `tsx scripts/generate-third-party-licenses.ts` | 生成第三方许可声明 |
| `pnpm new-post -- <slug>` | `node scripts/new-post.js <slug>` | 创建草稿文章目录 |

脚本可接受目录参数的情况：

```bash
tsx scripts/build-pagefind.ts some/dir
tsx scripts/verify-seo.ts build/client
```

## 2. 环境变量与密钥

### 2.1 本地环境

复制 `.env.example` 为 `.env.local`（已 gitignore）。Vite 只向浏览器暴露 `VITE_` 前缀变量。

| 变量 | 作用 | 默认 / 回退 |
| --- | --- | --- |
| `VITE_UPV_API` | UPV 统计服务基地址 | `siteConfig.upv.api` 优先；两者都为空则统计静默禁用 |

### 2.2 CI Secrets

| Secret | 使用者 | 作用 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | `deploy.yml`、`cms.yml` | Wrangler 部署 |
| `CLOUDFLARE_ACCOUNT_ID` | `deploy.yml`、`cms.yml` | Cloudflare 账户 |
| `CMS_GITHUB_CLIENT_ID` | `cms.yml` | Sveltia CMS OAuth App |
| `CMS_GITHUB_CLIENT_SECRET` | `cms.yml` | Sveltia CMS OAuth App |

### 2.3 站长平台与 IndexNow

在 [`src/config/site.ts`](../../src/config/site.ts) 的 `siteConfig.seo` 中配置：

| 字段 | 作用 |
| --- | --- |
| `bingWebmaster.enabled` / `metaCode` | 启用后且 code 非空才输出 `msvalidate.01` meta |
| `googleSearch.enabled` / `verificationCode` | 启用后且 code 非空才输出 `google-site-verification` meta |
| `googleAnalytics.enabled` / `measurementId` | 启用后注入 GA4 |
| `indexNow.enabled` / `key` / `apiUrl` / `batchSize` | IndexNow 提交；`public/<key>.txt` 必须存在且内容为 key |

IndexNow key 是公开验证值，不是密钥；对应文件必须随站点发布。**不要把 Cloudflare token、OAuth secret、`.env` 内容提交到仓库。**

## 3. 内容 schema

### 3.1 文章 frontmatter

路径：`content/posts/<slug>/index.md`（或 `.mdx`）。目录名即 slug。

| 字段 | 类型 | 必填 | 默认 | 约束 |
| --- | --- | --- | --- | --- |
| `title` | string | 是 | — | 已发布文章标题必须唯一 |
| `published` | `YYYY-MM-DD` | 是 | — | ISO 日期 |
| `updated` | `YYYY-MM-DD` | 是 | — | 不得早于 `published`；`verify-content` 强制要求 |
| `description` | string | 已发布必填 | — | 非空且已发布文章间唯一；用于摘要、搜索、SEO |
| `image` | string | 否 | — | `./x` 解析为 `/posts/<slug>/x`；也可用绝对/外链 |
| `tags` | string[] | 否 | `[]` | 用于标签页、筛选、SEO |
| `draft` | boolean | 否 | `false` | true 时不发布 |
| `pinned` | boolean | 否 | `false` | true 时列表置顶 |
| `lang` | string | 否 | — | 文章语言，影响 `og:locale`（`en` → `en_US`，其他 → `zh_CN`） |

`pnpm new-post` 生成的模板包含 `updated`、空 `description`、`draft: true`，发布前补齐。

### 3.2 友链

路径：`content/friends/<站点>.json`。单个 JSON 对象，不是数组。

```json
{
  "name": "站点名称",
  "url": "https://example.com",
  "description": "一句话介绍",
  "avatar": "https://example.com/avatar.png",
  "backlink": "https://example.com/friends/"
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | 显示名称 |
| `url` | 是 | 站点地址 |
| `description` | 是 | 简介 |
| `avatar` | 是 | 头像；历史数据中的 `avartar` 仍兼容 |
| `backlink` | 否 | 对方友链页，用于双向链接校验 |

文件名是稳定标识，允许与 `name` 不同；不要为了对齐而重命名。

### 3.3 赞助

路径：`content/sponsors/<名称>.json`。单个 JSON 对象。

```json
{
  "name": "赞助者",
  "amount": 50,
  "currency": "CNY",
  "date": "2026-01-01",
  "platform": "WeChat",
  "avatar": "https://example.com/avatar.png"
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | 显示名称 |
| `amount` | 是 | 金额，允许带货币符号，解析时去除非数字字符 |
| `currency` | 否 | `CNY`（默认）或 `USD` |
| `date` | 是 | `YYYY-MM-DD` |
| `platform` | 否 | 渠道 |
| `avatar` | 否 | 头像 URL |

## 4. 站点配置

[`src/config/site.ts`](../../src/config/site.ts) 是唯一站点配置入口，按注释分为以下区段：

| 区段 | 关键字段 | 说明 |
| --- | --- | --- |
| 基本信息 | `title`、`subtitle`、`description`、`keywords`、`author`、`brandAuthor`、`brandTitle`、`bio`、`avatar`、`url`、`homeUrl`、`repoUrl` | `url` 为 SEO/RSS 绝对地址基准，末尾不带 `/` |
| SEO / OG | `ogImage`、`ogCard`、`rssUrl`、`sitemapUrl` | `ogCard` 控制 Satori 模板、主色、背景、水印与显示项 |
| 阅读与美学 | `postsPerPage`（默认 8）、`ambientArt`（`plum`/`dots`/`auto`/`none`）、`cardThumbnail` | `cardThumbnail: false` 关闭 sharp 缩略图并回退原图 |
| 导航与社交 | `nav`、`socials` | `nav` 的 `i18nKey` 对应字典键；`external` 控制外链箭头 |
| 页脚 | `launchYear`、`license`、`humanAuthoredBadge`、`travellingsUrl`、`filing`、`techStack` | `travellingsUrl` 置空隐藏开往徽标 |
| 友链与赞助 | `friendSiteInfo`、`friendApplication`、`sponsorship` | 开关与申请入口 |
| UPV | `upv.enabled`、`upv.api`、`upv.show*` | `api` 优先于 `VITE_UPV_API` |
| 评论 | `comment.enabled`、`serverUrl`、`emoji`、`placeholder`、`pageview`、`requiredMeta` | 关闭后文章与友链页都不渲染评论区 |
| SEO | `seo.bingWebmaster`、`seo.googleSearch`、`seo.googleAnalytics`、`seo.indexNow` | 见 2.3 |

`ogCard.template` 可选 `modern` / `editorial` / `terminal` / `matrix`；`theme` 可选 `obsidian` / `zinc` / `slate` / `pure`；`backgroundPattern` 可选 `glow` / `grid` / `dots` / `clean`。

新增配置项时，应同时更新 TypeScript 接口、`siteConfig`、本表与相关规范。

## 5. 生成物与 URL 映射

| 本地路径 | 线上 URL | 生成者 | 提交 |
| --- | --- | --- | --- |
| `build/client/**` | `/` | `react-router build` | 否 |
| `build/client/404.html` | `/404.html` | `finalize-vite-build.ts` | 否 |
| `public/posts/<slug>/**` | `/posts/<slug>/**` | `sync-post-assets.ts` | 否 |
| `public/og/posts/<slug>.png` | `/og/posts/<slug>.png` | `generate-og-image.ts` | 否 |
| `public/og/og.png` | `/og/og.png` | `generate-og-image.ts` | 是 |
| `public/fonts/**` | `/fonts/**` | `fetch-fonts.ts` | 否 |
| `public/pagefind/**` | `/pagefind/**` | `build-pagefind.ts` | 否 |
| `public/third-party-licenses.txt` | `/third-party-licenses.txt` | `generate-third-party-licenses.ts` | 否 |
| `public/admin/**` | `/admin/**` | 手工维护 | 是 |
| `public/<indexnow-key>.txt` | `/<key>.txt` | 手工维护 | 是 |

`public/` 采用 denylist：新增构建期派生目录时，必须同时在 `.gitignore` 中登记，否则会被误提交。

## 6. 关键文件索引

| 主题 | 文件 |
| --- | --- |
| 路由表 | [`src/router/routes.ts`](../../src/router/routes.ts) |
| 预渲染配置 | [`react-router.config.ts`](../../react-router.config.ts) |
| 根文档 / 全局注入 | [`src/router/root.tsx`](../../src/router/root.tsx) |
| SEO helper | [`src/router/seo.ts`](../../src/router/seo.ts) |
| 站点配置 | [`src/config/site.ts`](../../src/config/site.ts) |
| 内容类型 | [`src/lib/content/types.ts`](../../src/lib/content/types.ts) |
| 内容提供者 | [`src/lib/content/provider.ts`](../../src/lib/content/provider.ts) |
| Markdown 管线 | [`src/lib/content/markdown.ts`](../../src/lib/content/markdown.ts) |
| 导航适配层 | [`src/lib/navigation/react-router.tsx`](../../src/lib/navigation/react-router.tsx) |
| 搜索客户端 | [`src/lib/pagefind.ts`](../../src/lib/pagefind.ts) |
| 设计令牌 | [`src/styles/globals.css`](../../src/styles/globals.css) |
| 字体变量 | [`src/styles/fonts.css`](../../src/styles/fonts.css) |
| 构建脚本 | [`scripts/`](../../scripts/) |
| 部署配置 | [`wrangler.jsonc`](../../wrangler.jsonc) |
| CI | [`.github/workflows/`](../../.github/workflows/) |

## 7. 外部参考

- [React Router — Framework Mode](https://reactrouter.com/start/framework/installation)
- [Vite — Guide](https://vite.dev/guide/)
- [Tailwind CSS — Docs](https://tailwindcss.com/docs)
- [Pagefind — Docs](https://pagefind.app/docs/)
- [Waline — Docs](https://waline.js.org/)
- [Satori](https://github.com/vercel/satori)
- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [SIL Open Font License 1.1](https://openfontlicense.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
