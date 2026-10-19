---
title: tailscale与headscale协同组网并启用derp中继
published: 2026-10-19
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

## headscale安装配置

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

dns:
  magic_dns: true
  base_domain: tail.net             # 这里配置一个内网DNS的解析根域名
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

## tailscale设备端接入

通过tailscale官网，下载各个OS的客户端，然后使用命令登录：

```zsh
# Desktop桌面端
sudo tailscale up --login-server=https://hs.example.com --authkey=<密钥>

# Phone移动端一般没有命令行操作，所以还是用服务器确认认证的方式
# 下面是移动客户端发起请求后，VPS的操作
# 这里的id来自移动客户端
sudo headscale auth register --auth-id <id> --user home 
```

## headscale+tailscale基础命令

```zsh
# 查看当前headscale下的节点
sudo headscale nodes list
# 给某些设备节点一个别名，比如nas
sudo headscale nodes rename -i <ID> nas

# 客户端tailscale进行网络检查
tailscale netcheck
# 客户端tailscale的内部DNS-Ping通信
tailscale ping nas
```

# 注意事项

tailscale在运行网络检查后，遇到的UDP打不通情况，需要检查是否本机有TUN模式的代理服务，那会将所有包括tailscale的stun请求都经过代理内核，这就导致stun请求被误杀，要解决这个问题：

- 关闭TUN代理，仅系统代理，在必要时声明
- 在TUN代理的规则集与IP中添加白名单：tailscale虚拟网段、headscale服务端地址、内部DNS服务器地址等
