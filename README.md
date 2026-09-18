<h1 align="center">SrP-BloG</h1>

<p align="center">
  <b>A modern personal tech blog built with Next.js 15 and exported as a fully static site</b>
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

## 🌟 Features

- **Pure Static Export**: Built on Next.js 15 App Router (`output: 'export'`), pre-rendered into static HTML for maximum speed and zero server runtime, natively tailored for Cloudflare Pages.
- **Single-Source Markdown**: `content/posts/<slug>/index.md` — one directory per post with co-located media assets for effortless portability.
- **Modern Aesthetics**: Editorial shadcn/ui Zinc style, cursor-tracking spotlight card glow, procedural winter plum canvas art (`ArtPlum`), smooth page transitions, and adaptive dark mode.
- **Lightweight Bilingual UI**: Instant Chinese/English UI switching on the client side without route duplication or extra builds.
- **Privacy-Focused Analytics (UPV)**: Optional standalone Cloudflare Workers + D1 counting service with salted daily hashing and zero IP storage; degrades silently to zero when unconfigured.
- **Batteries Included**: Client-side full-text search, multi-tag filtering, RSS 2.0, Sitemap, automated IndexNow submission, and automated friend-link validation workflows.

---

## 📁 Directory Structure

```
├── content/              # Content source: posts/, friends/, sponsors/
├── public/               # Static assets & build outputs (favicon, og, synced covers, etc.)
├── scripts/              # Utility scripts (asset sync, search index, content verification, etc.)
├── services/upv/         # Optional standalone PV/UV service (Cloudflare Workers + D1)
├── src/                  # Application source code (app, components, config, i18n, lib)
└── .github/workflows/   # CI/CD automation (deploy, IndexNow, friend-link PR checks)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 22
- **pnpm** ≥ 9

### Development

```bash
pnpm install            # Install dependencies
pnpm dev                # Start local development server (http://localhost:3000)
pnpm build              # Build static export (output to out/)
```

### Useful Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Synchronize assets, generate search index, and start dev server |
| `pnpm build` | Pre-render all pages and emit static files into `out/` |
| `pnpm lint` | Run ESLint checks |
| `pnpm verify-content` | Validate post frontmatter, assets, and friend link data |
| `pnpm new-post -- <slug>` | Scaffold a new post directory |

---

## ✍️ Writing Posts

Use `pnpm new-post -- <slug>` or create a new directory directly under `content/posts/`. **The directory name serves as the URL slug**.

**Post Example** (`content/posts/<slug>/index.md`):

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

> **Co-located Assets**: Place images alongside the post markdown file (e.g. `./cover.png`). The build pipeline automatically syncs them to the public assets directory.

---

## ⚙️ Site Configuration

Centralized settings live in [`src/config/site.ts`](./src/config/site.ts) — manage site title, author identity, social links, ICP filings, friend application info, and UPV counter toggles all in one place.

---

## 🚢 Deployment & CI/CD

### 1. Cloudflare Pages Deployment
Automated builds and deployments are handled by `.github/workflows/deploy.yml`:
- Set repository secrets in GitHub: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Pushing to the `main` branch automatically triggers static build and deployment.
- *Note: If migrating from a legacy Cloudflare Worker, unbind or delete the Worker routes before attaching your custom domain to the Pages project.*

### 2. (Optional) UPV Analytics Service
The counter service lives in `services/upv/`, running on Cloudflare Workers + D1:
```bash
cd services/upv
cp .dev.vars.example .dev.vars
npm run db:schema                  # Initialize D1 schema
npm run db:migrate-slugs           # (Optional) Migrate legacy Astro statistics
npx wrangler secret put SALT       # Set visitor hashing salt secret
npm run deploy                     # Deploy Worker
```
Once deployed, configure `upv.api` in `src/config/site.ts` to connect the frontend.

---

## 🤝 Friend Links

Friend links are managed individually via JSON files. PRs are welcome:
1. Fork this repository.
2. Create `content/friends/<your-site>.json`:
   ```json
   {
     "name": "Site Name",
     "url": "https://example.com",
     "description": "Short description",
     "avatar": "https://example.com/avatar.png",
     "backlink": "https://example.com/friends/"
   }
   ```
3. Submit a Pull Request. GitHub Actions will automatically test URL accessibility and bidirectional backlinks.

---

## 📄 License & Acknowledgments

- Source code is released under the **[MIT License](./LICENSE)**.
- Original blog posts and media are licensed under **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)**.
- Originally inspired by the [Fuwari](https://github.com/saicaca/fuwari) theme; sincere thanks to [saicaca](https://github.com/saicaca) for the open-source contribution.
