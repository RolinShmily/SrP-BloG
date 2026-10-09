## 说明 / Description

<!-- 一句话说明目的。一个 PR 只做一件事。 / Briefly explain the purpose. One PR should do one thing. -->

## 类型 / Type

- [ ] 内容 / Content (文章勘误 / 新增文章 / Post fixes / new posts)
- [ ] 友链 / Friend Link (新增 / 修改 `content/friends/**` / Add or update friend links)
- [ ] 代码与界面 / Code & UI
- [ ] 文档与构建 / Docs & CI

## 提交前检查 / Checklist

- [ ] 本地测试通过 / Passed `pnpm lint`
- [ ] 内容校验通过 / Passed `pnpm verify-content`
- [ ] 构建测试通过 / Passed `pnpm build` (改动构建链、配置或依赖时 / when touching build, config, or deps)
- [ ] 外部依赖已确认 / External dependencies confirmed via issue (if adding new deps)

详见 / See [CONTRIBUTING.md](../CONTRIBUTING.md).
