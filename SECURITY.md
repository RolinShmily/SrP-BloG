# 安全政策

> English readers: report privately to rol1n@srprolin.top — do **not** open a public issue.

## 支持范围

只对 `main` 分支的最新提交提供安全修复。

## 报告漏洞

**请勿开公开 issue**：公开披露会让问题在修复前就暴露。

**首选：邮件 [rol1n@srprolin.top](mailto:rol1n@srprolin.top)**（主题写 `[SECURITY] 一句话简述`，正文说明影响范围与复现步骤）。

**备选：GitHub 私有漏洞报告** —— 直接访问 <https://github.com/RolinShmily/SrP-BloG/security/advisories/new>，或仓库页面 → **Security** → **Report a vulnerability**（该功能需在仓库设置中开启；若看不到入口即为未开启）。

若以上都不可用，可开一个**不含任何细节**的 issue 说明「有安全问题，需要私下渠道」，由维护者接手。

## 本项目包含什么

- 一个**纯静态站点**（`out/`）：无服务端运行时、无用户登录、无数据库。
- 一个**可选的独立统计服务** `services/upv/`（Cloudflare Workers + D1）：加盐哈希去重，不存明文 IP，独立部署。
- 密钥（D1 `SALT`、Cloudflare API Token）只存在于 Cloudflare 与 GitHub Secrets，**不在本仓库内**；`.env` 系列已被 `.gitignore` 覆盖，`.env.example` 只有占位符。

## 值得报告的情况

- 仓库中意外提交的凭据、私密数据或个人信息
- `services/upv` 的注入、越权访问或数据泄露
- **供应链问题**：依赖被投毒、`pnpm-lock.yaml` 被篡改、构建脚本注入（本仓库刻意使用 `pnpm install --ignore-scripts` 阻断依赖生命周期脚本）
- 前端 XSS：文章 Markdown 渲染、Waline 评论、搜索索引等注入面
- 发布产物 `out/` 中泄露了本不应公开的内容

## 响应

个人项目，尽力而为：确认收到后一般 **7 天内**回复，修复随下一次部署上线。目前没有漏洞赏金。
