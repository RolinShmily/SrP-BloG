---
title: 如何投屏和串流？
published: 2024-07-25
description: '本篇文章介绍了有关串流的流行应用——Sunshine和Moonlight组合的用法；并推荐开源项目scrcpy的投屏功能。'
image: '../assets/images/Timeline 1_01_00_01_00.jpg'
tags: [Sunshine,Moonlight,scrcpy]
category: ''
draft: false
lang: ''
---

# 串流
- 影音串流技术是一种线上即时影音播放技术，有别于传统的MPEG或MP3等影音播放方式，应用串流(streaming)技术传送多媒体的特点，在于可以边看边下载，大幅节省使用者等待的时间。
>- 方案：
>-  ***Sunshine***+***Moonlight***
- 注：默认 ***内网*** 条件下使用，没有内网条件的可以通过内网穿透，创造条件，比如 ***zerotier*** 的P2P连接，***Sakura*** 的frp反向代理
    如果有 ***IPv4或IPv6*** ，那就直接在 ***外网*** 条件下使用
## ***Sunshine***+***Moonlight***
1. ***Sunshine*** 可以简单理解为PC的信息流发射端，也就是将视频和音频信息打包，准备发送。
    下载地址：https://github.com/LizardByte/Sunshine/releases

![Sunshine](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-36-40.webp)
- 下载后在右下角托盘处，选择 ***open sunshine*** 打开web端，注册一个账户，随后登录。
- 在 ***configuration*** 的 ***General*** 里改为简体中文，***save***->***apply***

![config1](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-38-31.webp)

- 在 ***配置*** 里的 ***Network*** 里，将 ***UPnP开启***，***开启IPv4+IPv6*** ，记得保存应用。

![config3](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-40-02.webp)

- 最后保证 ***sunshine*** 在 ***Windows的防火墙*** 保护范围外，或者 ***关闭防火墙***

1. ***Moonlight*** 即串流的接收端，负责接收数据流，并将操作信息再回馈给主机。
    下载地址：
    - 安卓：https://github.com/moonlight-stream/moonlight-android/releases
    - PC：https://github.com/moonlight-stream/moonlight-qt/releases
- 在 ***assert*** 下找到对应版本的安装包后下载，随后只需要保证在同一个 ***内网环境*** 下，同时 ***sunshine*** 处于运行状态，***moonlight*** 可自动检测，检测不到可以 ***手动输入ip*** 连接。( ***ip查询*** 详见 ***zerotier*** 篇：https://rolinshmily.github.io/post/Minecraft-xia-zai-%26Zerotier-ju-yu-wang-lian-ji.html)

1. 在 ***moonlight*** 端发送连接请求后，会要求 ***sunshine*** 端输入对应 ***pin码***

![](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-45-24.webp)

![pin](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-47-29.webp)

![](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-49-15.webp)

# 投屏
- 一般应用于 ***PC操作安卓手机*** 或者 ***直播安卓手机游戏*** 时
- ***scrcpy程序*** 下载地址：https://github.com/Genymobile/scrcpy/releases
1. 在第一次进行投屏时，请使用数据线连接手机与pc，并打开手机的 ***usb调试*** 功能
>- ***USB调试*** 一般在 ***开发者选项*** 中，需要在 ***设置*** 里找到 ***关于手机*** -> ***版本信息*** -> 多次点击 ***软件版本*** （出现提示 ***处于开发者模式***）-> 回退到 ***系统与升级*** -> ***开发者选项***
- 运行程序文件，等待手机界面出现，如果不行，可以将手机的usb模式选择为 ***管理文件***
![scrcpy](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-57-41.webp)

2. ***WiFi*** 连接配置：
- 保持有线连接状态，在程序根目录下运行cmd

- 输入指令：`.\scrcpy.exe -d` 运行后关闭手机界面

- 输入指令：`.\scrcpy.exe --tcpip` 此后，保证手机处于PC的wifi连接下，可拔掉数据线。

>- 在此cmd下输入`.\scrcpy.exe -h`即可查看所有指令
***连接方式***：
- 如果使用 ***有线连接***，则直接运行程序文件 ***scrcpy.exe*** 即可
- 如果使用 ***wifi连接***，则可以在根目录下新建一个 ***start.bat*** 文件（可以先创建 ***start.txt*** 再将后缀名改为 ***bat***），***编辑***，写入代码`.\scrcpy.exe -e`保存，双击运行 ***start.bat*** 即可
---
