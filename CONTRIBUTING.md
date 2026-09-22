# 贡献指南

感谢你有兴趣为 SrP-BloG 做出贡献。本文件约定贡献方式与验收标准。

> 参与本项目即表示你同意遵守 **[行为准则](./CODE_OF_CONDUCT.md)**（Contributor Covenant 2.1）：友善待人，尊重不同观点，不对他人进行人身攻击。

## 可以贡献什么

| 类型 | 方式 |
| --- | --- |
| **友链申请** | 用 [友链申请 issue 模板](https://github.com/RolinShmily/SrP-BloG/issues/new?template=friend_link.yml) 提交，或直接提 PR 新增 `content/friends/<站点名>.json` |
| **文章勘误** | 错别字、失效链接、过时命令 → 直接提 PR 修改 `content/posts/<slug>/index.md` |
| **代码 / 界面改进** | 先开 issue 讨论方向，再动手 |
| **文档 / 构建 / CI** | 直接提 PR |

## 动手之前

- **大改动先讨论**：新功能、设计调整、依赖替换请先开 issue，避免方向不符白做。
- **一个 PR 只做一件事**，不要把无关改动混在一起。

## 本地开发

需要 Node 22+ 与 pnpm 11。

```bash
pnpm install --ignore-scripts   # 一律不执行依赖生命周期脚本（供应链卫生）
pnpm dev                        # http://localhost:3000
```

`pnpm dev` 会自动完成文章资源同步、搜索索引生成与第三方许可声明生成，无需手动执行。

## 提交前必须通过

```bash
pnpm lint            # ESLint (next/core-web-vitals)
pnpm verify-content  # 内容管线完整性校验（78 项）
pnpm build           # 静态导出；改动构建链、配置或依赖时必跑
```

CI 执行同样这几步，本地过了基本就能过。

## 内容规范

- **文章目录名即 slug**，形如 `content/posts/52-waline-docker-1/`，正文文件固定为 `index.md`。
- **图片与文章同目录就近存放**（如 `./cover.png`），构建期自动同步并压缩为 768px WebP 卡片缩略图。
- frontmatter 字段见 README 的「写作说明」一节。
- **友链数据一个文件一个对象**：`content/friends/<站点名>.json` 是单个 JSON 对象，**不是数组**。
- 新增文章可用 `pnpm new-post -- <slug>` 生成模板。

## 提交信息

使用 [Conventional Commits](https://www.conventionalcommits.org/)：`feat:` / `fix:` / `content:` / `ci:` / `docs:` / `chore:` 等，让历史可读、可自动分类。

## 许可

本项目**分发的许可声明是构建期生成的**（见 README 的「第三方组件」一节），因此：

- 你提交的**代码**以 [MIT](./LICENSE) 许可并入本项目。
- 你提交的**文章与原创配图**以 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可并入本项目。
- 提交即表示你有权以上述许可提供这些内容。**请勿提交你无权再许可的第三方素材**（他人截图、图片、字体、大段引文）。
- **新增依赖前请先开 issue**：依赖会进入分发的许可声明与 `licenses/`，需要一并确认其许可族与版权行；若出现 `licenses/` 未收录的许可族，构建会直接失败。
