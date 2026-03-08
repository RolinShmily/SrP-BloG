---
title: 安装Archlinux+ClaudeCode，PVE小主机焕发第二春
published: 2026-03-08
description: '在PVE中安装ArchLinux+niri桌面，并启用核显直通，安装ClaudeCode！'
image: '../assets/images/2026-03-08-1148.png'
tags: []
category: ''
draft: false 
lang: ''
---

# 相关链接
- [ArchLinux简明指南](https://arch.icekylin.online/guide/rookie/basic-install.html)
- [ShorinLinuxExperience wiki](https://github.com/SHORiN-KiWATA/Shorin-ArchLinux-Guide/wiki)
- [intel-igpu-passthru](https://github.com/LongQT-sea/intel-igpu-passthru)
- [ZCF - Zero-Config Code Flow ](https://zcf.ufomiao.com/zh-CN/)

# PVE创建ArchLinux虚拟机
> 以下过程，继承自上篇文章 [PVE虚拟系统与OpenWrt配置 ](https://blog.srprolin.top/posts/2026-03-07-pve-1/) 安装好的PVE9.1

首先需要安装一个ArchLinux的镜像ISO文件，下面提供 [清华大学开源软件镜像站](https://mirrors.tuna.tsinghua.edu.cn/) 的下载地址:
- [点击下载最新版 ArchLinux-x86_64.iso](https://mirrors.tuna.tsinghua.edu.cn/archlinux/iso/latest/archlinux-x86_64.iso)

接下来我们遵循 [ArchLinux简明指南](https://arch.icekylin.online/guide/rookie/basic-install.html) 的手动安装教程，因此在虚拟机选择阶段，使用UEFI启动模式：

|  项目  | 子列表 |   说明    |
| :--: | :-: | :-----: |
|  常规  | 名称  | ArchLinux |
| 操作系统 |  -  | 选择你的ISO镜像文件 |
|  系统  | 机型  |   q35   |
| 系统     | BIOS    | UEFI        |
| 系统 | UEFI存储 | local-lvm |
| 系统 | - | 请不要勾选 **预签名** |
| 磁盘 | - | 按需分配大小 |
| CPU | 核心 | 4 |
| CPU | 类别 | host |
| CPU | 内存 | 8192MB |
| 网络 | - | 默认网桥vmbr0 |

## ArchLinux手动安装

启动后，点击控制台，这时就可以一边看着 [ArchLinux简明指南-archlinux基础安装](https://arch.icekylin.online/guide/rookie/basic-install.html)，一边对着控制台操作了。

在进行到 [7. 分区和格式化（使用 Btrfs 文件系统）
](https://arch.icekylin.online/guide/rookie/basic-install.html#_7-%E5%88%86%E5%8C%BA%E5%92%8C%E6%A0%BC%E5%BC%8F%E5%8C%96-%E4%BD%BF%E7%94%A8-btrfs-%E6%96%87%E4%BB%B6%E7%B3%BB%E7%BB%9F) 时，我们要先做一步分区前的设置(在指南中也有提到)，具体就是要 [将虚拟机的磁盘变更为`gpt`类型](https://arch.icekylin.online/guide/rookie/basic-install-detail.html#%F0%9F%86%95-%E5%85%A8%E6%96%B0%E5%AE%89%E8%A3%85)，两边结合即可正确完成分区操作。

随后，需要进行一些桌面环境安装前的基础配置，参考 [Archlinux简明指南-桌面环境与常用应用安装](https://arch.icekylin.online/guide/rookie/desktop-env-and-app.html)，进行一步步操作。

在进行到 [4. 安装 KDE Plasma 桌面环境 ](https://arch.icekylin.online/guide/rookie/desktop-env-and-app.html#_4-%E5%AE%89%E8%A3%85-kde-plasma-%E6%A1%8C%E9%9D%A2%E7%8E%AF%E5%A2%83) 时，跳过该桌面环境，先配置一下非root账户的默认编辑器，并安装`yay`以便于安装`AUR`中的软件:

```zsh
# 使用 `vim` 编辑 `~/bashrc` 文件
vim ~/.bashrc
# 在适当位置加入以下内容
export EDITOR='vim'
# cn 源中的签名（archlinuxcn-keyring 在 archlinuxcn）
sudo pacman -S archlinuxcn-keyring
# yay 命令可以让用户安装 AUR 中的软件（yay 在 archlinuxcn）
sudo pacman -S yay
```

桌面环境推荐使用 [Shorin-kiwata大佬准备的Niri桌面环境一键安装脚本](https://github.com/SHORiN-KiWATA/Shorin-ArchLinux-Guide/wiki/%E4%B8%80%E9%94%AE%E9%85%8D%E7%BD%AE%E6%A1%8C%E9%9D%A2%E7%8E%AF%E5%A2%83)，因为该桌面环境的内存占用比较低，对于虚拟机寸土寸金的内存来说，尽量少的内存占用是必要的。

在大佬的Wiki中给的脚本命令是 `curl -L shorin.xyz/archsetup | bash `，这里的`shorin.xyz/archsetup`其实是一个重定向短链，其实际指向文件为 [shorin-arch-setup仓库中的strap.sh](https://github.com/SHORiN-KiWATA/shorin-arch-setup/blob/main/strap.sh) 。

如果你遇到了网络问题，可以使用透明代理，或者直接将 `strap.sh` 上传到Arch虚拟机来执行。

启动脚本后，一切配置默认即可，等待完成后，就可以进入到 `Shorin's Niri` 桌面了，我将带头前往Github给大佬点个Star！

![](../assets/images/waybar-top.png)

这里是大佬脚本中所安装的软件列表：

```
# --- 系统基础 ---

# --- 文件系统与快照 (Btrfs/Snapper) ---
snapper                           # Btrfs 快照管理工具
btrfs-assistant                   # Btrfs 图形化管理 (依赖 snapper)
grub-btrfs                        # GRUB 菜单集成快照引导
inotify-tools                     # 监控文件变动 (grub-btrfsd 自动更新需要)
dosfstools                        # FAT 文件系统支持
ntfs-3g                           # NTFS 读写支持
exfat-utils                       # exFAT 支持
f2fs-tools                        # F2FS 支持
udftools                          # 光盘格式支持
xfsprogs                          # XFS 支持
gnome-disk-utility                # 磁盘管理 GUI (Disks)
baobab                            # 磁盘占用分析器

# --- 音频核心 (Pipewire Stack) ---
pipewire                          # 核心音频/视频引擎
lib32-pipewire                    # 32位兼容库 (Steam 必须)
wireplumber                       # 会话管理器
pipewire-pulse                    # PulseAudio 兼容层
pipewire-alsa                     # ALSA 兼容层
pipewire-jack                     # JACK 兼容层
pavucontrol                       # 音量控制面板
sof-firmware                      # 声卡固件 (Sound Open Firmware)
alsa-ucm-conf                     # ALSA 音频路由配置
alsa-firmware                     # 额外声卡固件

# --- 输入法与字体 (Input & Fonts) ---
fcitx5-im                         # Fcitx5 框架元包
fcitx5-chinese-addons             # 中文扩展 (拼音/云拼音)
fcitx5-rime                       # Rime 引擎
rime-ice-git                      # (AUR) 雾凇拼音配置
fcitx5-mozc                       # 日语输入法
adobe-source-han-serif-cn-fonts   # 思源宋体
adobe-source-han-sans-cn-fonts    # 思源黑体
ttf-liberation                    # 红帽基础英文字体
noto-fonts-emoji                  # Emoji 支持
ttf-jetbrains-mono-nerd           # 编程字体 (带图标)
terminus-font                     # TTY 点阵字体

# --- 硬件与电源 (Hardware) ---
power-profiles-daemon             # 电源模式切换 (省电/平衡)
bluez                             # 蓝牙协议栈
bluetui                           # 蓝牙 TUI 管理工具
usbutils                          # lsusb 工具
pciutils                          # lspci 工具
brightnessctl                     # 屏幕亮度控制
lact                              # 显卡控制中心 (A卡/N卡超频监控)
ddcutil-service                   # (AUR) 外接显示器亮度控制服务
iwd                               # networkmanager的网络后端
impala                            # iwd的tui
# --- 基础包管理 ---
flatpak                           # Flatpak 支持
pacman-contrib                    # Pacman 辅助脚本
gvim                              # 系统默认编辑器 (含 vim)
less                              # 分页查看器

# --- Shorin's Niri 依赖 ---

# --- Niri 核心组件 ---
xwayland-satellite                # Niri 必装：XWayland 兼容守护进程
swayidle                          # 空闲管理 (自动锁屏/息屏)
hyprlock                          # 锁屏工具 (支持炫酷特效)
swayosd                           # 屏幕 OSD (音量/亮度弹窗)
wlsunset                          # 护眼模式 (色温调节)
wlogout                           # (AUR) 注销/关机/重启菜单

# --- 状态栏与壁纸 ---
waybar                            # 状态栏
waybar-niri-taskbar-git           # (AUR) Waybar 专用 Niri 任务栏模块
swww                              # 动态壁纸守护进程
waypaper                          # (AUR) 壁纸设置 GUI (swww 前端)
waifu2x-ncnn-vulkan               # 图片超分工具 (优化壁纸画质)

# --- 截图与录屏 ---
grim                              # 截图后端
slurp                             # 屏幕选区工具
swappy                            # 截图快速编辑
satty                             # 现代化截图标注工具
wf-recorder                       # 屏幕录制
hyprpicker                        # 屏幕取色器

# --- 剪贴板管理 ---
wl-clipboard                      # Wayland 剪贴板命令
cliphist                          # 剪贴板历史记录
xclip                             # X11 剪贴板兼容
clipnotify                        # X11 剪贴板通知兼容

# --- 外观与主题 (Theming) ---
nwg-look                          # GTK3 主题配置
matugen                           # (AUR) Material You 动态主题生成
gnome-font-viewer                 # 字体预览

# --- 命令行增强 (Shell & CLI) ---
fish                              # 交互式 Shell
starship                          # 终端提示符
fastfetch                         # 系统信息展示
btop                              # 终端任务管理器
yazi                              # 终端文件管理器 (TUI)
eza                               # ls 替代品
zoxide                            # cd 替代品 (智能跳转)
bat                               # cat 替代品 (语法高亮)
jq                                # JSON 处理
imagemagick                       # 图片处理工具集
ffmpegthumbnailer                 # 视频缩略图生成
chafa                             # 终端图片预览后端
timg                              # 终端图片查看器

# --- 常用软件 ---

# --- 互联网与社交 ---
firefox                           # 火狐浏览器
python-pywalfox                   # (AUR) Firefox 随系统变色
linuxqq-appimage                  # (AUR) QQ
wechat-appimage                   # (AUR) 微信
flclash-bin                       # (AUR) 网络代理工具
localsend                         # 局域网传输神器
nm-connection-editor              # 高级网络连接管理
transmission-gtk                  # BT 下载
video-downloader                  # (AUR) 视频下载器 (B站/油管)

# --- 游戏 (Gaming) ---
steam                             # 游戏平台
lutris                            # 综合游戏库管理
heroic-games-launcher-bin         # Epic/GOG 启动器
protonplus                        # Proton 版本管理
mangohud                          # 游戏性能监控浮层
mangojuice-bin                    # (AUR) Mangohud 配置 GUI
gamescope                         # 游戏窗口合成器
lsfg-vk-bin                       # (AUR) 游戏补帧工具 (LSFG)

# --- 生产力与多媒体 ---
visual-studio-code-bin            # (AUR) VS Code 代码编辑器
typora-free                       # Markdown 编辑器
mpv                               # 视频播放器
imv                               # 图片查看器
obs-studio                        # 推流与录屏
cava                              # 音频可视化频谱
upscaler                          # 图片无损放大 GUI
mission-center                    # 系统监视器 (Win11 风格)
gnome-calendar                    # 日历
gnome-clocks                      # 时钟
virt-manager                      # KVM 虚拟机管理
wine                              # 运行 Windows 程序

# --- Flatpak 应用 ---
# (建议使用 flatpak install 安装，而非 pacman)
# it.mijorus.gearlever            # AppImage 管理器
# io.github.fabrialberio.pinapp   # 网页转本地应用 (PinApp)
# com.github.wwmm.easyeffects     # 系统级音频特效 (降噪/均衡器)
# com.github.tchx84.Flatseal      # Flatpak 权限管理
```

# PVE核显直通

这里以 `Intel-N100` 芯片为例.

先去往archlinux虚拟机(要接管核显的系统)，安装intel显卡驱动：
```zsh
sudo pacman -S mesa lib32-mesa vulkan-intel lib32-vulkan-intel
```

再前往PVE的后台，进入Shell控制台，输入以下命令，屏蔽intel核显，以防止pve率先使用核显:
```bash
# 使用nano编辑器，`Ctrl+x`保存修改，`y`确认，再按`enter`保存文件名
nano /etc/modprobe.d/pve-blacklist.conf
# 打开黑名单，添加如下内容
blacklist i915
blacklist snd_hda_intel
# 保存退出后，执行命令
update-initramfs -u -k all
```

为了让核显完美地被archlinux虚拟机调用，需要下载对应的核显ROM，这里给到github上已有的项目：
- [intel-igpu-passthru](https://github.com/LongQT-sea/intel-igpu-passthru)

复制好对应的核显ROM下载地址，然后回到PVE的Shell，进行导入(使用wget方式)：
```bash
# 进入kvm目录
cd /usr/share/kvm/
# wget下载对应rom
wget https://github.com/LongQT-sea/intel-igpu-passthru/releases/download/v0.1/ADL-N_TWL_GOPv21_igd.rom
```

通过命令行方式编辑虚拟机硬件，这里我的archlinux虚拟机编号为`101`，因此我需要编辑`101.conf`：
```bash
# 编辑虚拟机配置文件
nano /etc/pve/qemu-server/101.conf
# 在文件首行添加如下内容
args: -set device.hostpci0.bus=pci.0 -set device.hostpci0.addr=2.0 -set device.hostpci0.x-igd-opregion=on
# 在文件末尾添加PCI设备(UHD核显+板载声卡)(注意修改rom文件名)
hostpci0: 0000:00:02.0,romfile=ADL-N_TWL_GOPv21_igd.rom
hostpci1: 0000:00:1f.3
```

回到PVE的archlinux虚拟机硬件，查看声卡IMMUO是否与其他要用的设备冲突，判断是否取消直通声卡，同理，也可以在这里直通USB控制器，以便于连接键鼠。

最后，先关闭所有虚拟机，再重启PVE系统，连接好显示设备，启动Archlinux虚拟机，就可以看到登录界面了！

# ClaudeCode AI CLI

以我刚刚配置好的archlinux为例。

这里推荐使用 [ZCF - Zero-Config Code Flow ](https://zcf.ufomiao.com/zh-CN/) 工具，一键配置ClaudeCode。

首先确保机器环境中安装了`Node.js`：
```bash
# 检查版本
node -v
npm -v
npx -v
```
若没有，请到 [Node.js](https://nodejs.org/zh-cn/download) 官网安装node(这里给到默认安装命令)：
```bash
# 下载并安装 nvm：
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# 代替重启 shell
\. "$HOME/.nvm/nvm.sh"

# 下载并安装 Node.js：
nvm install 24

# 验证 Node.js 版本：
node -v # Should print "v24.14.0".

# 验证 npm 版本：
npm -v # Should print "11.9.0".
```
打开终端(Shorin's Niri默认快捷键`Super+T`)：
```bash
# 切换为bash环境(Shorin's Niri默认使用了fish，提供非常友好的命令补全，但不兼容bash)
bash
# 一键应用zcf
npx zcf init
```
随后就是跟着配置即可，在API配置中可以选择 **稍后进行**，下面将介绍如何接入 **GLM Coding Plan**。

## GLM Coding Plan接入
先到[API Key](https://bigmodel.cn/usercenter/proj-mgmt/apikeys)中申请一个apikey并复制保存。

接下来，打开终端，输入以下命令接入：
```bash
# 切换到bash
bash
# 自动化脚本
curl -O "https://cdn.bigmodel.cn/install/claude_code_env.sh" && bash ./claude_code_env.sh
# 根据提示，输入提前准备好的apikey即可
```