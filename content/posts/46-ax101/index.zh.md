---
title: Intel-ax101板载网卡上网小记(Linux上网曲线救国) | OpenWrt | PVE
published: 2026-07-08
description: 'N100机型常见的板载无线网卡AX101, 如何在PVE虚拟系统/OpenWrt中进行上网'
image: ''
tags: [ax101,OpenWrt,PVE]
category: ''
draft: false 
lang: ''
---
# 前情摘要
AX101是一款Intel板载无线网卡，它本质上是一个射频模块，并不是完整网卡，接口协议是CNVio2，所以它并不是完整的PCIe网卡。

在我PVE虚拟化的OpenWrt(ImmortalWrt_24.10.4)版本中，搭配`kmod`：`kmod-iwlwifi`和`iwlwifi-firmware-ax101`，出现的问题是网卡能扫描到Wi-Fi，但是无法连接，经AI分析后，判断出现兼容性问题。

据此，有了这篇曲线救国的文章，主要是两套方案：
1. 通过PVE系统上网，然后搭建虚拟网桥给OpenWrt系统作为Wan口。
2. 通过OpenWrt系统底层上网，然后加入防火墙的Wan口

# PVE联网+虚拟网桥WAN口(推荐)
通过手机USB共享网络给PVE，这一步主要是为了更新APT并获取`network-manager`，打开PVE的Shell：
```bash
# 列出网卡设备
ip a
# 拉起USB手机共享网卡(请根据上一步新出现的设备ID，更改'<network-id>'，例如enxd62361ed947c)
ip link set <network-id> up
# 删除默认网关
ip route del default
# 2. 向手机索要局域网 IP
dhclient <network-id>
# 安装工具
apt update
apt install network-manager -y

# 编辑PVE网络配置
nano /etc/network/interfaces
```
你会看到的interfaces如下，需要删除一些字段，必要时请备份：
```ini
...
# 删除gateway网关，第4行前的“--”表示删除该行
    iface vmbr0 inet static
            address 192.168.22.111/24
--          gateway 192.168.22.1
            bridge-ports nic0 nic1
            bridge-stp off
            bridge-fd 0
# 创建vmbr1虚拟网桥，每行前“++”表示添加改行代码，但不要添加“++”符号！
++  auto vmbr1
++          iface vmbr1 inet static
++          address 10.10.10.1/24
++          bridge-ports none
++          bridge-stp off
++          bridge-fd 0
++          post-up echo 1 > /proc/sys/net/ipv4/ip_forward
++          post-up iptables -t nat -A POSTROUTING -s '10.10.10.0/24' -o wlo1 -j MASQUERADE
++          post-down iptables -t nat -D POSTROUTING -s '10.10.10.0/24' -o wlo1 -j MASQUERADE
...
```
然后`Ctrl+X`退出编辑，按`Y`保存，`Enter`退出即可，回到Shell，继续：
```bash
# 重启PVE网络
systemctl restart networking
# 将网络管理权交给`network-manager`
sed -i 's/managed=false/managed=true/g' /etc/NetworkManager/NetworkManager.conf

# 查看Wi-Fi设备名(我这里是已经连接成功的状态)
nmcli device status
# 可以看到`wlo1`的type就是wifi，也就是板载的ax101无线网卡
# DEVICE        TYPE      STATE                   CONNECTION 
# wlo1          wifi      connected               <wifi-name>  
# vmbr0         bridge    connected (externally)  vmbr0      
# vmbr1         bridge    connected (externally)  vmbr1      
# lo            loopback  connected (externally)  lo         
# fwbr101i0     bridge    connected (externally)  fwbr101i0  
# nic0          ethernet  connected (externally)  nic0       
# nic1          ethernet  connected (externally)  nic1       
# tap100i0      tun       connected (externally)  tap100i0   
# tap100i1      tun       connected (externally)  tap100i1   
# tap101i0      tun       connected (externally)  tap101i0  

# 开启wlo1设备管理
nmcli device set wlo1 managed yes
systemctl restart NetworkManager

# 使用NetworkManager打开全局 Wi-Fi 无线电
nmcli radio wifi on
# 物理唤醒网卡
ip link set wlo1 up
# 看看现在的状态（这时的 wlo1 应为 disconnected ）
nmcli device status

# 直接扫描并连接<wifi-name>，替换为你要连接的Wi-Fi网络名称
nmcli device wifi rescan
nmcli device wifi connect "<wifi-name>"
```
现在回到PVE面板，给OpenWrt系统硬件中，添加网络设备`vmbr1`虚拟网桥，注意取消掉PVE的 **防火墙**，随后重启OpenWrt。

