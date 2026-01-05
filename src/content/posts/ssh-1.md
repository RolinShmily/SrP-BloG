---
title: 如何安全地使用SSH、SFTP？
published: 2025-11-07
description: 本文将详细介绍如何使用密钥验证SSH连接，如何修改SSH默认端口，如何禁用root、密码登录，以及解决一些SFTP安全传输文件的权限问题。
image: ../assets/images/2026-01-05-16-44.png
tags:
  - SSH
  - SFTP
  - 云服务器
draft: false
lang: ""
category: ""
---

# SSH 的基本概念

`SSH`的百科介绍中提到：

- SSH 是较可靠，专为远程登录会话和其他网络服务提供安全性的协议。
- SSH 客户端适用于多种平台。几乎所有 UNIX 平台—包括 HP-UX、Linux、AIX、Solaris、Digital UNIX、Irix，以及其他平台，都可运行 SSH。
- SSH 有很多功能，它既可以代替 Telnet，又可以为 FTP、PoP、甚至为 PPP 提供一个安全的“通道” 。

SSH 的基本结构和使用场景：

- SSH 是由客户端和服务端的软件组成的，有两个不兼容的版本分别是：1.x 和 2.x。 用 SSH 2.x 的客户程序是不能连接到 SSH 1.x 的服务程序上去的。OpenSSH 2.x 同时支持 SSH 1.x 和 2.x。
- 服务端是一个守护进程(daemon)，他在后台运行并响应来自客户端的连接请求。服务端一般是 sshd 进程，提供了对远程连接的处理，一般包括公共密钥认证、密钥交换、对称密钥加密和非安全连接。
- 客户端包含 ssh 程序以及像 scp（远程拷贝）、slogin（远程登陆）、sftp（安全文件传输）等其他的应用程序。

简单来说就是用于连接远程服务器(多数为 Linux 系统)的一种加密通信方式；通常情况下，SSH 服务端运行在 22 端口上。

## SSH 的安全验证方式

1. 基于口令的安全验证
   只要你知道自己账号和口令，就可以登录到远程主机。所有传输的数据都会被加密，但是不能保证你正在连接的服务器就是你想连接的服务器。可能会有别的服务器在冒充真正的服务器，也就是受到“中间人”这种方式的攻击。
2. 基于密匙的安全验证
   需要依靠密匙，也就是你必须为自己创建一对密匙，并把公用密匙放在需要访问的服务器上。如果你要连接到 SSH 服务器上，客户端软件就会向服务器发出请求，请求用你的密匙进行安全验证。服务器收到请求之后，先在该服务器上你的主目录下寻找你的公用密匙，然后把它和你发送过来的公用密匙进行比较。如果两个密匙一致，服务器就用公用密匙加密“质询”（challenge）并把它发送给客户端软件。客户端软件收到“质询”之后就可以用你的私人密匙解密再把它发送给服务器。

# 云服务器的 SSH 安全策略

> 本文中提到的 Linux 系统以`Ubuntu24`发行版为例。

基于上文提到的，SSH 服务端一般运行在 22 端口，大多数云服务器厂商的安全组都默认开放了该端口；因此“攻击者”们也都知道 22 端口为 SSH 连接端口，且 Linux 的超级管理员 root 用户名也是众所周知的：如果“攻击者”采取密码爆破方式取得 SSH 的登录权，那么这台服务器就与你无关了。

## 使用一般用户操作，必要时提权

使用云服务器厂商面板 或 其他 SSH 工具登录服务器：

- `ssh root@<your-server-ip>` | `<your-server-ip>`为服务器公网 IP 地址，或者也可以使用域名
- - `root`为登录用户，这里是超级管理员；随后将提示您输入密码(只会拾取您的键盘信息而不进行显示)，输入完毕回车即可。

创建一个普通用户，作为后续登录用户：

- `sudo useradd -m <username>` | 其中`<username>`为自定义值，
- - `-m`参数为自动创建用户家目录，路径为`/home/<username>/`

为新创建的用户设置密码：

- `sudo password <username>`
- - 密码的输入没有回显，输入完毕后回车确认。

