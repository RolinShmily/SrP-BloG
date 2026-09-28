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
- [KDE frameworks](https://develop.kde.org/products/frameworks

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
