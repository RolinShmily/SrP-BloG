---
title: tailscale与headscale协同组网并启用derp中继
published: 2026-10-19
updated: 2026-10-19
pinned: false
description: 本篇是快速上手操作简记，要求是有一台VPS，并以此来搭建完全自主可控的tailscale组网服务，如果使用tailscale官方提供的商业版面板，可以忽略本篇
image: ''
tags:
  - TailScale
  - HeadScale
  - Network
  - Nginx
draft: false
---

# 相关链接

- [TailScale 官网](https://tailscale.com/)
- [HeadScale官网](https://headscale.net/)

# 部署操作

需要有一个域名，这里以`hs.example.com` 为例，并配置DNS解析到VPS上(也就是部署headscale的服务器)。

headscale就相当于一个自建的 tailscale面板，并内置了一个derp节点，在3478/udp上运行stun服务。

需要预先在VPS防火墙中开放41641/udp（wireguard直连端口（tailscale底层））以及3478/udp。

## headscale服务端安装

首先到headscale官方仓库release：https://github.com/juanfont/headscale/releases/latest

复制需要的deb包链接，方便下载：

```zsh
# 进入VPS，并下载安装包
wget -O headscale.deb https://github.com/juanfont/headscale/releases/download/v0.29.5/headscale_0.29.5_linux_amd64.deb
# 安装headscale
sudo apt install ./headscale.deb

# 修改headscale的配置
sudo vim /etc/headscale/config.yaml
```

主要的配置就这么几条：

```yaml
server_url: https://hs.example.com  # 指明headscale面板/服务端的地址
listen_addr: 127.0.0.1:8080         # 服务面板的端口（后续nginx反代地址）

derp:
  server:
    enabled: true                   # 开启derp
    stun_listen_addr: "0.0.0.0:3478" 
    private_key_path: /var/lib/headscale/derp_server_private.key
    ipv4: 198.51.100.1              # 这里一定要改成VPS真实的IP地址，默认是美国旧金山的
    # ipv6: 2001:db8::1               # ipv6一般不用，直接注释掉即可
    
dns:
  magic_dns: true
  base_domain: tail.net             # 这里配置一个内网DNS的解析根域名
  override_local_dns: false         # 防止覆盖掉VPS自身的DNS
  nameservers:
    global:
      - 223.5.5.5                   # 补一个国内阿里云DNS
```

配置一下nginx：

```zsh
# 首先用certbot申请一下证书
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d hs.example.com
# 然后以单文件形式放一下headscale的nginx配置
sudo vim /etc/nginx/conf.d/headscale.conf
```

其中nginx的配置如下：

```conf
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name hs.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name hs.example.com;

    ssl_certificate     /etc/letsencrypt/live/hs.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hs.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

```zsh
# 检验nginx配置格式并重载
sudo nginx -t && sudo systemctl reload nginx
```

最后让我们启用一下headscale本身：

```zsh
# 首先保证权限通关
sudo chown -R headscale:headscale /var/lib/headscale
# 开机自启
sudo systemctl enable --now headscale
# 立即重启
sudo systemctl restart headscale

# 依次检验服务连通性
curl -i https://hs.example.com/health 
curl -i https://hs.example.com/derp/probe
sudo ss -lunp | grep 3478 

# 创建用户(home为默认设备组)
sudo headscale users create home
# 检查一下用户id
sudo headscale users list

# 创建一个24小时过期的认证密钥(这里--user 1，前边首次创建home默认id就是1)
# 这会返回一个认证密钥，用于24小时内的无确认进组
sudo headscale preauthkeys create --user 1 --reusable --expiration 24h
```

## tailscale客户端接入

通过tailscale官网，下载各个OS的客户端，然后使用命令登录：

```zsh
# Desktop桌面端
sudo tailscale up --login-server=https://hs.example.com --authkey=<密钥>

# Phone移动端一般没有命令行操作，所以还是用服务器确认认证的方式
# 下面是移动客户端发起请求后，VPS的操作
# 这里的id来自移动客户端
sudo headscale auth register --auth-id <id> --user home 
```

# SubRouter功能
简单来说这是为软路由设备提供的很方便的子网互通，你可以使用tailscale网络访问某一个node路由下的子网设备，具体可以看这篇：[Fedora-Workstation家庭路由服务器全解 | Firewalld | SELinux | Cockpit](https://blog.srprolin.com/posts/62-fedora-homerouter#tailscale)

```zsh
# 在路由设备上框定子网网段
sudo tailscale set --advertise-routes=192.168.22.0/24

# 在Headscale中批准
# 列出路由转发清单
sudo headscale nodes list-routes
# 批准ID为1的转发请求
sudo headscale nodes approve-routes --identifier 1 --routes 192.168.22.0/24
```

# ExitNode功能
tailscale支持为某一个node选择在同一zone下的另一node作为网络流量出口，但需要exit-node配置相应的条件：
```zsh
# 以Debian为例，作为exit-node机器
# 开启内核IP转发
echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/99-tailscale.conf 
# 应用配置
sudo sysctl --system
# 设置为exit-node出口节点
sudo tailscale set --advertise-exit-node
# 检查出口网卡设备，入口自然是tailscale0
ip route get 1.1.1.1
# 如下例子，其中出口网卡就是ens3
1.1.1.1 via 192.0.2.1 dev ens3 src 192.0.2.10
# 开通防火墙
sudo ufw route allow in on tailscale0 out on ens3
# 检查
sudo ufw status numbered

# Headscale管理，批准路由(假设ID为2)
sudo headscale nodes list-routes
sudo headscale nodes approve-routes --identifier 2 --routes 0.0.0.0/0

# tailscale客户端默认出口节点
sudo tailscale set --exit-node=
# 设置为debian设备出口（选择其IP即可），这里同时保持局域网的访问
sudo tailscale set --exit-node=100.x.x.x --exit-node-allow-lan-access=true
```

# headscale+tailscale基础命令

```zsh
# 查看当前headscale下的节点
sudo headscale nodes list
# 给某些设备节点一个别名，比如nas
sudo headscale nodes rename -i <ID> nas

# 客户端tailscale进行网络检查
tailscale netcheck
# 客户端tailscale的内部DNS-Ping通信
tailscale ping nas

# 再进入其他网络中，可以进行备注（同一客户端只能进入一个虚拟组网中）
tailscale login --nickname=friend
# 展示可切换组网
tailscale switch --list
tailscale switch friend
```

# 注意事项

tailscale在运行网络检查后，遇到的UDP打不通情况，需要检查是否本机有TUN模式的代理服务，那会将所有包括tailscale的stun请求都经过代理内核，这就导致stun请求被误杀，要解决这个问题：

- 关闭TUN代理，仅系统代理，在必要时声明
- 在TUN代理的规则集与IP中添加白名单：tailscale虚拟网段、headscale服务端地址、内部DNS服务器地址等
