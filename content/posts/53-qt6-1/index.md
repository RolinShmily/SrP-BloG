---
title: Qt6在Windows下的环境搭建
published: 2026-09-28
pinned: false
description: 以VScode为IDE，结合Qt-Extensions包与Qt-SDK，用scoop获取Cmake、Ninja，编译器使用MSVC-2022，并顺手下载Windows11-SDK，搭建起一种基于Cpp的Qt6开发环境，进一步使用KDE-Frameworks进行Qt库扩展，方便快速构建。
image: ''
tags: []
draft: true
---

# 相关链接

- [Qt6 Online installer](https://www.qt.io/zh-cn/development/download)
- [Visual Studio 2022 Build Tools](https://visualstudio.microsoft.com/zh-hans/vs/older-downloads/)
- [Scoop](https://scoop.sh/)
- [Ninja](https://ninja-build.org/)
- [Cmake](https://cmake.org/)
- [VScode](https://code.visualstudio.com/)
- [Qt Extensions](https://marketplace.visualstudio.com/items?itemName=TheQtCompany.qt)
- [KDE frameworks](https://develop.kde.org/products/frameworks)

# Qt Online Installer

- [qt-online-installer-windows-x64-4.11.0.exe](https://qt.mirror.constant.com/archive/online_installers/4.11/qt-online-installer-windows-x64-4.11.0.exe)
上面是一个qt的下载直链，复制粘贴到地址栏即可直接进行下载。

## Qt Group

Qt是一个开源工具，提供商业许可与开源许可，使用Qt的Online-Installer，需要在QtGroup注册一个账号，在GUI界面也需要进行登录。

![](2026-09-28-160036.png)

![](2026-09-28%20-161831.png)

## GUI选项

仅选择Qt-SDK即可，其他可按需安装：

![](2026-09-28%20-162340.png)

![](2026-09-28%20-162530.png)

# VS2022-BuildTools

- [vs_BuildTools.exe](https://download.visualstudio.microsoft.com/download/pr/bc92e2cb-33de-4a0c-995d-efa817f16b16/985969f472caad75d993a5cb4c35a6a4271460cc12b343e2433b994d173aa990/vs_BuildTools.exe)

上面直链下载完成后，仅勾选MSVC编译器和Windows-SDK即可：

![](%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-09-28%20162813.png)

# Scoop (ninja+cmake)

 为了更快速的安装，可以对scoop软件仓库进行换源，先安装一下scoop：

```pwsh
# 官方安装命令
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# 添加main仓库源(替换为南大的软仓)
scoop bucket add main https://mirror.nju.edu.cn/git/scoop-main.git
scoop bucket add extras https://mirror.nju.edu.cn/git/scoop-extras.git
scoop bucket add versions https://mirror.nju.edu.cn/git/scoop-versions.git
scoop bucket add nerd-fonts https://mirror.nju.edu.cn/git/scoop-nerd-fonts.git

# 社区仓库
scoop bucket add dorado https://github.com/chawyehsu/dorado

# 安装ninja和cmake
scoop install ninja 
scoop install cmake
```

# VScode Settings
