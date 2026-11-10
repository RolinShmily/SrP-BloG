# SrP-BloG 文档

本目录面向维护者与贡献者。访客向的项目介绍、截图与快速上手在根目录 [README](../README.md)；本目录只记录**稳定的约定、边界与操作方式**，不重复营销文案。

## 文档地图

| 目录 | 关注点 | 入口 |
| --- | --- | --- |
| `architecture/` | 系统边界、渲染模型、构建管线、数据流、部署拓扑 | [架构规范](architecture/README.md) |
| `design/` | 视觉语言、设计令牌、字体、布局、组件、动效、可访问性 | [设计规范](design/README.md) |
| `development/` | 环境搭建、编码约定、内容流程、验证与 CI | [开发规范](development/README.md) |
| `reference/` | 命令、环境变量、配置字段、内容 schema 速查 | [参考规范](reference/README.md) |
| `screenshot/` | README 与设计文档使用的界面截图 | [截图目录](screenshot/) |

## 建议阅读顺序

- **第一次参与开发**：`development/` → `architecture/` → `reference/`。
- **修改界面或交互**：`design/` → `architecture/` 的「客户端运行时」与「渲染模型」。
- **新增构建步骤、内容类型或部署配置**：`architecture/` → `reference/`。
- **只想查字段或命令**：直接看 `reference/`。

## 维护规则

- **代码是事实来源**。文档描述设计意图与不变量；字段的完整定义以 `src/config/site.ts`、`src/lib/content/types.ts`、`src/router/routes.ts` 等源文件为准。
- **行为变更与文档变更放在同一个 PR**。新增配置项、路由、构建步骤或视觉令牌时，同步更新对应规范。
- **文档使用中文**；命令、路径、代码标识符、外部规范名称保持原文。
- **截图使用 WebP**，命名 `<页面>-<状态>.webp`（如 `home-dark.webp`）。替换截图时保留文件名，避免 README 与设计文档的链接失效；截图内容应与当前视觉基线一致。
- **不复制实现细节**。长代码、完整类型定义和脚本实现应链接到源文件，避免文档与代码双重维护。

## 相关文档

- [README](../README.md) / [README_zh](../README_zh.md) — 项目介绍、特性、快速上手。
- [CONTRIBUTING](../CONTRIBUTING.md) — 贡献方式、验收标准、许可约定。
- [Notice](../Notice.md) — 授权范围（文章、字体、第三方组件不在 MIT 内）。
- [SECURITY](../SECURITY.md) — 漏洞报告渠道。
- [CODE_OF_CONDUCT](../CODE_OF_CONDUCT.md) — 行为准则。
