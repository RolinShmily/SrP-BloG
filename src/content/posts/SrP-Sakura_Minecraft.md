---
title: SrP-Sakura For Minecraft | 自用插件服务器
published: 2025-10-13
description: "本文将介绍自建的插件服务器功能，发布适用于原版生存的辅助性整合包，并为其所添加的mod、资源进行介绍说明"
image: "../assets/images/PixPin_2025-08-04_15-10-35.png"
tags: [Minecraft,整合包, 服务器]
category: ""
draft: false
lang: ""
---

# Wiki

该文章列写了`SrP-Sakura`的客户端和服务端所用的各种资源，详细的命令、按键功能、插件管理说明请到`Wiki`文档中查看:

- [The Wiki For SrP-Sakura](https://doc.srprolin.top/posts/SrP-Sakura_MC/ssmc-1.html) | (一个用`vitepress`搭建的文档页)

# SrP-Sakura 服务端

> 这并不是一个免费公开的公共服务器，如果你需要的是那样，请关闭该标签页。

这是一个自搭建的原版插件服务器的操作指南，用于记录服务器的搭建过程与功能，防止因时间而遗忘掉部分服务器细节。
介于在写这篇指南时，服务器已经完善搭建了 2 个月，部分内容可能有误，但会进行持续更新。
这篇文章中会介绍部分插件的简单使用和会遇到的问题，希望对你有所帮助。
同时，我为该`1.21.4`版本整合了一个纯净生存包，它安装了一些`mod`、光影、资源包等；当然，这些`mod`基本为可客户端单独所用，以便避免与插件服产生冲突；因此它只会对原版生存进行优化辅助，不会更改任何原版游戏内容；资源包和光影将被默认正确加载；部分游戏设置和快捷键将被更改和公示，请详细阅读部分`mod`功能与快捷键指南，以便达到良好游玩效果。

## 开放范围

这并不是一个由公共服务器搭建的 Minecraft 游戏服，它仅搭建在我自己使用的设备上，因此它并不是 24h 开机，随我个人的意志开关服。
服务器采用两种方案来提供网络地址：

- 内网地址(需联系本人加入内网)：`lin.srprolin.top`
- 外网地址(需联系本人开启服务器)：`minecraft.srprolin.top`

## 核心与版本

以`1.21.4`为主版本，以`paper`作为服务器核心，无任何外置资源包(后续可能考虑)，采用多种插件来建设服务器。

> 当然`paper`核心也不支持任何`mod`

下面是一些核心的下载地址：

- [Vanilla](https://mctimemachine.com/)原版服务器核心，不支持插件和模组，只提供了一些游戏设置和原版权限组设置(但它也并不是客户端运行的那个游戏，部分客户端红石科技将在此处失效)。
- [Spigot](https://getbukkit.org/download/spigot)老牌插件服务器核心，对原版游戏性能进行优化(一些红石科技的逻辑将被修改)，同时支持安装插件。
- [Paper](https://papermc.io/)原`Spigot`的一个分支，特点是在`spigot`基础上，支持对部分游戏特性进行自定义更改。
- [Fabric](https://fabricmc.net/use/server/)严格上说这是一个模组加载器，但其作为各种`mod`服务器的核心，本身并不支持插件，所以一般会用[MCDReforged(一个服务器管理框架)](https://docs.mcdreforged.com/zh-cn/latest/quick_start/index.html)来部署`fabric`模组服，它提供了外置插件(由插件仓库社区提供)，不与其他插件兼容。

## 服务器插件

插件资源的来源：

- [spigot](https://www.spigotmc.org/resources/categories/tools-and-utilities.15/)一些基础性插件依赖库的来源
- [CurseForge](https://www.curseforge.com/minecraft)
- [Modrith](https://modrinth.com/)
- [Github](https://github.com/)

插件列表：

- [EssentialsX](https://essentialsx.net/wiki/Home.html)可以说是一个童年插件了，像有名的`/back`、`/home`、`/tpa`指令基本都来自这个插件。可见它是一个基础性的聚合大插件，我们将以此为基础构建插件生态。

- [LuckPerms](https://luckperms.net/wiki/Home)是一个权限组管理插件，它也是在`EssentialsX`文档中被提名的姐妹花，用它管理权限的优势是可以在`Web网页端`可视化操作。

- [Multiverse](https://mvplugins.org/)又名**多元宇宙**旨在实现一台服务器，无限可能。它是大型服务器必不可少的一款插件，它能在原版服务器地图的基础上创建新的地图，并为新世界创建规则；同时其中的门户组件，又能为世界中构建出类似**地狱门**的传送门，而不必需要命令行来实现多世界传送。

- [WorldEdit](https://worldedit.enginehub.org/en/latest/quickstart/)又名创世神，是专为快速建造的模组，同时它也可以作为插件供服务器安装，能够支持`WorldEdit`的各种快速建造指令。

- [WorldGuard](https://worldguard.enginehub.org/en/latest/)是一个老牌的世界保护插件，它能够直接在文件中写明对某一世界的规则更改，例如苦力怕的爆炸是否会破坏方块；同时，它也支持对多元宇宙所创建世界的规则更改；结合多元宇宙，和`WorldGuard`的区域规则定义，就可以成功建造一个有模有样的**主城**了。

- [Chunky](https://github.com/pop4959/Chunky/wiki/Commands)是一个避免服务器卡顿的预渲染插件，它可以通过终端命令，自行预加载一定范围内的地图资源，这样避免了玩家在跑图时，由于服务器性能不足而导致的卡顿。

- [MiniMOTD](https://github.com/jpenilla/MiniMOTD/wiki)能够更改服务器在`多人游戏`选项页面的显示效果。

- [TAB](https://www.spigotmc.org/resources/tab-1-7-x-1-21-10.57806/)是对原版的`TAB`面板进行了优化，并显示更多信息，同时又能够在画面上常显示计分板，用来展示一些必要信息十分好用。

- [DecentHolograms](https://wiki.decentholograms.eu/)是一款功能非常多样的全息图插件，提供多种功能和自定义选项，可以轻松创建独特的个性化全息图。通过用户友好的命令界面，您可以轻松创建和自定义全息图，而无需编辑任何配置文件。

- [Simple Voice Chat](https://modrepo.de/minecraft/voicechat/overview)是一款语音聊天模组，也可以作为服务器插件使用，可以支持在游戏中组队麦克风通信。

- [SkinsRestorer](https://skinsrestorer.net/docs)是一款用于恢复离线模式服务器和网络皮肤的插件，让玩家只需输入一条命令即可更换皮肤。此外，`SkinsRestorer` 还支持在大型网络中缓存皮肤。

- [Infinite Villager Trading](https://modrinth.com/plugin/infinite-villager-trading?version=1.21.4&loader=spigot)插件旨在增强您的 Minecraft 服务器，提供村民交易的即时补货功能。使用此插件，您可以轻松配置各种交易机制，以适应您的游戏风格。

- [MobsToEggs](https://gitlab.com/sugarfyi-team/public/mobstoeggs-public/-/wikis/home)是一个趣味插件，可以用鸡蛋将生物进行捕捉，并转化为该生物蛋，请注意该行为是有概率的。

- [Graves](https://github.com/AvarionMC/graves)是一个全功能轻量级死亡宝箱插件/玩家墓穴插件！它囊括了您所需的一切功能，甚至更多！同时兼具轻量级和高效性。

- [GSit](https://www.spigotmc.org/resources/gsit-modern-sit-seat-and-chair-lay-and-crawl-plugin-1-16-1-21-9.62325/)可以让你坐在楼梯/椅子上，在地面上躺下、扑腾、旋转和爬行。

- [ImageFrame](https://modrinth.com/plugin/imageframe)将图像加载到地图和物品展示框上;从 URL 加载图像;支持 PNG、JPEG、WEBP 和 GIF;以地图形式或直接在物品展示框中获取它们！（使用智能选择工具选择您的物品展示框！）;自动图像调整意味着您的图像不会被拉伸！

- [ItemframeSnipper](https://modrinth.com/plugin/itemframe)是`ImageFrame`的一个拓展，它将**剪刀**的功能拓展为，剪切掉物品展示框的突出显示。

- [InteractiveChat](https://modrinth.com/plugin/interactivechat)有了这个插件，你就可以和朋友们展示你手中的物品、物品栏内容和末影箱内容了！

- [InteractionVisualizer](https://modrinth.com/plugin/interactionvisualizer)有了这个插件，你就可以！在 GUI 中实时查看玩家放入工作台的物品！

插件依赖：

- [Vault](https://github.com/milkbowl/Vault)是一个免费的开源 API 库，并且不需要额外代码；这个插件与之前的插件是具有强关联性的，只有安装了它才能完善它们的功能，例如基于`EssentialsX`的经济系统，`LuckPerms`的权限组显示等。

- [PlaceholderAPI](https://wiki.placeholderapi.com/)顾名思义是一个占位符插件，也是`TAB`插件正常显示的基础，例如`%player_name%`的显示。

- [ProtocolLib](https://www.spigotmc.org/resources/protocollib.1997/) 是一个允许对 Minecraft 协议进行读写访问的库，它的作用只是让其他插件能够正常运行。

- [Adventure](https://docs.papermc.io/adventure/getting-started/)旨在提供与聊天组件交互所需的核心库。

# SrP-Sakura 客户端

该**纯净生存辅助整合包**下载地址在[Wiki的附属整合包页](https://doc.srprolin.top/posts/SrP-Sakura_MC/ssmc-2.html)中提供。

## 启动器推荐

强烈推荐由[上海交通大学 Minecraft 社](https://mc.sjtu.cn/welcome/)自主研发的开源启动器[SJMC Launcher](https://mc.sjtu.cn/sjmcl/zh/download/latest)，简要功能见[宣传视频页](https://www.bilibili.com/video/BV1gMnJzGEiM/)

进入[下载页](https://mc.sjtu.cn/sjmcl/zh/download/latest)后，选择 portable 版本，便于管理。

![SJMC launcher下载](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/hexo/20251013123115171.png)

在任意盘符处创建新文件夹，命名为`SJMCL`，再将下载好的文件放入其中，双击运行即可。

## 资源列表

模组：

- Fabric API
- Tweakeroo
  `L_ALT+H`自动切换鞘翅
  `L_ALT+X`伪潜行
  `L_ALT+C`灵魂出窍
  开启自动补货
  开启死亡坐标打印
  开启灵活放置，搭配`L_CTRL`和`L_ALT`使用
  - MaLiLib
- TweakerMore
  `K+C`调出面板
  `R_ALT+P`安全挂机
  `L_ALT+G`伪夜视
- WI Zoom
  `Z`键开启
- Sodium 钠
- Xplus 游戏内输入法
  - Kotlin
  - cloth config api
  - architectury api
- Xplus 自动钓鱼
- 3D skin layer
- Searchables 设置键位搜索
- Searchables packs 资源包搜索框
- Remove Reloading Screen 资源包重载移除锁定
- ScalableLux 优化
- sodium options 钠视频画面
- sodium extra 钠扩展
- mod menu
  - text placeholder api
- Modern ui
  - forge config api port
- mini hud
- lithium 狸 优化
- Custom lan 自定义联机
- klee slabs 更好半砖破坏
  - balm
- jade 玉 显示
- iris shaders 光影管理
- ice berg 冰山 优化
- item hightlighter 物品拾取高亮
- fps reducer 限制器
- euphoria patches 配合光影 ComplementaryUnbound 的插件
- enity culting 实体渲染优化
- detail armor bar 细节盔甲显示
- detail armor bar compat 舒适显示
- controlling 键位冲突显示
- continuity 连接纹理 （资源包启用）
- chunks fade in 区块淡入动画
- chat heads 聊天头像显示
- chat patches 聊天补丁
  - YetAnotherConfigLib
- better advancements 更好的成就
- better ping display 更好的延迟显示
- betterstats 更好的统计信息
  - TCDCommons API
- better mount hud 更好骑乘显示
- better f3 更卡的 f3（不是）
- apple skin 苹果皮显示
- ayame paperdoll 像基岩版的自我显示
- simple voice chat 简单聊天
- inventoryhud+ HUD 显示
- Inventory profiles next 一键整理
  `R+C`开启设置
  - libIpn
- lamb dynamic lights 动态光源
- litematica 投影
  - `M+C`打开设置
- litematica printer 投影打印机
- replay mod 回放
- rei 物品管理器
- trial spawner timer 试炼塔倒计时
- ydm 武器大师
- worldedit 创世神
- xaero 世界地图
- xaero 小地图
- xaero plus
- Bobby 服务器区块缓存
- carpet 地毯假人模组
- EMF entity 实体渲染
  - ETF
  - ESF

资源包：

- Fresh 系列
  - Fresh Animations
  - Fresh moves
  - Fresh Animations extensions
  - Fresh Skeleton Physics
  - Fresh Dungeons
  - Fresh compats
  - Fresh Animations details
  - Fresh Animations objects
  - Fresh Animations Emissive
- Fresh Flower Pots
- low fire
- low on fire
- low shield
- masa mod translation pack
- mob creates
- XK redstone display
- better lanterns
- better bows
- better boat

光影:

- ComplementaryUnbound (已安装 euphoria patches，请不要卸载原光影)
