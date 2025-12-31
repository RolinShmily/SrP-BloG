---
title: 如何投屏和串流？
published: 2024-07-25
description: "本篇文章介绍了有关串流的流行应用——Sunshine和Moonlight组合的用法；并推荐开源项目scrcpy的投屏功能。"
image: "../assets/images/Timeline_1_01_00_01_00.jpg"
tags: [Sunshine, Moonlight, scrcpy]
category: ""
draft: false
lang: ""
---

# 串流

- 影音串流技术是一种线上即时影音播放技术，有别于传统的 MPEG 或 MP3 等影音播放方式，应用串流(streaming)技术传送多媒体的特点，在于可以边看边下载，大幅节省使用者等待的时间。
  > - 方案：
  > - **_Sunshine_**+**_Moonlight_**
- 注：默认 **_内网_** 条件下使用，没有内网条件的可以通过内网穿透，创造条件，比如 **_zerotier_** 的 P2P 连接，**_Sakura_** 的 frp 反向代理
  如果有 **_IPv4 或 IPv6_** ，那就直接在 **_外网_** 条件下使用

## **_Sunshine_**+**_Moonlight_**

1. **_Sunshine_** 可以简单理解为 PC 的信息流发射端，也就是将视频和音频信息打包，准备发送。
   下载地址：https://github.com/LizardByte/Sunshine/releases

![Sunshine](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-36-40.webp)

- 下载后在右下角托盘处，选择 **_open sunshine_** 打开 web 端，注册一个账户，随后登录。
- 在 **_configuration_** 的 **_General_** 里改为简体中文，**_save_**->**_apply_**

![config1](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-38-31.webp)

- 在 **_配置_** 里的 **_Network_** 里，将 **_UPnP 开启_**，**_开启 IPv4+IPv6_** ，记得保存应用。

![config3](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-40-02.webp)

- 最后保证 **_sunshine_** 在 **_Windows 的防火墙_** 保护范围外，或者 **_关闭防火墙_**

1. **_Moonlight_** 即串流的接收端，负责接收数据流，并将操作信息再回馈给主机。
   下载地址：
   - 安卓：https://github.com/moonlight-stream/moonlight-android/releases
   - PC：https://github.com/moonlight-stream/moonlight-qt/releases

- 在 **_assert_** 下找到对应版本的安装包后下载，随后只需要保证在同一个 **_内网环境_** 下，同时 **_sunshine_** 处于运行状态，**_moonlight_** 可自动检测，检测不到可以 **_手动输入 ip_** 连接。( **_ip 查询_** 详见 **_zerotier_** 篇：https://rolinshmily.github.io/post/Minecraft-xia-zai-%26Zerotier-ju-yu-wang-lian-ji.html)

1. 在 **_moonlight_** 端发送连接请求后，会要求 **_sunshine_** 端输入对应 **_pin 码_**

![](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-45-24.webp)

![pin](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-47-29.webp)

![](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-49-15.webp)

# 投屏

- 一般应用于 **_PC 操作安卓手机_** 或者 **_直播安卓手机游戏_** 时
- **_scrcpy 程序_** 下载地址：https://github.com/Genymobile/scrcpy/releases

1. 在第一次进行投屏时，请使用数据线连接手机与 pc，并打开手机的 **_usb 调试_** 功能
   > - **_USB 调试_** 一般在 **_开发者选项_** 中，需要在 **_设置_** 里找到 **_关于手机_** -> **_版本信息_** -> 多次点击 **_软件版本_** （出现提示 **_处于开发者模式_**）-> 回退到 **_系统与升级_** -> **_开发者选项_**

- 运行程序文件，等待手机界面出现，如果不行，可以将手机的 usb 模式选择为 **_管理文件_**
  ![scrcpy](https://cdn.jsdelivr.net/gh/RolinShmily/Images@main/PixPin_2025-04-19_10-57-41.webp)

2. **_WiFi_** 连接配置：

- 保持有线连接状态，在程序根目录下运行 cmd

- 输入指令：`.\scrcpy.exe -d` 运行后关闭手机界面

- 输入指令：`.\scrcpy.exe --tcpip` 此后，保证手机处于 PC 的 wifi 连接下，可拔掉数据线。

> - 在此 cmd 下输入`.\scrcpy.exe -h`即可查看所有指令
>   **_连接方式_**：

- 如果使用 **_有线连接_**，则直接运行程序文件 **_scrcpy.exe_** 即可
- 如果使用 **_wifi 连接_**，则可以在根目录下新建一个 **_start.bat_** 文件（可以先创建 **_start.txt_** 再将后缀名改为 **_bat_**），**_编辑_**，写入代码`.\scrcpy.exe -e`保存，双击运行 **_start.bat_** 即可

---