上文中的命令前置`sudo`本质上是将当前命令提升权限至`root`组来执行，但我们的上述过程均为`root`用户操作，所以可加可不加；那么对于日常登录操作的普通用户，需要为其赋予`sudo`权限，以便于管理服务器。

为普通用户赋予`sudo`权限的方式有两种：

1. 直接将用户添加到`sudo`用户组：

- `sudo usermod -aG sudo <username>` | 其中`-aG`参数表示追加到指定组

2. 编辑`sudo`配置文件(这里用 nano 编辑器)：

- `sudo nano /etc/sudoers`
- - 找到(使用方向键)`root ALL=(ALL:ALL) ALL`这一行，在其下一行添加`<username> ALL=(ALL:ALL) ALL`，随后`Ctrl+X`退出编辑器，在提示框中键入`y`保存修改，最后`Enter`确认。

现在我们就可以切换到这个拥有`sudo`权限的用户来进行服务器管理了：

- `su - <username>`
- `sudo ls /root`
- - 这条命令用来展示`root`用户目录下的文件；如果正常显示，说明当前用户拥有`sudo`权限。

那么在下次登录服务器时，就可以使用该用户：

- `ssh <username>@<your-server-ip>`

## 为用户添加密钥验证方式

上文中说到，登录 SSH 时，是需要指定一个登录用户的，那么也就是说 SSH 的验证是基于用户的。

对于我们(个人 PC，Windows 为例)使用 SSH 连接至远程服务器(Linux)这一方式中，远程服务器提供 ssh 服务端，而我们的个人 PC 是用的 ssh 客户端，因此我们需要在 Windows 上安装客户端；如果你已经使用专用的 ssh 软件(比如 Xshell、FinalShell)，那么它们的终端中都是安装好了 ssh 客户端的。

不过你也完全可以使用 Windows 自带终端`Powershell`来进行 ssh 连接，请先验证是否安装了 ssh 客户端：

- `ssh -V`
- - 输出版本号即表示已安装

对于 ssh 的客户端，是使用`known_hosts`文件来识别远程服务器的；对于 ssh 的服务端，使用`authorized_keys`文件来验证客户端连接。

下面将介绍如何进行密钥连接：

在 ssh 的客户端(windows)上，打开 powershell，申请密钥对：

- `ssh-keygen -t ed25519 -C "your_email@example.com"` | 其中`-C`参数为添加注释
- - 获取的密钥对文件将会在`C:\Users(用户)\<your-username>\.ssh\`路径下。

前往该路径，使用记事本打开`id_ed25519.pub`文件，复制其中的全部内容，用于上传至服务器。

使用上文中提到的普通用户登录服务器：

- `ssh <username>@<your-server-ip>`

此时的路径即为`<username>`的家目录，需要在此处创建并进入`.ssh`文件夹：

- `mkdir .ssh`
- `cd .ssh`

之后创建并编辑`authorized_keys`文件来保存客户端公钥：

- `nano authorized_keys`
- - 将刚刚复制的公钥内容粘贴至此，快捷键`Ctrl+Shift+V`，随后保存，退出即可。

至此，在下次登录时，服务端可以无需密码即可验证成功；客户端会提示是否保存服务端信息至`known_hosts`文件，手动确认保存即可。

如果想要获得某一服务器的 ssh 客户端认证信息(即`known_hosts`中关于该服务器的信息)，请打开你的 powershell：

- `ssh-keyscan <your-server-ip>`
- - 保存输出的所有信息
    该信息常用于一些自动化部署中，避免因 ssh 登录需手动在客户端确认验证时造成宕机。

## 修改默认端口

首先，依旧是使用上文中提到的普通用户登录你的服务器：

- `ssh <username>@<your-server-ip>`

前往 ssh 的配置文件目录(由于修改系统服务，此时我们切换为 root 用户方便操作)：

- `sudo su -`
- `cd /etc/ssh`
- `nano sshd_config`
- - 找到`#Port 22`改为`Port 22`，在其下方添加`Port 2222`即可让 ssh 服务同时在 22 和 2222 端口处开放连接。
- - 注意如果服务器有 firewall 等防火墙组件，需要开放 2222 端口；如果是云服务器，需要去安全组中开放 2222 端口的 TCP 入规则。

