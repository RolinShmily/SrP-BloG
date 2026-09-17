---
title: 在Linux中创建一个可局域网共享的samba文件夹 | SMB
published: 2026-07-28
pinned: false
description: 以debian局域网设备为例，创建一个samba文件夹，在同一网络下，可以不用ssh隧道进行高效文件传输。
tags:
  - SMB
  - Linux
draft: false
lang: ""
---
# 正文
本文以Debian为例，创建一个根目录全权限共享文件夹(这非常危险，除非你知道你在做什么)

首先安装一下samba软件包：
```bash
apt-get update
apt-get install -y samba
```

设定登录samba共享文件夹的用户为`root`，并设置密码：
```bash
smbpasswd -a root
```

接着编辑samba配置文件：
```bash
nano /etc/samba/smb.conf
```

内容大致如下：
```txt
[root]
   comment = Root File System Share
   path = /
   valid users = root
   read only = no
   guest ok = no
   force user = root
   create mask = 0777
   directory mask = 0777
```

参数意义：
- [root]：共享文件夹名称
- path = /：要共享的真实 Linux 目录，这里是最高层的根目录 /。
- valid users = root：只有 root 用户可以验证并访问这个共享。
- read only = no：非只读模式。
- guest ok = no：禁止匿名用户/访客免密访问。
- force user = root：强制将 Samba 客户端的所有网络文件操作映射为 Linux 的 root 用户操作，无视网络用户的实际权限，从而保证你能随意删除和新建文件。
- create mask 和 directory mask = 0777：这保证了往里面传新文件或新建文件夹时，默认就是 777 最高权限（所有人可读可写可执行）。

随后重启服务：
```bash
systemctl restart smbd nmbd
```

# 如何在Windows中访问？

只需`win+r`打开运行窗/文件资源管理器，地址栏输入`\\<ipaddress>\root`(<ipaddress>替换为ipv4地址)

输入用户名`root`和对应密码即可。
