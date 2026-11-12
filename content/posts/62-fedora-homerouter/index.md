---
title: Fedora-Workstation家庭路由服务器全解 | Firewalld | SELinux | Cockpit
published: 2026-11-11
updated: 2026-11-11
pinned: true
description: 继上次使用命令行给Debian苦哈哈地实现路由功能后，我又发现一个好用的Linux发行版——Fedora，默认带Gnome图形化界面，给操作上带来了很大便捷，但一些默认组件的改动也是值得注意的，比如firewalld、默认开启的SELinux，随后便是各种家庭服务器场景了，ssh、smb、frp等等。
image: ''
tags:
  - Fedora
  - Network
  - Firewalld
  - Samba
  - SMB
  - SSH
  - RDP
  - Frp
  - Cloudflared
  - SELinux
  - Cockpit
draft: false
---

# 接口组件清单

| 接口 / 组件 | 职责 |
| --- | --- |
| `wlo1` | WAN，上游 Wi-Fi |
| `enp1s0` | LAN 物理接口1 |
| `enp3s0` | LAN 物理接口2 |
| `br-lan` | LAN 网桥，网关 `192.168.22.1` |
| NetworkManager | 网络连接和网桥管理 |
| firewalld | 防火墙、转发和 NAT |
| dnsmasq | DHCP、DNS |

