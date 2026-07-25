---
title: 在WSL中安装ArchLinux并配置Dotfiles开启VibeCoding之旅 | WSL | ArchLinux | Dotfiles
published: 2026-07-25
pinned: false
description: 从WSL安装Arch Linux，并初始化Arch，使用dotfiles仓库预设配置ArchLinux软件包。
tags:
  - WSL
  - ArchLinux
  - Dotfiles
draft: false
lang: ""
---
# 相关链接
- [srp-dotfiles](https://github.com/RolinShmily/srp-dotfiles)
- [Maple Mono: Open source monospace font](https://font.subf.dev/zh-cn/)
- [dotfiles-ArchWiki](https://wiki.archlinux.org.cn/title/Dotfiles)
- [Archlinux | 清华镜像站](https://mirrors.tuna.tsinghua.edu.cn/help/archlinux/)
- [使用 WSL 访问网络应用程序](https://learn.microsoft.com/zh-cn/windows/wsl/networking)

# WSL初始化
参考[在WSL上编译你的OpenWrt固件 | ImmortalWrt | WSL ](https://blog.srprolin.top/posts/immortalwrt-build/)中关于WSL的安装即可，安装好Arch Linux。

## 设置终端
下载并安装字体[Maple Mono: Open source monospace font](https://font.subf.dev/zh-cn/)。

打开终端，按`Ctrl+,`打开设置，选择 **默认值** -> **外观** ：

- 字体：`Maple Mono NF CN` 
- 配色方案： `One Half Dark` 
- 背景不透明度：65%
- [x] 启用亚克力材料

## 调整WSL网络模式
`win+f`输入`wsl settings`：
选择**网络**，模式改成**Mirrored**

## 替换镜像源
在powershell输入wsl，进入archlinux：
```bash
# 1. 初始化并填充 Arch 密钥库
pacman-key --init
pacman-key --populate archlinux

# 2. 配置国内镜像源（以清华源为例）
cat << 'EOF' > /etc/pacman.d/mirrorlist
Server = https://mirrors.tuna.tsinghua.edu.cn/archlinux/$repo/os/$arch
EOF
# 更新软件包缓存
pacman -Syyu

# 安装基础软件包
pacman -Syu sudo base-devel git vim nano curl wget unzip
```

## 创建普通用户并加入管理员组
```bash
# 创建用户(将<your_username>替换)
useradd -m -G wheel -s /bin/bash <your_username>
# 设置密码
passwd <your_username>
# 加入用户管理员组
echo '%wheel ALL=(ALL:ALL) ALL' > /etc/sudoers.d/wheel
```
## 修改WSL启动设置
```bash
cat << 'EOF' > /etc/wsl.conf
[boot]
systemd=true

[user]
default=myuser

[network]
generateResolvConf=true

[interop]
enabled=true
appendWindowsPath=true
EOF
```

## 配置AUR中文社区软件包
```bash
# 安装nano编辑器
pacman -S nano
# 在 /etc/pacman.conf 文件末尾添加以下两行：
[archlinuxcn]
Server = https://mirrors.tuna.tsinghua.edu.cn/archlinuxcn/$arch
# 之后通过以下命令安装 archlinuxcn-keyring 包导入 GPG key：
pacman -Sy archlinuxcn-keyring
# 安装yay与paru
sudo pacman -S yay
yay -S paru-bin
```

# 使用dotfiles仓库安装软件包和配置

这里以[我的dotfiles](https://github.com/RolinShmily/srp-dotfiles)为例，可以来项目仓库readme查看详细的配置文件和软件包列表。

```bash
cd ~
git clone https://github.com/RolinShmily/srp-dotfiles.git
cd srp-dotfiles

# 安装软件包
chmod +x install_arch.sh
./install_arch.sh

# 同步配置文件
chmod +x config.sh
./config.sh
```
