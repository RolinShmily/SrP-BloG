---
title: Antigravity Proxy 解决系统代理的不可达性
published: 2026-06-26
pinned: false
description: 简要介绍一下一个开源项目，用于解决antigravity应用的系统代理问题。
tags:
  - Antigravity
  - Gemini
  - Proxy
draft: false
lang: ""
---
# 相关链接
- [antigravity-proxy项目地址](https://github.com/yuaotian/antigravity-proxy)
- [antigravity-谷歌应用官网](https://antigravity.google/)

# 使用方法
目前Antigravity生态正在逐渐替换Gemini，因此这是新生态下的产品形态：
- [Gemini CLI(逐渐淘汰)](https://geminicli.com/)
- [Antigravity CLI](https://antigravity.google/product/antigravity-cli)
- [Antigravity 2.0](https://antigravity.google/product/antigravity-2)
- [Antigravity IDE](https://antigravity.google/product/antigravity-ide)
- [Antigravity SDK](https://antigravity.google/product/antigravity-sdk)

使用该项目，需要先下载编译好的DLL固件和配置文件：https://github.com/yuaotian/antigravity-proxy/releases

## Antigravity CLI

在Windows场景中，按`win+r`打开运行窗，输入`%LOCALAPPDATA%\agy\bin`，这时把`config.yaml`配置和两个固件`dbghelp.dll`与`version.dll`解压到该目录即可。

## Antigravity 2.0

依旧按`win+r`打开运行窗，输入`%LOCALAPPDATA%\Programs\Antigravity`，把`config.yaml`配置和固件`version.dll`解压到该目录即可。

# 注意
- 该项目的工作是把系统代理功能赋给了Antigravity产品，本质上你还是需要一定的魔法来访问Antigravity。
- 如果你打不通，这可能是因为`config.yaml`默认的socks5/http代理端口，和你本地的代理端口对不上，需要手动修改。

