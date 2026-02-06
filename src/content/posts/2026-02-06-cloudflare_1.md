---
title: Cloudflare_1
published: 2026-02-06
pinned: false
description: Cloudflare优选域名/IP原理、Workers路由应用示例。
draft: false
lang: ""
---
# 摘要
Cloudflare优选域名/IP原理、Workers路由应用示例。
# CloudflareCDN与优选
作为互联网中的重要角色，其CDN节点遍布全球，提供了非常多的入口IP。
由于GFW的存在，中国大陆的访问情况并不是很友好，但总归有访问良好的节点IP。
优选即是对Cloudflare的全球IP进行测试，选择出优于中国大陆访问的IP。
# DNS——IP与域名的映射表
DNS服务器用于针对客户端发送的域名请求，查找并返回客户端相对应的IP，由于CDN节点网络分发技术的存在，访问一个网页的域名(例如baidu.com)，不同地区最终返回的IP是不同的。

如果我们将Cloudflare优选后的众多IP，与一个域名相绑定，并保留在DNS服务器上，那么这个域名就是优选域名。
# CloudflareWorkers路由
Workers是Cloudflare的一项功能，用于部署静态网页、动态脚本等severless应用，提供两种绑定域名方式：
- 自定义域名——自动添加DNS记录
- 自定义路由——将指定的域名路由转发至此Worker应用

由上文可知，如果要使用优选域名，就需要自定义DNS记录，将自定义域名指向优选IP/域名，因此对于Worker应用使用优选域名加速，只能使用 **自定义路由** 方式来绑定自定义域名
# 应用示例
假设你有一个worker应用，你的自定义域名为 `example.domain.com` , 你所选用的优选域名为 `better.cf.com`：
1. 进入worker应用，选择 **自定义路由**，绑定至 `example.domain.com/*`
2. 进入DNS记录，添加一条CNAME(如果是IP选A类型)解析，将`example.domain.com`解析至`better.cf.com`