然后设置OpenWrt的Wan口(网络 -> 接口)：
- 接口名称：wan
- 接口协议：静态地址
- 设备：选择`eth1`(通常来说是)
- 防火墙归入`wan`区域
然后编辑接口的详细信息：
- IPv4地址：`10.10.10.2`(定义OpenWrt该网口的地址，vmbr1虚拟网桥的PVE端点是`10.10.10.1`)
- IPv4子网掩码：`255.255.255.0`
- IPv4网关：`10.10.10.1`
- 自定义DNS：`223.5.5.5`、`223.6.6.6`（阿里云公共DNS）

# OpenWrt-SSH上网
通过SSH连接OpenWrt系统：
```bash
# 1. 自动寻找 wan 防火墙区域，并将 wlan0 强行注入
for i in $(seq 0 5); do
  name=$(uci get firewall.@zone[$i].name 2>/dev/null)
  if [ "$name" = "wan" ]; then
    uci del_list firewall.@zone[$i].device='wlan0' 2>/dev/null
    uci add_list firewall.@zone[$i].device='wlan0'
    uci commit firewall
    break
  fi
done
/etc/init.d/firewall restart

# 2. 强制系统 DNS 转发器使用阿里纯净 DNS（解决域名劫持）
uci del_list dhcp.@dnsmasq[0].server='223.5.5.5' 2>/dev/null
uci del_list dhcp.@dnsmasq[0].server='223.6.6.6' 2>/dev/null
uci add_list dhcp.@dnsmasq[0].server='223.5.5.5'
uci add_list dhcp.@dnsmasq[0].server='223.6.6.6'
uci set dhcp.@dnsmasq[0].noresolv='1'
uci commit dhcp
/etc/init.d/dnsmasq restart

# 3. 写入联网脚本(指定Wi-Fi)
# 请将'<wifi-name>'改成要连接的Wi-Fi名
cat << "EOF" > /etc/rc.local
# 1. 杀掉可能卡死硬件的 OpenWrt 官方管家进程
killall wpad >/dev/null 2>&1
killall wpa_supplicant >/dev/null 2>&1
killall udhcpc >/dev/null 2>&1
# 2. 销毁旧接口并重建纯净的 wlan0
iw dev wlan0 del >/dev/null 2>&1
iw phy phy0 interface add wlan0 type station
ip link set wlan0 up
# 3. 强行锁定网络 AP 
sleep 2
iw dev wlan0 connect "<wifi-name>"
# 4. 强拿 IP 租约 (-q 表示静默生效)
sleep 2
udhcpc -i wlan0 -q
# 5. 砸碎并覆写本机毒 DNS，防止路由器自身发不出 curl
rm -f /etc/resolv.conf
echo "nameserver 223.5.5.5" > /etc/resolv.conf
echo "nameserver 223.6.6.6" >> /etc/resolv.conf
exit 0
EOF

# (备选)卸载该方案
cat << "EOF" > /etc/rc.local
# Put your custom commands here that should be executed once
# the system init finished. By default this file does nothing.
exit 0
EOF
# 删除我们写的静态死文件
rm -f /etc/resolv.conf
# 重新建立指向系统动态缓存的软链接（OpenWrt 默认架构）
ln -s /tmp/resolv.conf.auto /etc/resolv.conf
# 重启 DNS 服务
/etc/init.d/dnsmasq restart
# 删除系统的无线配置文件
rm -f /etc/config/wireless
# 让系统自动检测 AX101 硬件，并生成纯正的原生无线配置
wifi config

# 安装和卸载之后均需重启
reboot
```


