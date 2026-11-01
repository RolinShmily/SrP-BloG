---
title: 使用AriaNg给Windows搭建aria2的web面板 | 高速下载器 | 种子下载
published: 2026-10-26
updated: 2026-10-27
pinned: false
description: Aria2是一个简单开源高效的多平台下载器，具有非常强大的下载功能，也能识别种子链接，而ariang是一个webui面板，方便管理下载列表；本文需要Windows拥有scoop、nodejs和npm环境，搭建起一个后台服务型aria2下载器，经由封装的rpc，打开下载面板即可进行下载。
image: ''
tags:
  - Aria2
  - WebUI
  - Scoop
  - PM2
draft: false
---

# 相关链接

- [PM2 - Advanced Production Process Manager for Node.js](https://pm2.keymetrics.io/)

- [Node.js® 是一个免费、开源、跨平台的 JavaScript 运行时环境，它让开发人员能够创建服务器、 Web 应用、命令行工具和脚本。](https://nodejs.org/zh-cn)

- [Scoop:A command-line installer for Windows](https://scoop.sh/)
- [aria2 - The ultra fast download utility](https://aria2.github.io/)
- [AriaNg：让 aria2 更容易使用的现代 Web 前端](https://ariang.mayswind.net/zh_Hans/)

# 安装必要环境

```pwsh
# 安装scoop
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# 安装nodejs
scoop bucket add main
scoop install main/nodejs

# 安装aria2
scoop install main/aria2

# 安装pm2
npm install -g pm2
```

# Fork仓库的action流程

前往我Fork的AriaNg仓库：[RolinShmily/AriaNg](https://github.com/RolinShmily/AriaNg)

我已经将pm2+aria2+webui封装在一起并通过GitHub Action进行构建发布，可以去到仓库的[releases](https://github.com/RolinShmily/AriaNg/releases)界面，获取构建好的zip包：[aria2-webui.zip](https://github.com/RolinShmily/AriaNg/releases/download/webui-build-3/aria2-webui.zip)

将它解压到**`%USERPROFILE%`** 用户目录，保留其目录结构，然后运行命令：

```pwsh
Set-Location "$env:USERPROFILE\aria2-webui"
pm2.cmd start .\ecosystem.config.cjs
```

随后访问`http://127.0.0.1:6880` 即可进入webui进行下载管理，aria2在后台运行。

# pm2命令

|              命令               |           说明           |
| :-----------------------------: | :----------------------: |
|       `pm2 start app.js`        | 启动一个常驻的js脚本服务 |
| `pm2 start ecosystem.config.js` |     通过配置文件启动     |
|           `pm2 list`            |       查看服务列表       |
|           `pm2 monit`           |     打开终端监控面板     |
|           `pm2 stop`            |         停止服务         |
|           `pm2 save`            |    记录当前的服务列表    |
|         `pm2 resurrect`         |    恢复记忆的进程列表    |
|           `pm2 logs`            |         查看日志         |
|           `pm2 init`            |     生成配置文件模板     |

