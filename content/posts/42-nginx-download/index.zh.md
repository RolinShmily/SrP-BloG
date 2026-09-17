---
title: 在Nginx中快速建立一个下载站
published: 2026-06-01
description: '利用Nginx的反代特性，将VPS中的文件经过HTTP协议路径映射，实现URL下载。'
image: ''
tags: [Nginx]
category: ''
draft: false 
lang: ''
---
# Nginx相关配置
```ini
# ==================== Download - HTTP ====================
server {
    listen 80;
    server_name <your-domain>;

    # HTTP自动跳转HTTPS
    return 301 https://$host$request_uri;
}

# ==================== Download - HTTPS ====================
server {
    listen 443 ssl http2;
    server_name d<your-domain>;

    ssl_certificate /etc/letsencrypt/live/<your-domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<your-domain>/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    root /var/www/downloads;
    client_max_body_size 500m;
    charset utf-8;
    add_header Cache-Control "no-cache, no-store, must-revalidate";

    # 目录浏览（非必须）
    #location / {
    #    autoindex on;
    #    autoindex_exact_size off;
    #    autoindex_localtime on;
    #}
    
    # 大文件强制下载
    location ~* \.(exe|msi|zip|tar|gz|rar|7z|dmg|iso|deb|rpm|apk|jar)$ {
        add_header Content-Disposition "attachment";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    sendfile on;
    tcp_nopush on;
    # 禁止访问隐藏文件
    location ~ /\. { deny all; }
}
```
- 注：这里配置默认开启SSL，请使用Certbot申请SSL证书(详见笔者往期博文)
# Shell终端操作
```bash
# 创建下载根目录
mkdir /var/www/downloads
# 将文件转移至下载根目录
mv ~/test.txt /var/www/downloads/test.txt
# 配置Nginx(将上文配置复制)
nano /etc/nginx/sites-available/default
# 检查格式，重启服务
nginx -t
sudo systemctl reload nginx
```
此时访问`https://<your-doman>/test.txt`即可自动下载该文件。
# 特定SSH用户
如果有CI/CD需求，我们可以创建一个`deploy`用户，用于进行SFTP的发布文件上传。
```bash
# 创建用户deploy
sudo useradd -m -s /bin/bash deploy
# 创建ssh目录并授予权限
sudo mkdir -p /home/deploy/.ssh
sudo touch /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 755 /home/deploy
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
# 安装acl授权应用，授予deploy用户对downloads及其未来子目录的权限
sudo apt install acl -y
sudo setfacl -R -m u:deploy:rwx /var/www/downloads
sudo setfacl -R -d -m u:deploy:rwx /var/www/downloads
# 检查下载根目录权限
getfacl /var/www/downloads
# 安装rsync用于SSH隧道的文件同步上传
sudo apt update && sudo apt install rsync -y

# 将公钥写入authorized，随后便可以由CD使用rsync方式上传文件到下载站VPS目录
nano /home/deploy/.ssh/authorized_keys
```