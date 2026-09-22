<h1 align="center">SrP-BloG</h1>

<h4 align="center">A modern personal tech blog built with Next.js 15 and exported as a fully static site</h4>

<div align="center">

[![stars](https://img.shields.io/github/stars/RolinShmily/SrP-BloG.svg?style=flat&color=green)](https://github.com/RolinShmily/SrP-BloG)
![license](https://img.shields.io/github/license/RolinShmily/SrP-BloG)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat&logo=cloudflare)](https://workers.cloudflare.com/)

<br>

[English](README.md) | [简体中文](README_zh.md)

</div>

---

## 🌟 Features

- **Pure Static Export**: Built on Next.js 15 App Router (`output: 'export'`), pre-rendered into static HTML for instant loading and zero server runtime.
- **Single-Source Markdown**: `content/posts/<slug>/index.md` — one directory per post with co-located media assets, automatically synchronized during build.
- **Visual Headless CMS (Sveltia CMS)**: Integrated Git-based CMS at `/admin` (`public/admin/`) for editing posts, friend links, and sponsors. Self-contained and easily configured via standard static files.
- **Modern Comments (Waline)**: Embedded comment area with Emoji support, Markdown editing, and theme adaptation across article detail pages and the friends page. Toggled via `siteConfig.comment.enabled`.
- **Modern Aesthetics**: Editorial shadcn Zinc styling, cursor-tracking spotlight card glow (`Card Spotlight`), procedural winter plum canvas art (`ArtPlum`), smooth page transitions, and adaptive dark mode.
- **Lightweight Bilingual UI**: Instant Chinese/English UI switching on the client side without route duplication or extra build overhead.
- **Comprehensive SEO & Analytics**: Integrated Google Analytics 4 (GA4), Search Console & Bing Webmaster HTML meta verification, and automated real-time IndexNow instant indexing.
- **Privacy-Focused Analytics (UPV)**: Optional standalone Cloudflare Workers + D1 counting service with salted daily hashing and zero IP storage; degrades silently when unconfigured.
- **Batteries Included**: Client-side full-text search, multi-tag filtering, RSS 2.0, Sitemap, and automated friend-link validation workflows.

---

## 📁 Directory Structure

```
├── content/              # Content source: posts/, friends/, sponsors/
├── public/               # Static assets & generated covers, search index, third-party notices
├── scripts/              # Utility scripts (asset sync, search index, third-party notices, content verification)
├── services/upv/         # Optional standalone PV/UV service (Cloudflare Workers + D1)
├── src/                  # Application source code (app, components, config, i18n, lib)
├── CODE_OF_CONDUCT.md    # Code of conduct (Contributor Covenant 2.1)
├── CONTRIBUTING.md       # Contribution guide (friend links, corrections, code, pre-submit checks)
├── SECURITY.md           # Security policy and vulnerability reporting
├── LICENSE               # MIT source license + scope note (posts/fonts/3rd-party excluded)
├── licenses/             # Verbatim third-party license texts (MIT/Apache-2.0/ISC/BSD/OFL-1.1/CC-BY-4.0)
└── .github/workflows/   # CI/CD automation (deploy, IndexNow, friend-link PR checks)
```

---

## ⚡ Quick Start

```bash
pnpm install            # Install dependencies
pnpm dev                # Start local development server (http://localhost:3000)
pnpm build              # Build static export (output to out/)
pnpm lint               # Run ESLint code quality checks
pnpm verify-content     # Run content pipeline integrity suite (78 checks)
pnpm new-post -- <slug> # Scaffold a new post directory
```

---

## ✍️ Writing Posts

Use `pnpm new-post -- <slug>` or create a directory directly under `content/posts/`. **The directory name serves as the URL slug**:

```markdown
---
title: Post Title
published: 2026-01-01
description: A short summary for listings, search, and SEO.
image: ./cover.png       # Optional: relative path to a co-located image
tags: [Next.js, Web]    # Optional: tags for filtering
draft: false            # Set to true to exclude from builds
pinned: false           # Set to true to pin on the homepage
---

Markdown content goes here...
```

> **Co-located Assets**: Store images alongside the post markdown file (e.g. `./cover.png`). The build pipeline syncs them into the public assets directory and compresses each one into a 768px WebP card thumbnail (`<name>.thumb.webp`, ~95% smaller) with `sharp` — the CI workflow runs that as its own step. Set `cardThumbnail: false` in `src/config/site.ts` when your build cannot run the thumbnail step, and cards load the original covers instead.

---

## ⚙️ Site Configuration

Centralized settings live in [`src/config/site.ts`](./src/config/site.ts) — manage site metadata, feature toggles, and service integrations in one place:

- **Identity & Presentation**: Site title, author profile, social links, ICP filings, friend application info, and tech stack badges.
- **Interactive Comments (`comment`)**: Waline comment system with server URL binding and global toggle.
- **SEO & Webmaster (`seo`)**: Google Analytics 4 (GA4), Google Search Console, Bing Webmaster verification, and IndexNow instant submission.
- **Privacy Analytics (`upv`)**: Standalone Cloudflare Workers + D1 PV/UV counter service integration.
- **Image Optimization (`cardThumbnail`)**: Listing cards read build-time `sharp` WebP thumbnails instead of full-size covers — disable it when the build environment cannot run the thumbnail step.

---

## 🌐 Deployment & CI/CD

### 1. Static Blog Deployment (Cloudflare Workers)

Automated builds and deployments are handled by `.github/workflows/deploy.yml`:
- Set repository secrets in GitHub: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Pushing to the `main` branch automatically triggers static build and deploys via `wrangler deploy` (Workers Static Assets via `wrangler.jsonc`).

### 2. (Optional) UPV Analytics Service & D1 Migrations

The counter service lives in `services/upv/`:
```bash
cd services/upv && cp .dev.vars.example .dev.vars
npm run db:schema                  # Initialize D1 schema
npx wrangler secret put SALT       # Set visitor hashing salt secret
npm run deploy                     # Deploy Worker
```
Once deployed, configure `upv.api` in `src/config/site.ts` to connect the frontend.

**D1 Versioned Migrations (Wrangler Migrations)**:
```bash
npm run db:migrate:create -- <name> # Create migration file (migrations/0001_<name>.sql)
npm run db:migrate:local            # Test in local sandbox
npm run db:migrate:remote           # Apply to remote production D1
npm run db:migrate:list             # List migration status
```

---

## 🤝 Friend Links

Create `content/friends/<your-site>.json` and submit a Pull Request. GitHub Actions will automatically validate URL accessibility and bidirectional backlinks:
```json
{
  "name": "Site Name",
  "url": "https://example.com",
  "description": "Short description",
  "avatar": "https://example.com/avatar.png",
  "backlink": "https://example.com/friends/"
}
```

Other ways to contribute (article corrections, code and UI improvements) and the checks a change must pass are in **[CONTRIBUTING.md](./CONTRIBUTING.md)**; security reports go through **[SECURITY.md](./SECURITY.md)**.

---

## 📄 License & Acknowledgments

- Source code is released under the **[MIT License](./LICENSE)**; **its exact scope is defined by the "Scope of this license" note at the end of [`LICENSE`](./LICENSE)** — articles, web fonts and third-party components are not covered by it.
- Original blog posts and media are licensed under **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)**.
- Referenced and credited (UI design reference; no source file was copied): [cworld1/astro-theme-pure](https://github.com/cworld1/astro-theme-pure) (Apache-2.0), [Dancncn/DansBlog](https://github.com/Dancncn/DansBlog) (MIT), [antfu/antfu.me](https://github.com/antfu/antfu.me) (MIT).

### Third-party components

An obligation exists only for what is **actually distributed**, so only that is declared here:

- **Third-party code distributed with the site** (bundled into `out/`): the notice is generated at build time by [`scripts/generate-third-party-licenses.ts`](./scripts/generate-third-party-licenses.ts) into `public/third-party-licenses.txt`, served as [`/third-party-licenses.txt`](/third-party-licenses.txt). It carries **each package's upstream copyright line** (MIT / ISC / BSD require "the above copyright notice and this permission notice shall be included in all copies") plus every verbatim license text. Because it is generated, it cannot go stale when dependencies are upgraded.
- **Verbatim license texts** (unmodified): [`licenses/`](./licenses/).
- **Build-time-only components** (`devDependencies`, platform binaries such as `sharp`/libvips, build-time data such as `caniuse-lite`) are never distributed and trigger no obligation, so they are not declared here. For the full list run `pnpm licenses list --prod --no-optional`.

### Web fonts (OFL-1.1, distributed with the site)

Fonts are the only third-party works this site distributes **as binaries**, and clause 2 of the OFL-1.1 requires that "each copy contains the above copyright notice and this license" — so they must be credited:

| Font | Role | Copyright line |
| --- | --- | --- |
| [Inter](https://rsms.me/inter/) | Latin body/prose text | Copyright (c) 2016-2023 The Inter Project Authors |
| [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | Latin/digits in code blocks and UI chrome | Copyright (c) 2020 The JetBrains Mono Authors |
| [Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC) | all Chinese text (by Google + Adobe) | Copyright (c) 2014-2025 Adobe, Google, and the Noto Project Authors |
| [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) | brand-only display serif | Copyright (c) 2022 The Instrument Serif Project Authors |
| **KaTeX fonts** (20 faces × `ttf`/`woff`/`woff2` = 60 files) | math rendering, shipped with `katex/dist/katex.min.css` | Copyright (c) 2009-2010, Design Science, Inc. (www.mathjax.org); Copyright (c) 2014 Khan Academy — **with Reserved Font Name `KaTeX_Main`** and others |

The KaTeX fonts are published together with the `katex` npm package (whose `license` field says MIT), but the **font binaries** are licensed under OFL-1.1 according to the fonts' own metadata (upstream confirmation: [KaTeX/KaTeX#339](https://github.com/KaTeX/KaTeX/issues/339)). Upstream ships no separate font license file, so it is recorded explicitly here rather than being silently assumed to be MIT.