Fedora-Workstation会预装NetworkManager和Firewalld，一般进入系统后就可以直接用无线网卡联网了，这是非常友好的一点，因此不再需要像上一篇文章那样用命令行来连接初始网络：[在Debian13中用命令行连接网络并配置路由功能](https://blog.srprolin.com/posts/57-debian-network/)

但是Fedora作为红帽系，与Debian系区分度最大的就是软件包管理，Fedora使用dnf包管理器，支持离线包格式`.rpm` ；而Debian则是apt包管理器和`.deb` 离线包

```zsh
# 安装一些组件
sudo dnf update
sudo dnf install -y NetworkManager-wifi wpa_supplicant dnsmasq rfkill curl git
```

# NetworkManager管理网卡

```zsh
# 基础命令查看网卡信息
ip -br link
ip -br addr

# 原生网络管理cli设备信息
nmcli device status

# 创建br-lan网桥将两个物理网口汇聚
nmcli connection add type bridge con-name br-lan ifname br-lan bridge.stp no
# 配置下游网关 IP（192.168.22.1/24）并设为开机自启
nmcli connection modify br-lan ipv4.addresses 192.168.22.1/24 ipv4.method manual connection.autoconnect yes
# （可选）防止下游流量走本地代理：让 br-lan 流量直出主路由表，彻底隔离本机旁路代理
nmcli connection modify br-lan +ipv4.routing-rules "priority 100 iif br-lan table 254"
# 将两个物理有线口 enp1s0 和 enp3s0 加入 br-lan
nmcli connection add type ethernet slave-type bridge con-name br-lan-port1 ifname enp1s0 master br-lan connection.autoconnect yes
nmcli connection add type ethernet slave-type bridge con-name br-lan-port2 ifname enp3s0 master br-lan connection.autoconnect yes

# 激活配置
nmcli connection up br-lan
nmcli connection up br-lan-port1
nmcli connection up br-lan-port2
```

在此之后两个网口就都被确认成LAN口了，而nmcli看到的只是聚合后的虚拟网桥br-lan，方便管理。

# DNSmasq进行dhcp与dns配置
> 如果需要webui面板可以看后面的pi-hole，而不用安装dnsmasq
```zsh
# 将默认配置备份
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.bak

# 创建新的配置
sudo nano /etc/dnsmasq.conf
# 配置文件内容如下
# 分别定义了网卡、DHCP地址分配范围、网关地址、DNS服务器
interface=br-lan
bind-dynamic
dhcp-range=192.168.22.100,192.168.22.200,255.255.255.0,12h
dhcp-option=3,192.168.22.1
dhcp-option=6,192.168.22.1
server=223.5.5.5
server=119.29.29.29
cache-size=1500

# 开机自启动
sudo systemctl enable --now dnsmasq
# 重启服务
sudo systemctl restart dnsmasq
```

## 静态IP地址

如果一台设备（比如物理路由器）不希望它的IP被DHCP随机分配，那么可以配置静态租约：

```zsh
# 查看当前租约表，找到路由器的MAC地址
cat /var/lib/dnsmasq/dnsmasq.leases
# 1718900000 00:e0:4c:68:01:23 192.168.22.105 XiaoQiang 01:00:e0:4c:68:01:23
# 这里的 00:e0:4c:68:01:23 就是MAC地址
 
# 编辑配置
sudo nano /etc/dnsmasq.conf
# 在末尾写一行
dhcp-host=00:e0:4c:68:01:23,192.168.22.2,Router,infinite
```

# Firewalld防火墙配置、IP转发与NAT地址转换

这一步是br-lan设备能够通过wan上网的关键一步，而首先需要了解Firewalld，对比ufw，它多提出了一个zone的概念，还有为服务进程也匹配了防火墙策略，而不仅仅是端口；

私以为zone其实就是ufw的默认组策略，只不过ufw只能设置一个默认组，而firewalld可以给不同的网卡分配不同的zone，也就是一些基础的组策略。

| Zone | 信任级别 | 默认策略与适用场景 |
| --- | --- | --- |
| `drop` | 极低 | 丢弃所有传入数据包，不返回拒绝响应 |
| `block` | 极低 | 拒绝所有传入连接，并返回拒绝响应 |
| `public` | 低 | 不信任其他网络，仅允许明确放行的入站服务 |
| `external` | 低 | 外部网络，通常用于网关外网接口，常配合 masquerade |
| `dmz` | 较低 | DMZ 隔离区，允许有限的外部访问 |
| `work` | 中等 | 工作网络，默认信任程度较低 |
| `home` | 较高 | 家庭网络，允许相对更多的服务 |
| `internal` | 较高 | 内部网络，通常用于内网接口 |
| `trusted` | 最高 | 信任所有网络流量，默认允许所有连接 |

因此WAN网卡wlo1就被默认分配到external，而br-lan我们可以分配到internal：

```zsh
# 使用cli给网卡添加zone
sudo firewall-cmd --permanent --zone=external --add-interface=wlo1
sudo firewall-cmd --permanent --zone=internal --add-interface=br-lan
```

然后是开启内核IPv4转发：

```zsh
# 使用管道符 | + tee 而不是 > 来提升写入权限
echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.d/99-router.conf
sudo sysctl --system
```

开启网络地址转换NAT：

```zsh
sudo firewall-cmd --permanent --zone=external --add-masquerade
```

下一步需要创建policy，允许流量的跨域转发，也即LAN-to-WAN：

```zsh
sudo firewall-cmd --permanent --new-policy=lan-to-wan
sudo firewall-cmd --permanent --policy=lan-to-wan --add-ingress-zone=internal
sudo firewall-cmd --permanent --policy=lan-to-wan --add-egress-zone=external
sudo firewall-cmd --permanent --policy=lan-to-wan --set-target=ACCEPT
```

然后我们还需要将dhcp与dns网络服务（此为firewalld服务，而非systemd进程）加入白名单：

```zsh
sudo firewall-cmd --permanent --zone=internal --add-service=dhcp
sudo firewall-cmd --permanent --zone=internal --add-service=dns
```

最后重载应用配置：

```zsh
sudo firewall-cmd --reload
```

# Cockpit

- [Cockpit is a web-based graphical interface for servers](https://cockpit-project.org/running.html)

简单来说cockpit是fedora官方维护的用于管理nmcli和firewalld的web面板，安装之后就可以通过webui来操作nmcli以及firewalld了：

```zsh
# install
sudo dnf install cockpit

# enable
sudo systemctl enable --now cockpit.socket

# open firewall
sudo firewall-cmd --permanent --zone=internal --add-service=cockpit
```

# Pi-Hole
- [Pi-Hole——Network-wide Ad Blocking](https://pi-hole.net/)

这是一个提供DNS/DHCP服务的WebUI面板，可以替代dnsmasq的功能：
```zsh
# 安装pi-hole
curl -sSL https://install.pi-hole.net | bash
# 设置面板密码
sudo pihole setpassword

# 备份dnsmasq配置
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.bak2
# 关闭dnsmasq（如果有的话）
sudo systemctl disable --now dnsmasq

# 放行防火墙的dns、dhcp、http
sudo firewall-cmd --permanent --zone=internal --add-service=dns
sudo firewall-cmd --permanent --zone=internal --add-service=dhcp
sudo firewall-cmd --permanent --zone=internal --add-service=http
sudo firewall-cmd --reload
```
# SELinux

Fedora默认是启用这么一个兜底的安全策略方式的，它相比于过去chmod赋予文件、用户(组)权限的方式，解决了进程被攻破接管后，利用进程身份进行破坏的安全漏洞。

而在现在IPv4告无的多级NAT环境下，家庭中的Fedora其实并不是很需要SELinux这种非常严格的进程级权限控制，特别是如果软件设计上没有考虑到SELinux的情况。

这就造成我们正常使用桌面环境的情况下，SELinux在宽容模式下会更友好：

| 模式 | 行为 |
| --- | --- |
| Enforcing | 执行安全策略，拒绝违规操作 |
| Permissive | 不阻止违规操作，但记录 AVC 日志 |
| Disabled | 完全关闭 SELinux |

```zsh
# 获取模式
getenforce
# 临时关闭
sudo setenforce 0
# 恢复
sudo setenforce 1

#（推荐）直接编辑配置文件改成宽容模式
sudo nano /etc/selinux/config
# 内容如下
SELINUX=permissive

# 随后需要重启Fedora以生效
sudo reboot
```

# SSH

作为一种个人使用的桌面操作系统，Fedora默认安装了OpenSSH而没有激活sshd这个Service，如果我们需要在其他设备上通过SSH访问它，需要自行激活

```zsh
# 安装openssh-server
sudo dnf install openssh-server
# 启动sshd
sudo systemctl enable --now sshd
```

除此之外就需要考虑防火墙了，如果是一台公网VPS，当然防火墙开放区域是网卡wlo1所在的internal，但是我们是服务于内网环境的，因此只在internal-zone中允许服务：

```zsh
# 允许服务ssh在internal中被访问
sudo firewall-cmd --permanent --zone=internal --add-service=ssh
# 应用
sudo firewall-cmd --reload
# 检查
sudo firewall-cmd --zone=internal --list-services
```

当然如果你准备作为公网IP访问，则需要配置external-zone，并开启对应的端口：

```zsh
sudo firewall-cmd --permanent --zone=external --add-service=ssh
sudo firewall-cmd --permanent --add-port=22/tcp 
sudo firewall-cmd --reload
```

更多关于SSH的操作可以看这篇：[SSH 与 SFTP 安全配置：密钥登录、端口与账户管理](https://blog.srprolin.com/posts/11-ssh-1/)

# RDP远程桌面登录、共享

笔者的常用桌面环境还是Windows，因此需要用到远程桌面，不得不说Windows自带的rdp远程登录、共享是非常丝滑的，只需要`win+r` 输入`mstsc` 即可进行配置连接。

在Fedora中，你可以在系统Settings中找到相关配置，推荐只开启登录/共享其中一种方式，它会运行在RDP的默认tcp端口3389上。

上文说到在内网环境中的zone是internal，因此依然要为服务进程配置防火墙：

```zsh
sudo firewall-cmd --permanent --zone=internal --add-service=rdp
# 应用
sudo firewall-cmd --reload
# 检查
sudo firewall-cmd --zone=internal --list-services
```

PS：

- 共享：需要提前登录Fedora，而连接者直接从共享的画面上操作
- 登录：不需要登录Fedora桌面环境，已登录用户也会被连接者挤掉，连接者需要输入登录密码

笔者在使用**共享** 的过程中，会遇到假死情况：gnome认为自己仍然被连接，而Windows已经取消了rdp连接；此时需要ssh进去重启图形会话：

```zsh
systemctl --user restart gnome-remote-desktop.service
```

# SMB文件共享 | samba

```zsh
# 安装服务端客户端
sudo dnf install samba samba-client
# 启动服务
sudo systemctl enable --now smb

# 配置当前samba用户（自定义密码）
sudo smbpasswd -a "$USER"
# 启用samba用户
sudo smbpasswd -e "$USER"

# 配置samba共享默认[homes]组
sudo vim /etc/samba/smb.conf
# 修改内容如下，开启一下Browerable一般够用
  [homes]
  	  comment = Home Directories
	  valid users = %S, %D%w%S
--	  browseable = No
++	  browseable = Yes
	  read only = No
	  inherit acls = Yes
	  
# 配置防火墙规则
sudo firewall-cmd --permanent --zone=internal --add-service=samba
sudo firewall-cmd --reload
```

Windows只需`win+e` 打开资源管理器，访问`\\ip_addr\user_name` 。

更多关于SMB的信息可见：[在Linux中创建一个可局域网共享的samba文件夹 | SMB](https://blog.srprolin.com/posts/49-linux-samba-1/)

# TailScale

在安装了tailscale后，会默认创建一张网卡tailscale0，如果想让tailscale中的设备也与br-lan拥有相同的权限，需要通过防火墙加入internal-zone：

```zsh
# 查看tailscale0的zone
sudo firewall-cmd --get-zone-of-interface=tailscale0
# 查看所有avtice的zone
sudo firewall-cmd --get-active-zones

# 将tailscale0加入internal
sudo firewall-cmd --permanent --zone=internal --add-interface=tailscale0
sudo firewall-cmd --reload
```

如果你想要让通过tailscale连接到fedora的设备访问没有tailscale的子网设备，那么将这台fedora作为中转路由也非常方便，只需：

```zsh
sudo tailscale set --advertise-routes=192.168.22.0/24
```

随后在tailscale的服务端批准即可，如果你是Headscale，可以这样配准：

```zsh
# 列出路由转发清单
sudo headscale nodes list-routes
# 批准ID为1的转发请求
sudo headscale nodes approve-routes --identifier 1 --routes 192.168.22.0/24
```

更多关于Headscale与tailscale可以看这篇：[tailscale与headscale协同组网并启用derp中继](https://blog.srprolin.com/posts/56-tail-headscale/)

# Frp内网穿透

关于frpc和frps的安装部署可以看这篇：[Frp 内网穿透搭建教程：VPS 服务端与客户端配置]（https://blog.srprolin.com/posts/13-frp-1/） 此处不再赘述。

这里由于Frp是自建类型的服务（包括自建systemd），firewalld默认是没有frpc.xml来定义网络服务的，需要自行创建：

```zsh
# 创建frpc.xml
sudo nano /etc/firewalld/services/frpc.xml
# 内容如下，也就是放行7400/tcp端口
<?xml version="1.0" encoding="utf-8"?>
<service>
  <short>FRP Client</short>
  <description>FRP Client Web Dashboard</description>
  <port protocol="tcp" port="7400"/>
</service>
# 保存应用
sudo firewall-cmd --reload
# 随后加入internal
sudo firewall-cmd --permanent --zone=internal --add-service=frpc
sudo firewall-cmd --reload

# 当然如果是临时测试环境，完全可以只开通端口（这里不用permanent参数是临时开放）
sudo firewall-cmd --zone=internal --add-port=7400/tcp
sudo firewall-cmd --reload
```
