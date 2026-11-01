---
title: 使用cloudflare-tunnel进行VPS的ssh保活与nginx代理 | cloudflare优选
published: 2026-11-01
updated: 2026-11-01
pinned: false
description: Cloudflare-Tunnel是一个内网穿透工具，可以将内部网络中的服务穿透至Cloudflare中，再通过配置的主机名进行访问，如果是web应用比如nginx，则自动配置https，如果是其他协议，比如ssh，则需要客户端安装cloudflared，进行安全连接。
image: ''
tags:
  - Cloudflare
  - SSH
  - Cloudflare-Tunnel
draft: false
---

# SSH-Tunnel

到Cloudflare账户主页，访问 **联网** -> **Tunnels** ，创建一个tunnel，然后按照提示，配置安装服务端cloudflared：

![](%E5%9B%BE%E7%89%87.png)

最后等待连接成功后，创建完成。

## 路由

进入该tunnel后，选择给这个tunnel添加路由，选择已发布的应用程序，如图配置即可：

![](%E5%9B%BE%E7%89%87-1.png)

需自行修改ssh端口、主机名，最后就是配置ssh客户端的配置（以Windows为例）：

```pwsh
# 安装cloudflared
scoop install cloudflared
# 配置~/.ssh/config
vim ~/.ssh/config
```

配置如下字段：

```config
Host ssh-tunnel
    HostName ssh.srprolin.com
    User root
    ProxyCommand cloudflared access ssh --hostname %h
```

最重要的就是**ProxyCommand** ，配置完成后可以通过`ssh ssh-tunnel`进行VPS连接。

# Nginx-Tunnel与优选

还有一种常见场景就是Nginx等反向代理应用程序，可以非常简单的运行在`http://127.0.0.1:80`端口上，这种情况下是不需要客户端也用cloudflared的，但如果仅仅如此就是照葫芦画瓢了，接下来要说明一下cloudflare的优选。
优选操作简单来说都可以分成三部分：

- cloudflare服务本身：最初接入cloudflare的应用
- 解析层：一般用来指向优选域名/IP
- 规则层：当流量打到cloudflare时将主机名转发到应用
首先在DNS解析处，设置一条CNAME：`cdn.example.com`->`<优选域名>`

## Saas自定义主机名

首先到DNS处设置一个经过CDN的fake-ip解析，比如`saas.example.com`->`192.0.2.1`；
然后到**SSL/TLS**->**自定义主机名**，填入回退源`saas.example.com`；

记得将**SSL/TLS**边缘证书加密方式配置为**灵活**；

## Tunnel优选路由创建

首先创建一个路由`vps-nginx.example.com`->`http://127.0.0.1:80`，这就是cloudflare本体应用；
再创建一个路由`nginx.example.com`->`http://127.0.0.1:80`，这就是解析层，也是CDN层；
然后回到DNS处，删除自动创建的`nginx`记录，改成仅DNS的CNAME指向`cdn.example.com`；
再通过自定义主机名创建规则层：

![](%E5%9B%BE%E7%89%87-2.png)

随后便可通过`nginx.example.com`进行优选域名的访问。