随后更新 system 配置，并重启 ssh 服务：

- `systemctl daemon-reload`
- `systemctl restart ssh`

注意，在我的`sshd_config`中有如下字段：

```
# When systemd socket activation is used (the default), the socket
# configuration must be re-generated after changing Port, AddressFamily, or
# ListenAddress.
#
# For changes to take effect, run:
#
#   systemctl daemon-reload
#   systemctl restart ssh.socket
```

按照提示我的重启 ssh 服务命令为：

- `systemctl daemon-reload`
- `systemctl restart ssh.socket`
- `systemctl restart ssh`

随后，新开一个终端，在连接服务器时添加`-p`参数：

- `ssh <username>@<your-server-ip> -p 2222`

在上述连接成功后，可以返回到原终端，重新编辑配置文件：

- `nano sshd_config`
- - 将`Port 22`这一行删除，并前往云服务器安全组中，关闭 22 端口的 TCP 入规则。

至此，在后续使用到 ssh 的命令中，均需加入参数`-p 2222`，因为默认的 22 端口已经被关闭；如果你的 SSH 命令长时间未响应，请思考是否是该原因。

## 禁用 root 登录、密码登录

继上文内容，依旧使用 root 身份来修改 ssh 服务端配置来实现：

- `sudo su -`
- `cd /etc/ssh`
- `nano sshd_config`
- - 找到`#PermitRootLogin yes`，改为`PermitRootLogin no`，即可关闭 root 登录，若没找到请在文件末尾自行添加。
- - 找到`#PasswordAuthentication yes`，改为`PasswordAuthentication no`，即可关闭密码登录，若没找到请在文件末尾自行添加。

# SFTP 安全文件传输以及权限问题

不过对于`PermitRootLogin`root 用户登录这条，当你使用一些`SFTP`文件管理工具软件时，请打开，这样才能以 root 身份登录，以便于浏览和管理整个服务器的文件；`sudo`权限只能在命令行临时提权，对于`SFTP`软件是无法使用的，你当然是不想在终端中使用`nano`编辑器来更改文件或上传文件的，不然你也不会使用`SFTP`软件。

请注意，如果在`SFTP`软件中为服务器添加新文件，因为你的登录名为 root，那么新创建的文件也是属于 root 的，如果想要将该文件或路径的所有者改为普通用户，请按以下操作：

- `sudo chown <username> <file>` | `<file>`为文件名称
- `sudo chown -R <username> <folder>/` | `<folder>`为文件夹名称，`-R`参数代表递归操作

此时用普通用户查看目录中的权限，如果权限不完整可进行调整：

- `ll` | 查看当前目录下所有文件、文件夹的类型、权限、链接数、所有者、所属组、大小、修改时间、名称
- - 如果仅查看目录中的文件名，可以使用`ls`命令

这里对权限作简要说明：

- `drwxr-xr-x   4 root root   4096 Nov  7 12:59 ./`；
  此时忽略第一个字母`d`，它表示这是一个`目录`；随后每三个字母都是一组权限标识，分别代表所有者、所属组、其他用户的权限；我们这里只用关心第一组权限标识，`rwx`代表可读(read)、可写(write)、可执行(execute)；使用`-`则表示无这项权限；在这个例子中也可以清晰的看到两个`root`，前一个表示该目录所有者，第二个表示该目录的所属组。

权限调整命令：

- `chmod -R u+rwx <folder>/` | 为所有者添加读写执行权
- `chmod g-w <file>` | 为所属组其他用户移除写权限
- `chmod a+r <file>` | 为所有人添加读权限
- `chmod -R u=rwx,o=x <folder>/` | 为所有者设置读写执行权，为其他用户设置只执行权限

---

至此你已经学会了如何使用 SSH 进行远程服务器连接、为 SSH 连接提供了一定的安全保障，并学习了有关 SFTP 安全文件传输权限的一些知识。
