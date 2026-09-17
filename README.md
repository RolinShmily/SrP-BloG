<h1 align="center">SrP-BloG</h1>

<p align="center">
  <b>A personal tech blog built with Next.js 15 and exported as a fully static site</b>
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

## Overview

**SrP-BloG** is a personal technical blog that ships as a **pure static export**
(`next build` with `output: 'export'`), deployed to Cloudflare Pages. Markdown
files are the single source of truth: posts are read from disk at build time,
pre-rendered to HTML and emitted into `out/`.

It started life as an [Astro](https://astro.build/) site based on the
[Fuwari](https://github.com/saicaca/fuwari) theme and was later rewritten on top
of the Next.js App Router; the upstream attribution is kept below.

### Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js 15](https://nextjs.org/) App Router (`output: 'export'`, `trailingSlash: true`) |
| UI runtime | [React 19](https://react.dev/) + TypeScript 5 |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) + [`@tailwindcss/typography`](https://github.com/tailwindlabs/tailwindcss-typography) |
| Components | [shadcn/ui](https://ui.shadcn.com/) (Radix primitives + `cva` + `tailwind-merge`) |
| Content | Markdown via `unified`/`remark`/`rehype`, `gray-matter` frontmatter |
| Code blocks | [`rehype-pretty-code`](https://rehype-pretty.pages.dev/) + [Shiki](https://shiki.style/) |
| Math | [`remark-math`](https://github.com/remarkjs/remark-math) + [`rehype-katex`](https://github.com/remarkjs/rehype-katex) + KaTeX |
| Theming | [`next-themes`](https://github.com/pacocoursey/next-themes) |
| i18n | Hand-rolled dictionaries in `src/i18n/` (client switch, no route prefixes) |
| Linting | ESLint (`eslint-config-next`) |
| Statistics | Optional self-hosted `services/upv/` (Node + SQLite **or** Cloudflare Workers + D1) |
| Hosting | Cloudflare Pages (`out/`) |

---

## Directory structure

```
.
├── content/
│   ├── posts/
│   │   └── <slug>/                 # one directory per post; the directory name is the URL slug
│   │       ├── index.zh.md         # Chinese source (required)
│   │       ├── index.en.md         # optional English translation
│   │       └── cover.png           # optional co-located assets (copied to public/posts/<slug>/)
│   ├── friends/                    # friend links: one JSON file per site (<site>.json)
│   │   └── <site>.json             # single object: name / url / description / avatar [ / backlink ]
│   ├── _orphan-images/             # parked: assets no post references (safe to delete)
│   └── sponsors/                   # sponsors: one JSON file per person (<name>.json)
│       └── <name>.json             # single object: name / amount / date [ / platform ] [ / avatar ]
├── public/
│   ├── posts/                      # generated: co-located post assets (git-ignored)
│   ├── search-index.json           # generated: client-side search index (git-ignored)
│   ├── favicon/                    # favicon.ico + the filing badge images
│   ├── sponsors/                   # Alipay / WeChat Pay QR codes for the sponsorship section
│   └── ...                         # search-engine verification files
├── scripts/
│   ├── sync-post-assets.ts         # content/posts/** -> public/posts/**
│   ├── generate-search-index.ts    # -> public/search-index.json
│   ├── verify-content.ts           # content/frontmatter validation (CI gate)
│   ├── new-post.js                 # `pnpm new-post -- <slug>` scaffolder
│   └── indexnow-submit.js          # IndexNow submission from out/sitemap.xml
├── src/
│   ├── app/                        # App Router routes (see "Routes")
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives
│   │   ├── layout/                 # navbar, footer
│   │   ├── blog/                   # posts list, article view, TOC, tags, friends, PV/UV counters
│   │   ├── icons/                  # brand marks lucide lacks (Cloudflare/Folo/开往) + Alipay/WeChat Pay
│   │   ├── i18n/                   # <T> bilingual-DOM component, locale toggle
│   │   └── theme/                  # theme provider + toggle
│   ├── config/site.ts              # site metadata, nav, socials, CDN providers, license, filings
│   ├── i18n/                       # zh.ts / en.ts dictionaries, LocaleProvider, formatting
│   └── lib/
│       ├── content/                # content provider (fs scanner, markdown renderer, types)
│       ├── friends.ts              # friend-link provider (content/friends/)
│       ├── sponsors.ts             # sponsor provider (content/sponsors/)
│       └── upv/                    # UPV HTTP client + null adapter
├── services/
│   └── upv/                        # standalone PV/UV service (own package.json, zero deps)
├── .github/workflows/              # deploy.yml, indexnow.yml, friend-link.yml, auto-pr.yml
├── .env.example                    # NEXT_PUBLIC_UPV_API
└── next.config.mjs / tailwind.config.ts / tsconfig.json
```

---

## Getting started

Requirements: **Node.js ≥ 22** and **pnpm**.

```bash
pnpm install            # CI uses: pnpm install --frozen-lockfile --ignore-scripts
pnpm dev                # http://localhost:3000
```

### Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | `sync-assets` → `generate-search-index` → `next dev` |
| `pnpm build` | `sync-assets` → `generate-search-index` → `next build` → static export in `out/` |
| `pnpm lint` | ESLint via `next lint` |
| `pnpm verify-content` | Validates every post directory, frontmatter and friend link |
| `pnpm sync-assets` | Copies co-located post assets into `public/posts/` |
| `pnpm generate-search-index` | Regenerates `public/search-index.json` |
| `pnpm new-post -- <slug>` | Scaffolds `content/posts/<slug>/index.zh.md` (draft) |

`pnpm start` is intentionally a no-op for the site itself: `output: 'export'`
has no server runtime, so `out/` is served by a static host.

---

## Writing a post

### 1. Create the directory

```bash
pnpm new-post -- my-first-post
# or manually:
mkdir -p content/posts/my-first-post
```

The **directory name is the URL slug** (`/posts/my-first-post/`). Non-ASCII
slugs (Chinese, spaces, …) are supported and percent-encoded in URLs.

### 2. Frontmatter

`content/posts/<slug>/index.zh.md`:

```markdown
---
title: My First Post
published: 2026-01-01
updated: 2026-01-05        # optional
description: A short summary shown in lists and meta tags.
image: ./cover.png                  # optional; path is relative to the post directory
tags: [Next.js, TypeScript]
category: Web
lang: zh                   # optional informational tag; the file name decides the locale
draft: true                # drafts are excluded from the build
pinned: false              # true pins the post to the top of the home page
---
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Post title. |
| `published` | yes | `YYYY-MM-DD`; used for sorting and the archives timeline. |
| `updated` | no | Last-updated date. |
| `draft` | no | `true` keeps the post out of the published output. |
| `description` | no | Used for list excerpts, search results and `<meta>`. |
| `image` | no | Cover image (see “Images”). |
| `tags` | no | Array of tag names; drives `/tags`. |
| `category` | no | Single category badge. |
| `lang` | no | Informational content language tag. |
| `pinned` | no | Pinned posts are listed first. |

`pnpm verify-content` checks these rules and is wired into CI.

### 3. English (machine) translation

Add `index.en.md` next to `index.zh.md` with the same frontmatter. The article
page then shows a **translation toggle** (Chinese ⇄ English) in the meta bar;
both versions are pre-rendered into the same HTML file, so switching is instant
and needs no extra request. Posts without `index.en.md` simply show no toggle.
Chinese remains the default reading language.

### Images

Every image is **co-located** with the post that uses it: it sits in
`content/posts/<slug>/` next to the Markdown file and is referenced as
`./cover.png`. `pnpm sync-assets` (part of `dev`/`build`) copies it to
`public/posts/<slug>/`, so the exported URL is `/posts/<slug>/cover.png`.

There is no shared image directory. An image used by two posts is simply stored
once in each of them — a few hundred KB of duplication buys posts that can be
moved, renamed or deleted independently.

`public/posts/` is a generated mirror of `content/posts/`; the sync step also
**prunes** destination directories whose source post is gone, so renaming a post
never leaves an orphaned directory in the export.

Images referenced by an absolute `https://` URL (an external CDN, for example)
are passed through untouched.

---

## Routes

| Route | Description |
| --- | --- |
| `/` | Posts (pinned first, then newest) |
| `/posts/[slug]` | Article detail + TOC + translation toggle + per-post UV |
| `/tags` | All tags with client-side filtering (`?tag=`) |
| `/friends` | Friend links from `content/friends/` + sponsorship section (`#sponsors`) |
| `/archives` | Stats card, full-text search, year timeline, site UV |
| `/rss.xml` | RSS 2.0 feed of published posts |
| `/sitemap.xml` | Sitemap (also the URL source for IndexNow) |
| `/robots.txt` | Crawler rules + sitemap reference |

`trailingSlash: true` means every page is emitted as `out/<route>/index.html`.

---

## UI language vs. post language

These are two independent features:

* **UI texts** — dictionaries in `src/i18n/zh.ts` / `src/i18n/en.ts` (key parity
  enforced at compile time) with a client-side toggle in the navbar. Because the
  export is pre-rendered, server components render **both languages into the DOM**
  through the `<T zh en>` component and CSS hides the inactive one
  (`html[data-locale]`); client components use `useLocale()`. The choice is
  persisted in `localStorage["srp-locale"]` (and can be forced with `?lang=en`).
  One build serves both languages — no `/en/` route duplication.
* **Post content** — driven by files: `index.zh.md` (default) plus optional
  `index.en.md`, switched per article as described above.

---

## Deployment — Cloudflare Pages

The build output is a plain static folder (`out/`), so any static host works.
For Cloudflare Pages:

**Option A — Git integration (dashboard)**

1. Pages → *Create project* → connect this repository.
2. Framework preset `Next.js (Static HTML Export)`, build command
   `pnpm build`, output directory `out`.
3. Optional environment variable `NEXT_PUBLIC_UPV_API` (see below), then deploy.

**Option B — GitHub Actions (`wrangler` direct upload)**

`.github/workflows/deploy.yml` runs on every push to `main` (and manually via
`workflow_dispatch`): checkout → pnpm 11 → Node 22 → `pnpm install
--frozen-lockfile --ignore-scripts` → `pnpm lint` → `pnpm verify-content` →
`pnpm build` → `wrangler pages deploy out --project-name=srp-blog --branch=main`.

Required repository secrets:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | API token with the *Cloudflare Pages: Edit* permission |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account id |

`--ignore-scripts` blocks dependency lifecycle scripts; the toolchain
(`next`, `esbuild`/`tsx`) ships prebuilt platform binaries as
`optionalDependencies`, so no `postinstall` is needed.

Two more workflows support the site:

* `indexnow.yml` — rebuilds, reads every `<loc>` from `out/sitemap.xml`, submits
  new URLs to IndexNow and commits the updated `.last-urls.json`.
* `friend-link.yml` / `auto-pr.yml` — friend-link issue guidance and PR
  validation (label, schema, URL reachability, bidirectional link check). Merging
  is always manual.

---

## UV / PV statistics service (optional)

Statistics live in the standalone [`services/upv/`](./services/upv/README.md)
package: one shared core, zero runtime dependencies, two deploy targets
(Node ≥ 22.5 + SQLite, or Cloudflare Workers + D1).

Enable it by pointing the front end at the service:

```bash
# .env.local
NEXT_PUBLIC_UPV_API=https://upv.example.com
```

**VPS / Docker**

```bash
cd services/upv
export UPV_SALT="$(openssl rand -hex 32)"
export UPV_ALLOWED_ORIGINS="https://blog.example.com"
docker compose up -d --build   # counters persist in the `upv-data` volume
curl -s http://127.0.0.1:8787/api/health
```

**Cloudflare Workers + D1**

```bash
cd services/upv
npx wrangler d1 create srp-blog-upv        # paste database_id into wrangler.toml
npx wrangler d1 execute srp-blog-upv --file=./schema.sql --remote
npx wrangler secret put SALT
npx wrangler deploy
```

**Graceful degradation:** when `NEXT_PUBLIC_UPV_API` is unset — or the request
fails for any reason (offline, CORS, ad-blocker, timeout) — the client falls
back to a null adapter: counters render nothing and the pages stay fully
functional. No plaintext IP is ever stored (visitors are a salted daily hash).

---

## Friend links

Friend links live in [`content/friends/`](./content/friends): **one JSON file per
site**, and each file contains a single object (not an array). Create
`content/friends/<site>.json` and open a pull request:

```json
{
  "name": "Site name",
  "url": "https://example.com",
  "description": "One-line intro",
  "avatar": "https://example.com/avatar.png"
}
```

All four fields are required. Optional `backlink` (absolute URL of the page on
your site that links back here) enables the automated bidirectional-link check;
without it the bot comments with instructions.

### File naming convention

**The file name is the entry's stable identifier; the displayed name comes from
the `name` field.**

- When adding a friend link, using the site name as the file name is
  *recommended* (it must not contain the filesystem-forbidden characters
  `/ \ : * ? " < > |`), but it does **not** have to match the `name` field.
- Once merged, a file is **not meant to be renamed**: renaming breaks historical
  PRs, external references and diff traceability.
- Some files keep their original names from the upstream repository (e.g.
  `雨月空间.json` has `"name": "Mintimate's Blog"`). A mismatch with the `name`
  field is an **existing convention, not an oversight** — please do not "fix" it.
- The verification script only checks file count, field completeness, URL
  validity and global uniqueness of `url`/`name`; it does **not** assert that
  the file name matches `name`.

A workflow labels the
PR, validates the JSON object, checks URL reachability and (when possible) the
backlink, then **waits for a manual merge** — nothing is auto-merged.

---

## License & Attribution

This project is licensed and attributed under the following terms:

1. **Source Code & Custom Modifications**:
   - The codebase and custom modifications of this repository are licensed under the **[MIT License](./LICENSE)** (Copyright &copy; 2025-2026 RoL1n_SrP).
2. **Upstream Template Attribution**:
   - Origin from [Fuwari](https://github.com/saicaca/fuwari) (Astro, copyright &copy; 2024 [saicaca](https://github.com/saicaca), MIT License); the site was later rewritten with Next.js while keeping this attribution.
3. **Blog Content**:
   - All written articles and media content are licensed under **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)** unless otherwise specified.

<details>
<summary><b>Click to view Fuwari's original MIT License</b></summary>

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
