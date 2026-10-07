---
title: 在OpenWrt中搭建Zerotier双子网互通
published: 2026-07-28
pinned: false
description: 结合之前的zerotier文章，利用在公网上搭建的ztncui面板，以及openwrt系统插件，实现真实局域网和虚拟局域网的双向互通。
image: OpenWrt.png
tags:
  - Zerotier
  - OpenWrt
  - Network
draft: false
---

# 相关链接

- [略知Zerotier | 搭建虚拟局域网 ](https://blog.srprolin.top/posts/7-zerotier-1/)
- [PVE虚拟系统与OpenWrt配置](https://blog.srprolin.top/posts/26-pve-openwrt-1/)

# 正文

进入OpenWrt插件页面，加入虚拟局域网：
![OpenWrt ZeroTier 插件页面中的网络配置](./2026-07-28_183151_966.png)

在网络接口中，创建一个新接口：
![在 OpenWrt 网络接口中创建 ZeroTier 接口](./d775668a-eb93-4d6e-a044-f8047268b88e.png)

在网络防火墙中，新建一个zerotier区域：
![在 OpenWrt 防火墙中创建 ZeroTier 安全区域](./89d013b0-f436-4e91-b659-1d7d1115e5b2.png)

在ztncui面板的网络中，选择routers(路由)，新建一个路由：
![在 ztncui 网络路由页面中添加路由的设置](./2026-07-28-184513.png)
