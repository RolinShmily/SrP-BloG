---
title: SrP-IMG | 零成本随机图片API与现代化画廊
published: 2026-03-11
pinned: false
description: 基于Cloudflare Pages/Workers部署的无限流量、零成本、多分类随机图片解决方案。
image: ../assets/images/2026-03-11-22-42.png
tags:
  - Cloudflare
  - API
draft: false
lang: ""
---
# 相关链接

- [SrP-IMG 项目地址](https://github.com/RolinShmily/SrP-IMG)
- [在线演示地址](https://eo-img.srprolin.top)
- [Cloudflare Pages 官方文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers 官方文档](https://developers.cloudflare.com/workers/)

**SrP-IMG** 是一个基于 Cloudflare Pages/Workers 部署的现代化随机图片解决方案。它通过 Python 预构建技术，将静态存储转化为动态随机 API，并提供一个现代化的瀑布流画廊展示界面。

# 目录结构

```
├── oriImg/           # [核心] 原始素材目录
│   ├── h/            # 横屏图片素材（强转为 .jpg）
│   ├── v/            # 竖屏图片素材（强转为 .jpg）
│   └── gif/          # 自定义分类（自动保留 .gif 后缀）
├── public/           # 构建产物目录（存放生成的十六进制图片和元数据）
│   ├── h/、v/、gif/   # 映射后的图片集合
│   └── counts.json   # 自动生成的全站索引文件
├── functions/        # Cloudflare Pages Functions
│   └── pic.js        # 由脚本生成的服务端重定向接口
├── components/       # Next.js 组件
│   └── image-gallery.tsx # 核心画廊组件（映射表逻辑）
├── gen_img.py        # 构建大脑：处理图片命名、后缀识别及生成元数据
├── index.js          # Cloudflare Workers 入口
└── README.md
```

# 部署指南

## 1. 素材准备

在根目录 `oriImg/` 下创建分类文件夹。

- **API 专用**：创建 `h` 和 `v` 目录，放入横/竖屏图片（这些图片在输出时会固定为 `.jpg` 以兼容所有 API 客户端）
- **自定义分类**：创建如 `gif`、`anime` 等目录。脚本会自动取该目录第一张图片的后缀作为该分类的输出后缀

## 3. Cloudflare Pages/Workers 生产构建

在 Cloudflare Pages 仪表板配置如下：

- **框架预设**：`Next.js`
- **构建命令**：

```bash
python3 gen_img.py --hash-length 2 && npm run build
```

- **输出目录**：`out`
- **环境变量**：确保 Python 环境为 3.8+

如果使用 Cloudflare Workers，则需要配置根目录的 `wrangler.jsonc`：

```json
{
  "name": "srp-img-worker",
  "main": "index.js",
  "compatibility_date": "2026-01-05",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./out",
    "binding": "ASSETS"
  }
}
```

**注意**：请将 `name` 改为你要部署的Worker名称；将 `compatibility_date` 改为你的部署日期。

部署命令：`npx wrangler deploy`

## 使用方式

演示地址：`https://eo-img.srprolin.top` 仅支持A、B方式。

### 方式 A：服务端 API (JS 重定向)

由生成的 `functions/pic.js` / `index.js` 提供支持，适合在 Markdown 或其他网页中直接引用。

| 功能描述 | 调用地址 | 返回结果 |
| --- | --- | --- |
| **随机横图** | `/pic?img=h` | 302 重定向至 `/h/xxx.jpg` |
| **随机竖图** | `/pic?img=v` | 302 重定向至 `/v/xxx.jpg` |
| **UA 自动选择** | `/pic?img=ua` | 手机返回竖图，电脑返回横图 |

### 方式 B：前端可视化画廊

访问部署后的根域名（如 `https://your-domain.pages.dev`）：

- **自动适配**：顶部导航会自动切换 `h`、`v` 或 `gif` 模式
- **瀑布流展示**：基于 Next.js 的高性能瀑布流加载
- **沉浸式预览**：集成 Fancybox，支持放大、旋转、全屏及下载

### 方式 C：URL 重写 (无感随机)

_需在 Cloudflare 仪表板手动配置 **Transform Rules**：_

请将下列表达式与 `<your-domain>` 换成你的域名

**URL重写规则一：**

1. **匹配表达式**：

```
(http.host eq "<your-domain>" and starts_with(http.request.uri.path, "/h") and not ends_with(http.request.uri.path, ".jpg")) or (http.host eq "<your-domain>" and starts_with(http.request.uri.path, "/v") and not ends_with(http.request.uri.path, ".jpg"))
```

2. 路径**重写至**：

```
concat(http.request.uri.path, "/", substring(uuidv4(cf.random_seed), 0, 2), ".jpg")
```

**URL重写规则二：**

1. **匹配表达式**：

```
(http.host eq "<your-domain>" and starts_with(http.request.uri.path, "/gif") and not ends_with(http.request.uri.path, ".gif"))
```

2. 路径**重写至**：

```
concat(http.request.uri.path, "/", substring(uuidv4(cf.random_seed), 0, 2), ".gif")
```

**注意**：如果你的构建命令中 `--hash-length` 值为 `3`，那么这里 `cf.random_seed` 的随机范围右边边界也要从 `2` 改为 `3`。

URL访问示例：`https://your-domain.pages.dev/h`

# 关于 `gen_img.py`

脚本执行时会进行以下操作：

1. **哈希扩散**：通过 `--hash-length` 指定随机空间。若设为 `3`，每个分类会生成 $16^3$ 个访问路径
2. **后缀策略**：
   - 检查 `oriImg` 下每个子目录
   - 若目录名为 `h` 或 `v`，输出后缀强制遵循命令行参数（默认 `.jpg`）
   - 否则，自动探测该目录首张图片后缀
3. **元数据导出**：生成 `counts.json`，记录每个分类的图片总数 (`counts`) 和对应后缀 (`category_exts`)

