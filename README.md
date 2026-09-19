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
├── public/               # Static assets & build outputs (favicon, og, synced covers, etc.)
├── scripts/              # Utility scripts (asset sync, search index, content verification, etc.)
├── services/upv/         # Optional standalone PV/UV service (Cloudflare Workers + D1)
├── src/                  # Application source code (app, components, config, i18n, lib)
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

> **Co-located Assets**: Store images alongside the post markdown file (e.g. `./cover.png`). The build pipeline automatically syncs them to the public assets directory.

---

## ⚙️ Site Configuration

Centralized settings live in [`src/config/site.ts`](./src/config/site.ts) — manage site metadata, feature toggles, and service integrations in one place:

- **Identity & Presentation**: Site title, author profile, social links, ICP filings, friend application info, and tech stack badges.
- **Interactive Comments (`comment`)**: Waline comment system with server URL binding and global toggle.
- **SEO & Webmaster (`seo`)**: Google Analytics 4 (GA4), Google Search Console, Bing Webmaster verification, and IndexNow instant submission.
- **Privacy Analytics (`upv`)**: Standalone Cloudflare Workers + D1 PV/UV counter service integration.

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

---

## 📄 License & Acknowledgments

- Source code is released under the **[MIT License](./LICENSE)**.
- Original blog posts and media are licensed under **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)**.
- Referenced and credited open-source projects:
  - [cworld1/astro-theme-pure](https://github.com/cworld1/astro-theme-pure) (Apache-2.0)
  - [Dancncn/DansBlog](https://github.com/Dancncn/DansBlog) (MIT)
  - [antfu/antfu.me](https://github.com/antfu/antfu.me) (MIT)
  - [subframe7536/maple-font](https://github.com/subframe7536/maple-font) (OFL-1.1) — Maple Mono NF CN

<details>
<summary>Click to view referenced open-source licenses</summary>

### 1. astro-theme-pure (Apache License 2.0)

```text
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

     5. Submission of Contributions. Unless You explicitly state otherwise,
        any Contribution intentionally submitted for inclusion in the Work
        by You to the Licensor shall be under the terms and conditions of
        this License, without any additional terms or conditions.
        Notwithstanding the above, nothing herein shall supersede or modify
        the terms of any separate license agreement you may have executed
        with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
        names, trademarks, service marks, or product names of the Licensor,
        except as required for reasonable and customary use in describing the
        origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS
```

### 2. DansBlog (MIT License)

```text
MIT License

Copyright (c) 2026 Dan Arnuox

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

### 3. antfu.me (MIT License)

```text
MIT License

Copyright (c) 2020-2021 Anthony Fu

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

### 4. Maple Mono NF CN (SIL Open Font License 1.1)

```text
Copyright 2022 The Maple Mono Project Authors (https://github.com/subframe7536/maple-font)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://openfontlicense.org

-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

</details>
