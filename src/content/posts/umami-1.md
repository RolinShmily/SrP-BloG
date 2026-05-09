---
title: 使用Docker部署Umami统计服务 | Nginx | PostgreSQL
published: 2026-04-19
description: 一个使用docker在Debian13服务器上搭建Umami统计服务的部署记录。
image: ../assets/images/2026-0419-2237.png
tags:
  - Docker
  - Nginx，PostgreSQL
draft: false
lang: ""
category: ""
---
# 相关链接
- [Umami官网](https://umami.is/)

# Docker-Compose配置
```bash
# 创建应用目录
cd ~
mkdir umami


# 编辑docker-compose.yml（参考下文配置）
# 请将<yourpassword>和<yourhashsalt>更改
nano ~/umami/docker-compose.yml
```
配置内容参考如下：
```yaml
version: '3.9'
services:
  postgres:
    image: postgres:17-alpine
    container_name: umami-postgres
    restart: always
    environment:
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: <yourpassword>
      POSTGRES_DB: umami_db
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - umami-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umami -d umami_db"]
      interval: 5s
      timeout: 5s
      retries: 5
  umami:
    image: docker.umami.is/umami-software/umami:latest
    container_name: umami
    restart: always
    environment:
      DATABASE_URL: postgresql://umami:<yourpassword>@postgres:5432/umami_db
      DATABASE_TYPE: postgresql
      HASH_SALT: <yourhashsalt>
    ports:
      - "3001:3000"
    networks:
      - umami-network
    depends_on:
      postgres:
        condition: service_healthy
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
networks:
  umami-network:
    driver: bridge
```


随后启动容器：
```bash
# 可以先拉取所需的两个镜像
sudo docker pull postgres:17-alpine
sudo docker pull docker.umami.is/umami-software/umami:latest


# 拉取成功后启动容器
cd ~/umami
sudo docker compose up -d
```

# PostgreSQL数据库备份与恢复
```bash
# 备份数据库
docker exec -t <容器名umami-postgres> pg_dump -U <用户名umami> <数据库名umami_db> > ~/backup.sql

# 恢复数据库
cat ~/backup.sql | docker exec -i <容器名umami-postgres> psql -U <用户名umami> <数据库名umami_db>
```


# Nginx+Certbot配置
```bash
# 安装启动Nginx、Certbot
apt-get update && apt-get install -y nginx
systemctl enable nginx && systemctl start nginx
apt-get install -y certbot
apt-get install -y python3-certbot-nginx


# 申请SSL证书
# 将<your-domain>改为已在DNS处解析过的域名
sudo certbot certonly --nginx -d <your-domain>


# 编辑Nginx配置文件（参考下文）
nano /etc/nginx/sites-available/default


# 启用软链接
ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default


# 测试文件格式
nginx -t


# 重载Nginx服务
systemctl reload nginx
```
配置文件内容参考：
```ini
# ==================== Umami - HTTP ====================
server {
    listen 80;
    server_name <your-domain>;


    # HTTP自动跳转HTTPS
    return 301 https://$host$request_uri;
}


# ==================== Umami - HTTPS ====================
server {
    listen 443 ssl http2;
    server_name <your-domain>;


    ssl_certificate /etc/letsencrypt/live/<your-domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<your-domain>/privkey.pem;


    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```
默认账号密码：
- Username: `admin`
- Password: `umami`
# 结语
- 上述方法建立在长期使用，且有域名的前提下，此方法不需要开放云服务器厂商处的端口。
- 当然你可以使用宝塔、1Panel等服务器面板管理应用，一键安装配置。
- 如果你只是测试，可以不进行Nginx配置，只在docker容器跑通后，开放云服务器厂商的3001TCP端口，即可通过http://ip:3001访问Umami后台。
