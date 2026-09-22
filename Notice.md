# Scope of this license / 授权范围说明

The MIT License text in [`LICENSE`](./LICENSE) applies to the source code of
this repository that is authored by the copyright holder named there —
including `src/`, `scripts/`, `services/upv/`, the build and deployment
configuration, and the documentation in this repository.

上述 [MIT 许可证](./LICENSE) 仅适用于本仓库中由其中所列版权人编写的**源代码**
（含 `src/`、`scripts/`、`services/upv/`、构建与部署配置，以及本仓库的文档）。

The following works are distributed alongside that source code but are **not**
licensed under the MIT License, and the MIT License grants no rights in them:

以下作品与上述源代码一同分发，但**不在 MIT 许可范围内**，MIT 许可证不授予其任何权利：

1. Articles and content / 文章与内容
   Posts under `content/posts/**`, friend-link data under `content/friends/**`,
   sponsorship data under `content/sponsors/**`, and the original images and
   screenshots distributed under `public/posts/**`, `public/sponsors/**`,
   `public/og/**` and `public/favicon/**` are licensed under CC BY-NC-SA 4.0:
   https://creativecommons.org/licenses/by-nc-sa/4.0/
   Third-party software screenshots and trademarks quoted inside a post remain
   the property of their respective owners and are used for explanatory
   purposes only.

2. Web fonts / Web 字体
   The self-hosted font files under `out/_next/static/media/` — Inter,
   JetBrains Mono, Noto Sans SC, Instrument Serif and the KaTeX fonts — are
   licensed under the SIL Open Font License 1.1 (see `licenses/OFL-1.1.txt`).
   The MIT License does not apply to these font binaries.

3. Third-party software / 第三方软件
   Every third-party component distributed with this project is licensed by its
   own copyright holder. The notice that ships with the site — one entry per
   package with its upstream copyright line, followed by the verbatim license
   texts — is generated at build time into `public/third-party-licenses.txt`
   (served as `/third-party-licenses.txt`); the verbatim texts are kept in
   `licenses/`. Where a third-party work is included in this repository or in
   the built site, that work's own license governs it and prevails over the MIT
   License.

4. Names and marks / 名称与标识
   The site name, domain name, avatar and brand marks identifying this site
   are not licensed under the MIT License, and no trademark license is granted
   by it.

If you redistribute this project, keep `LICENSE`, this notice, the `licenses/`
directory and the generated `third-party-licenses.txt` together with the copy.
