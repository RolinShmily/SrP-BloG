---
title: 关于VPS常见场景的操作总结 | Debian | Linux | Bash
published: 2026-10-08
pinned: false
description: ''
image: ''
tags:
  - Debian
  - Linux
  - Nginx
  - TLS
  - SSH
  - Bash
draft: true
---

# 相关链接
本篇以`Debian13`操作系统作为讲解基础，按照行文顺序进行操作，可以基本了解Linux的一些基础操作。

# SSH
这是一个很难绕开的问题，也往往是VPS的开端，我们购买了一个VPS，一般厂商会提供用户名`root`，以及随机密码`<root_passwd>`，这时我们随手打开**Terminal**，诸如`Powershell`、`Git Bash`以及Linux、MacOS自带的终端界面，输入如下指令来连接VPS：
```zsh
# server.ipv4为需替换字段
ssh root@server.ip
# 默认走22/tcp端口
ssh root@server.ip -p 22
```

#  Apt
在Debian系(含Ubuntu)的操作系统上，**包管理器**为`apt`，旧时则有`apt-get`，顾名思义，这是一种管理 软件的“软件”，也就是“应用商店”，可以进行软件的安装、卸载、更新等。
```zsh
# 更新apt软件列表
apt update
# 执行更新软件包 
apt upgrade
# 也可以放在一起
apt update && apt upgrade
```

# Ufw
`ufw`是一个防火墙工具，运行在操作系统上，而云厂商的**安全组**才是第一道关卡，但一些VPS厂商对**安全组**的策略比较放松，也即**允许**所有入站、出站流量，相当于裸奔，这就需要我们自己在VPS上进行防火墙配置。
```zsh
# 查找ufw
apt search ufw
# 若没有，则安装
apt install ufw 
```
首先，我们需要对SSH端口进行放行，默认的`22`是常见的被扫描端口，因此可以改成不常见(非也)的`2222`，此时我们还没有运行`ufw`。
```zsh
# 放行22、2222/tcp端口
ufw allow 22/tcp
ufw allow 2222/tcp
# 默认拒绝入站，允许出站
sudo ufw default deny incoming
sudo ufw default allow outcoming
# 启动ufw
ufw enable
# 查看状态
ufw status verbose
# 删除策略：“放行22/tcp端口”
ufw delete allow 22/tcp
```

# 修改SSH配置
我们需要将SSH默认端口改为`2222`，并禁止`root`登录。
```zsh
# 进入配置目录
cd /etc/ssh
# 编辑配置文件
nano sshd_config
```
`nano`是一个文本编辑器，相关快捷键如下：
- `ctrl+w`搜索
- `ctrl+o`+`Enter`保存
- `ctrl+x`退出
我们更改配置文件行为：`Port 2222`、`PermitRootLogin no`

# User、Group
在一般情况下，`root`作为最高权限用户，最好不要在**Dev**环境中长期使用，这会淡薄权限意识，也会造成不可挽救的麻烦，因此一个**临时拥有**最高权限的**普通**用户，就很有必要作为日常操作的主要角色。
```zsh
# -m 创建/home/rolin家目录，-s 指定用户shell环境，rolin为可替换字段
useradd  -m  -s  /bin/bash rolin
# 设置密码
passwd rolin
# 加入用户管理员组（debian系为sudo、arch为wheel）
usermod -aG sudo rolin
```
> Terminal 是 Shell 的人机交互界面，负责输入和输出；Shell 是命令解释器，负责解析命令并执行内建命令或启动外部程序。

# Sudo
`sudo`意味super-do，可以临时变成`root`用户进行操作。
```zsh
# 安装sudo
apt install sudo
# 使用visudo编辑/etc/sudoers
visudo
```
这里需要编辑行，使得`sudo`用户组具备`sudo`能力：
```zsh
# User Privilege Specification
%sudo ALL=(ALL:ALL) ALL

# 若是在sudo时不输入密码即可执行
%sudo ALL=(ALL:ALL) NOPASSWD: ALL
# 也可单独对某一用户
rolin ALL=(ALL:ALL) NOPASSWD: ALL
```
关于其中的四个“ALL”：
- 1号“ALL”：表示此主机
- 2号“ALL”：表示可以`sudo -u <user>`切换的用户(默认为`root`)
- 3号“ALL”：表示可以`sudo -g <group>`切换的用户组
- 4号“ALL”：表示可以`sudo <command>`执行的命令

此后我们就可以切换到`rol1n`了：
```zsh
su - rol1n
# 回到家/home/rol1n（root的家在/root）
cd ~
```

# SSH密钥对
SSH在我们本地叫做客户端，那么VPS上的那个就是服务端，前文我们修改了服务端的一些配置，现在我们将使用密钥对，进行无密码的SSH登录。
```zsh
# 在SSH连接的情况下，退出VPS
exit
# 生成密钥对
ssh-keygen -t ed25519 -C "rolin@example.email"
# 将公钥发到目标VPS（此时由于我们未重启ssh，所以配置2222没有生效）
ssh-copy-id rolin@server.ip -p 22
# 登录VPS
ssh rolin@server.ip
```
此时，我们可以对`sshd_config`进行进一步修改行：`PasswordAuthentication no`
```zsh
# 修改配置文件（注意使用sudo）
sudo nano /etc/ssh/sshd_config
# 终于可以重启ssh应用配置了
sudo systemctl restart ssh
```
这里的`systemctl`是Debian的“服务管理器”，管理的大多是**开机自启动**和**需要热重载**的一些服务。

# SSH的快速配置
如果每次连接VPS都需要`ssh rolin@server.ip -p 2222`，不仅长还难记，这时可以用我们客户端ssh的config了：
```zsh
# 退出VPS
exit
# 编辑config(这里用的是vim编辑器)
vim ~/.ssh/config
```
如果是`Windows`用户，可以`win+r`，输入`.`，没错就是一个英文句号，然后找到`.ssh`，创建一个`config`文本文件即可 ，如下编辑：
```txt
   Host vps
       HostName server.ip                  # 登录的 IP 地址
       User rolin                                  # 登录的用户名
       Port 2222                                  # 端口号
       IdentityFile ~/.ssh/id_ed25519 # 前文ssh-keygen生成的私钥文件
```
保存之后`ssh vps`即可快速以`rolin`登录我们的vps。

# Nginx的80端口
由于浏览器发出`http`请求到达的服务器端口默认为`80/tcp`，因此也成为早期建站的惯用端口，后来通过TLS加密手段而来的`https`，也就是我们今天浏览器针对域名的默认请求协议，到达的服务器端口为`443/tcp`。

# Certbot的TLS证书申请

# Nginx的网站上线

# 文件、目录权限管理

# 特定用户的项目管理

# TLS证书异位自动更新部署
