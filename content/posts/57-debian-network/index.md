---
title: 在Debian13中用命令行连接网络并配置路由功能
published: 2026-10-21
pinned: false
description: 由于OpenWrt的功能过于丰富，我发现其实我并不需要，因此选择以Debian13作为单系统来承载路由转发，通过network-manager、dnsmasq、nftables搭建一套基于wifi-WAN口，双物理网口bridge-lan的路由系统。
image: ''
tags:
  - Network
  - Debian
  - Linux
draft: false
---

#  前言

这不是一篇手把手的详细教程，只是记录我折腾linux网络的一些实践方案，本篇的基本背景是：

- 一台n100小主机
- 搭载intel-ax101无线网卡
- 两个realtek物理网口

基本方案是以无线网卡接受wifi作为整个系统的WAN口，将两个物理网口绑定到`br-lan` 上作为LAN口，然后这两个网口既可以插路由器，又可以来一个PC直插上网。

# 系统准备

本次实践使用ventoy+debian13的网络版iso镜像，也就是在安装引导界面需要联网下载软件包的镜像版本，这一步如果没有物理网线的话，用手机USB网络共享也是可以的。

如果你想要刷系统进BIOS，可以试试`systemctl reboot --firmware-setup` ，然后狂击`F12` 或者`Delete` ，并把U盘设置为第一启动项。

进入系统安装引导后，可以选择安装桌面环境，例如GNOME、KDE Plasma，但确保你要勾选`SSH` 、`Standard System utils` 

关于分区、硬盘、网络、软件包这里不多详解，不是重点。

# 手机初次联网安装软件包

```zsh
# 列出当前的网络设备
ip -br link # 这会显示MAC地址
ip -br addr # 这会显示IP地址
lo          # 这是本地回环设备     
enp1s0      # 物理网口1
enp3s0      # 物理网口2    
wlo1        # 无线网卡
br-lan      # 自建网桥
enxeafee62a8518 # 会在下次连接改变的USB共享网络临时设备

# 激活USB设备
ip link set enxeafee62a8518 up
# 检查当前系统自带的DHCP客户端
command -v dhcpcd dhclient udhcpc
# 以dhcpcd为例，获取共享网络分配的IP
dhcpcd enxeafee62a8518
# 此时可以检查一下是否UP
ip -br link

# 准备安装软件包
apt update
apt install -y network-manager wpasupplicant dnsmasq nftables firmware-iwlwifi rfkill curl git
```

# WAN端连接wifi网络

```zsh
# 清理一下原始网络配置（一般新机器不用管）
nano /etc/network/interfaces
# 这里就是删掉之前看到的那些，即将被配置的网络设备的配置段；随后重启一下服务
systemctl restart networking

# 将网络管理权交给`network-manager`
sed -i 's/managed=false/managed=true/g' /etc/NetworkManager/NetworkManager.conf
# 查看管理的设备
nmcli device status

# 开启wlo1设备管理（无线网口）
nmcli device set wlo1 managed yes
# 开机自启并重启服务
systemctl enable --now NetworkManager
systemctl restart NetworkManager

# 解锁无线射频并拉起wlo1
rfkill unblock wifi
nmcli radio wifi on

# 扫描wifi-ssid并展示
nmcli device wifi rescan ifname wlo1
nmcli device wifi list ifname wlo1

# 连接“校园网”
nmcli device wifi connect "<SSID>" ifname wlo1
nmcli device wifi connect "<SSID>" password "<pre-passwd>" ifname wlo1
# 设置开机自动连接
nmcli connection modify "<SSID>" connection.autoconnect yes
# 检查wlo1设备状态与分配ip
ip -br addr show wlo1
```

# br-lan网桥创建

```zsh
# 创建网桥 br-lan 并关闭 STP
nmcli connection add type bridge con-name br-lan ifname br-lan bridge.stp no

# 配置下游网关 IP（192.168.22.1/24）并设为开机自启
nmcli connection modify br-lan ipv4.addresses 192.168.22.1/24 ipv4.method manual connection.autoconnect yes

# 将两个物理有线口 enp1s0 和 enp3s0 加入 br-lan
nmcli connection add type ethernet slave-type bridge con-name br-lan-port1 ifname enp1s0 master br-lan connection.autoconnect yes
nmcli connection add type ethernet slave-type bridge con-name br-lan-port2 ifname enp3s0 master br-lan connection.autoconnect yes

# 激活配置
nmcli connection up br-lan
nmcli connection up br-lan-port1
nmcli connection up br-lan-port2

# PC连上物理网口，查看设备IP
ip -br addr show br-lan
```

# DHCP设置(dnsmasq)

```zsh
# 备份初始设置
mv /etc/dnsmasq.conf /etc/dnsmasq.conf.bak 2>/dev/null
# 写入新设置
cat << 'EOF' > /etc/dnsmasq.conf
interface=br-lan
bind-dynamic
dhcp-range=192.168.22.100,192.168.22.200,255.255.255.0,12h
dhcp-option=3,192.168.22.1
dhcp-option=6,192.168.22.1
server=223.5.5.5
server=119.29.29.29
cache-size=1500
EOF
# 重启服务
systemctl enable --now dnsmasq
systemctl restart dnsmasq
```

## 静态租约

```zsh
# 查看当前租约表，找到路由器的MAC地址
cat /var/lib/misc/dnsmasq.leases
# 1718900000 00:e0:4c:68:01:23 192.168.22.105 XiaoQiang 01:00:e0:4c:68:01:23
# 这里的00:e0:4c:68:01:23为MAC地址

# 编辑配置
sudo nano /etc/dnsmasq.conf
# 在末尾写一行
dhcp-host=00:e0:4c:68:01:23,192.168.22.2,Router,infinite
```

# 防火墙与NAT转换、IP转发(精简nftables)

```zsh
# 开启内核IP转发
echo "net.ipv4.ip_forward = 1" > /etc/sysctl.d/99-router.conf
sysctl --system

# 备份原始设置
mv /etc/nftables.conf /etc/nftables.conf.bak 2>/dev/null
# 写入精简版配置
cat << 'EOF' > /etc/nftables.conf
#!/usr/sbin/nft -f
flush ruleset

table inet filter {
    chain input {
        type filter hook input priority filter; policy accept;
        ct state vmap { established : accept, related : accept, invalid : drop }
        iifname "lo" accept
        iifname "br-lan" accept
        iifname "wlo1" ip protocol icmp accept
        iifname "wlo1" drop
    }

    chain forward {
        type filter hook forward priority filter; policy drop;
        tcp flags syn tcp option maxseg size set rt mtu
        ct state vmap { established : accept, related : accept, invalid : drop }
        iifname "br-lan" accept
    }
}

table ip nat {
    chain postrouting {
        type nat hook postrouting priority srcnat; policy accept;
        oifname "wlo1" masquerade
    }
}
EOF
# 开机自启
systemctl enable --now nftables
systemctl restart nftables
```

随后可以用PC打开校园网认证页面，进行账密传输，完成认证。

# Debian本机DNS

```zsh
# 编辑本机DNS配置
nano /etc/resolv.conf

# 添加下面这一行，将请求发给本地，让dnsmasq接管
nameserver 127.0.0.1
```
