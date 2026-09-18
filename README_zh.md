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

### 1. Cloudflare Workers 部署
本项目通过 `.github/workflows/deploy.yml` 自动打包并部署至 Cloudflare Workers（基于 Workers 静态资源托管）：
- 在 GitHub 仓库设置中配置 Secrets：`CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID`。
- 推送代码至 `main` 分支即可自动触发构建并通过 `wrangler deploy`（读取 `wrangler.jsonc` 静态资产配置）发布至 Worker。

### 2. （可选）UPV 统计服务部署与 D1 迁移
统计服务位于 `services/upv/`，基于 Cloudflare Workers + D1：
```bash
cd services/upv
cp .dev.vars.example .dev.vars
npm run db:schema                  # 初始化应用 D1 数据库表结构
npx wrangler secret put SALT       # 配置加盐哈希密钥
npm run deploy                     # 部署 Worker
```
部署完成后，在 `src/config/site.ts` 中配置 `upv.api` 地址即可启用。

**D1 数据库版本化迁移（方案 1：Wrangler Migrations）**：
后续如需变更表结构（如新增字段或索引），使用 D1 官方版本化迁移工具链：
```bash
# 1. 创建带编号的迁移文件（位于 migrations/0001_<name>.sql）
npm run db:migrate:create -- <migration_name>

# 2. 本地测试与生产远端应用
npm run db:migrate:local           # 本地沙箱测试
npm run db:migrate:remote          # 生产远端应用
npm run db:migrate:list            # 查看迁移历史与待应用状态
```

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

### UI 灵感来源与鸣谢

本项目界面设计与交互动效深度汲取了以下开源项目的灵感，由衷鸣谢各位作者：

- **[astro-theme-pure](https://github.com/cworld1/astro-theme-pure)** by [@cworld1](https://github.com/cworld1)
  - 启发：文章底部版权卡片（Copyright Card）、赞助方案展示模块及精美排版样式。
  - 许可协议：Apache License 2.0
  <details>
  <summary>点击展开查看 astro-theme-pure 许可证全文 (Apache-2.0)</summary>

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
  </details>

- **[DansBlog](https://github.com/Dancncn/DansBlog)** by [@Dancncn](https://github.com/Dancncn)
  - 启发：卡片光标跟随微光（Card Spotlight Glow）交互特效与阻尼动效。
  - 许可协议：MIT License
  <details>
  <summary>点击展开查看 DansBlog 许可证全文 (MIT)</summary>

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
  </details>

- **[antfu.me](https://github.com/antfu/antfu.me)** by [@antfu](https://github.com/antfu)
  - 启发：腊梅树枝分支绘制算法（ArtPlum）、流体点阵（ArtDots）、黑曜石（#050505）暗色阶梯美学，以及基于 View Transition 的圆形展开昼夜主题切换。
  - 许可协议：MIT License
  <details>
  <summary>点击展开查看 antfu.me 许可证全文 (MIT)</summary>

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
  </details>
