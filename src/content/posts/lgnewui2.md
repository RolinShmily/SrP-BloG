---
title: LGnewUI-2 部署 | Docker | PHP | MySQL | Nginx | Certbot
published: 2026-04-03
description: 基于docker部署的PHP站点，使用MySQL数据库，并以Nginx作为反向代理上线。
image: ../assets/images/2026-04-03-16-16.png
tags:
  - Docker
  - Nginx
  - PHP
  - MySQL
  - Certbot
draft: false
lang: ""
category: ""
---
# 相关链接

- [Ki's Blog--LGnewUI作者的博客空间](https://blog.kikiw.cn/)
- [LG_Demo - 演示站](https://loveli.kikiw.cn/)
- [LGNewUi-Auth - 情侣小站在线授权系统](https://auth-love.kikiw.cn/)

本教程基于Debian13的阿里云服务器，使用Docker部署项目适配的 **PHP7.4**、**MySQL5.7** (其实是APT包已经不支持这两个老版本...)，并在宿主机安装 **Nginx**+**Certbot** 实现站点上线。

# 项目资源获取

LGnewUI-2采用授权下载方式，需要在 [LGNewUi-Auth - 情侣小站在线授权系统](https://auth-love.kikiw.cn/) 登录并经授权后，下载项目源代码。

# Docker的安装配置

参考[阿里云给出的文档](https://help.aliyun.com/zh/ecs/user-guide/install-and-use-docker),按序执行即可:
```zsh
#删除Docker相关源
sudo rm -f /etc/apt/sources.list.d/*docker*.list
#卸载Docker和相关的软件包
for pkg in docker.io docker-buildx-plugin docker-ce-cli docker-ce-rootless-extras docker-compose-plugin docker-doc docker-compose podman-docker containerd runc; do sudo apt-get remove -y $pkg; done

#添加 GPG 密钥
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL http://mirrors.cloud.aliyuncs.com/docker-ce/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
#将该软件源添加到 Apt 源列表中。
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: http://mirrors.cloud.aliyuncs.com/docker-ce/linux/debian
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
#安装Docker社区版本，容器运行时containerd.io，以及Docker构建和Compose插件
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

#启动Docker
sudo systemctl start docker
#设置Docker守护进程在系统启动时自动启动
sudo systemctl enable docker
```

配置镜像源:
```zsh
sudo nano /etc/docker/daemon.json
```
[轩辕镜像](https://docker.xuanyuan.me/) 一键配置脚本:
```zsh
bash <(wget -qO- https://xuanyuan.cloud/docker.sh)
```
镜像源配置示例：
```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live/"
  ]
}
```

如果配置后仍然无法拉取(`docker pull`)镜像，请考虑使用科学上网工具。

对于不同设备，可以使用以下命令传输离线镜像包：
```zsh
# 拉取镜像(设备1)
docker pull ...

# 打包镜像(设备1) | <path>/<name>.tar为自定义路径的tar文件，<image_name>为拉取的镜像名称
docker save -o <path>/<name>.tar <image_name>

# 将<name>.tar上传到服务器中，然后加载镜像(设备2--服务器)
docker load -i <path>/<name>.tar
```

# PHP、MySQL的compose配置

```zsh
# 创建docker文件夹
mkdir ~/php74
mkdir ~/mysql57

# 编辑php的docker-compose(参考下文给出的yml)
nano ~/php74/docker-compose.yml

# 编辑mysql的docker-compose(参考下文给出的yml)
nano ~/mysql57/docker-compose.yml
```

**php7.4-fpm** 配置示例：
```yaml
version: '3.9'
services:
    php:
        image: 'php:7.4-fpm'
        ports:
            - '9000:9000'
        volumes:
            - '/var/www:/var/www'
        restart: always
        container_name: php74-fpm
```

**mysql5.7** 配置示例:
```yaml
version: '3.9'
services:
    mysql:
        image: 'mysql:5.7.44'
        volumes:
            - '/data/mysql:/var/lib/mysql'
        environment:
            - MYSQL_DATABASE=LGnewUI2
            - MYSQL_ROOT_PASSWORD=yourpassword
        ports:
            - '3306:3306'
        restart: always
        container_name: mysql57
```

可以先拉取镜像，或者参考上一节的内容，加载离线镜像包:
```zsh
# 拉取镜像 (方式1)
sudo docker pull php:7.4-fpm
sudo docker pull mysql:5.7.44

# 加载镜像 (方式2)
sudo docker load -i <path>/<name>.tar
```

随后就可以启用容器了:
```zsh
cd ~/php74
sudo docker compose up -d

cd ~/mysql57
sudo docker compose up -d
```

现在需要创建docker网络，用于连通php与mysql：
```zsh
sudo docker network create mynet
sudo docker network connect mynet php74-fpm
sudo docker network connect mynet mysql57
```

# Nginx、Certbot安装与配置(网站上线)
```zsh
# 使用apt-get获取nginx、certbot
apt-get update && apt-get install -y nginx
apt-get install -y certbot
apt-get install -y python3-certbot-nginx

# 开机自启动与即刻运行nginx
systemctl enable nginx && systemctl start nginx
```
创建源码存放目录，并上传资源：
```zsh
# 需要以root身份
mkdir /var/www/love
cd /var/www/love
# 随后通过SFTP等工具上传源码至此
```
使用certbot(自动续签)申请ssl证书(确保域名都已在DNS处解析过)：
```zsh
# 将<your-main-domain>更换为你的主要站点域名
sudo certbot certonly --nginx -d <your-main-domain>

# 一些相关命令
# 查看所有已安装的证书
sudo certbot certificates
# 删除证书
sudo certbot delete --cert-name example.com
```
- `<your-main-domain>`示例: `love.example.com` | 作为主要访问地址

编辑Nginx配置文件，并上线网站:
```zsh
# 编辑配置(参考下文)
sudo nano /etc/nginx/sites-available/default

# 创建启用软链接
ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# 测试配置格式正确否
nginx -t

# 重载nginx使配置生效
sudo systemctl reload nginx
```
Nginx(LGnewUI-2)配置文件(将`<your-main-domain>`替换为自定义域名):

```ini
# ==================== Love站点 - HTTP ====================
server {
    listen 80;
    server_name <your-main-domain>;

    # HTTP自动跳转HTTPS
    return 301 https://$host$request_uri;
}

# ==================== Love站点 - HTTPS ====================
server {
    listen 443 ssl http2;
    server_name <your-main-domain>;

    ssl_certificate /etc/letsencrypt/live/<your-main-domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<your-main-domain>/privkey.pem;

    root /var/www/love;
    index index.php index.html index.htm;

    client_max_body_size 100m;
    client_body_timeout 60s;

    gzip on;
    gzip_types text/plain text/css application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_comp_level 6;
    gzip_vary on;

    location ~ ^.+?\.php(/.*)?$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        set $path_info $fastcgi_path_info;
        fastcgi_param PATH_INFO $path_info;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
}
```

## 防IP直连的Nginx配置(选用)
直接给出配置文件新增字段：
```ini
# ==================== 防IP访问 - HTTP ====================
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    # 匹配所有未绑定的域名和直接 IP 访问
    # 444直接关闭连接，不返回任何信息，比 403 更安全
    server_name _;
    return 444;
}

# ==================== 防IP访问 - HTTPS ====================
server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name _;

    # 配置一个无效或自签名的 SSL 证书，或指向不存在的证书路径
    # 目的是让通过 IP 的 HTTPS 访问因证书错误而失败
    ssl_certificate /data/customSSL/dummy.crt;
    ssl_certificate_key /data/customSSL/dummy.key;

    # 也可以直接返回错误，但证书错误通常能阻止连接建立
    return 444;
}
```
启用之前，需要先使用**openssl**申请自签名无效证书：
```zsh
mkdir -p /data/customSSL
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /data/customSSL/dummy.key \
  -out /data/customSSL/dummy.crt \
  -subj "/CN=unused"
```

# LGnewUI-2 新版本依赖补全

此节用于解决LGnewUI部署引导中大多数问题。

## SourceGuardian 加密依赖文件
- [ixed.7.4.lin_x86-64下载链接--来自GitHub](https://raw.githubusercontent.com/BaseMax/sourceguardian-loader-linux-x86-64/refs/heads/main/ixed.7.4.lin)

将此文件上传到服务器后，进入PHP容器的bash环境进行依赖安装：
```zsh
# 把ixed.7.4.lin文件从宿主机复制到容器
docker cp ixed.7.4.lin php74-fpm:/usr/local/lib/php/extensions/no-debug-non-zts-20190902/
# 进容器配置php.ini
docker exec -it php74-fpm bash
echo "extension=ixed.7.4.lin" >> /usr/local/etc/php/conf.d/ixed.ini
echo "sourceguardian.enable_vm_hybrid=1" >> /usr/local/etc/php/conf.d/ixed.ini
```

## PHP基本配置与依赖拓展
```zsh
# 进入容器bash环境(请判断你是否在宿主机中)
docker exec -it php74-fpm bash

# 基本配置
echo 'upload_max_filesize = 20M' >> /usr/local/etc/php/conf.d/custom.ini
echo 'post_max_size = 20M' >> /usr/local/etc/php/conf.d/custom.ini

# mysql拓展
docker-php-ext-install pdo_mysql mysqli

# EXIF拓展
docker-php-ext-install exif

# 换阿里云apt源
echo "deb http://mirrors.aliyun.com/debian bullseye main contrib non-free" > /etc/apt/sources.list
echo "deb http://mirrors.aliyun.com/debian-security bullseye-security main contrib non-free" >> /etc/apt/sources.list
apt-get update

# GD拓展（图片处理）
apt-get install -y libpng-dev libjpeg-dev libwebp-dev --no-install-recommends
docker-php-ext-configure gd --with-jpeg --with-webp
docker-php-ext-install gd

# Zip拓展（压缩）
apt-get install -y libzip-dev --no-install-recommends
docker-php-ext-install zip

# Intl拓展（国际化）
apt-get install -y libicu-dev --no-install-recommends
docker-php-ext-install intl

# imagick拓展
apt-get install -y libmagickwand-dev --no-install-recommends
pecl install imagick
docker-php-ext-enable imagick

# mysql-client(mysqldump)
apt-get install -y default-mysql-client

# FFmpeg
apt-get install -y ffmpeg --no-install-recommends

# 退出容器bash环境，重启容器
exit
docker restart php74-fpm
```

## 路径权限问题

在上文中，**PHP** 的挂载路径为`/var/www/`，而docker容器的权限身份一般是`uid=33(www-data) gid=33(www-data) groups=33(www-data)`，需要保持路径所属身份一致：
```zsh
# 确认容器权限身份，一般为uid=33(www-data) gid=33(www-data) groups=33(www-data)
docker exec php74-fpm id www-data
# 1. 创建与容器内匹配的用户和组（UID/GID 都是 33）
sudo groupadd -g 33 www-data 2>/dev/null
sudo useradd -u 33 -g 33 -M -s /sbin/nologin www-data 2>/dev/null
# 2. 设置项目目录所有者
sudo chown -R 33:33 /var/www/
```

## MySQL数据库填写
在上文的**compose**文件中，已经创建了一个数据库：
- 地址：`mysql57`
- 库名：`LGnewUI2`
- 用户：`root`
- 密码：`yourpassword`

## 和风天气API--生成Ed25519密钥对
```zsh
cd ~
# 生成私钥文件
openssl genpkey -algorithm Ed25519 -out private.pem
# 导出公钥文件
openssl pkey -in private.pem -pubout -out public.pem
# 查看内容
cat private.pem
cat public.pem
```

## 获取CDN客户端真实IP
在Nginx配置文件的`Server`字段中，添加如下配置：
```ini
set_real_ip_from 0.0.0.0/0;
real_ip_header X-Forwarded-For;
real_ip_recursive on;
```
具体功能：
- 接受来自所有IP的请求(理论上该使用场景只需填写CDN的IP段)
- 从`X-Forwarded-For`请求头获取真实IP
- 递归搜索，从右向左排除所有信任IP段，取第一个不信任IP(当前配置下默认取最左侧第一个IP，通常为CDN自动填写的客户端真实IP)

# 2H2G3M云服务器内存性能优化

仅针对当前站点场景，也即`docker`容器化`mysql`、`php`+反向代理`nginx`建站。

## MySQL配置优化
**步骤一：创建 MySQL 自定义配置文件**

```bash
sudo mkdir -p /data/mysql/conf
sudo nano /data/mysql/conf/low-memory.cnf
```

写入以下内容：

```ini
[mysqld]
# ===== 内存核心调优 =====
# InnoDB缓冲池 - 2G机器建议256M~384M
innodb_buffer_pool_size = 256M
innodb_buffer_pool_instances = 1

# ===== 连接优化 =====
max_connections = 30            # 小站不需要太多并发连接
thread_cache_size = 4
table_open_cache = 64
table_definition_cache = 256

# ===== 临时表和排序 =====
tmp_table_size = 16M
max_heap_table_size = 16M
sort_buffer_size = 256K         # 每连接排序缓冲，够用就行
join_buffer_size = 256K
read_buffer_size = 128K
read_rnd_buffer_size = 128K

# ===== 日志优化 =====
innodb_log_file_size = 32M
innodb_log_buffer_size = 4M
sync_binlog = 0                 # 非金融场景，牺牲一点安全换性能

# ===== 其他 =====
performance_schema = OFF        # 关掉！节省 100M~200M 内存
innodb_flush_method = O_DIRECT
skip-name-resolve               # 跳过DNS反解，加速连接
```

**步骤二：修改 MySQL 的 docker-compose.yml**

```bash
nano ~/mysql57/docker-compose.yml
```

修改为：

```yaml
version: '3.9'
services:
    mysql:
        image: 'mysql:5.7.44'
        volumes:
            - '/data/mysql:/var/lib/mysql'
            - '/data/mysql/conf:/etc/mysql/conf.d'   # 新增：挂载自定义配置
        environment:
            - MYSQL_DATABASE=LGnewUI2
            - MYSQL_ROOT_PASSWORD=yourpassword
        ports:
            - '3306:3306'
        restart: always
        container_name: mysql57
        # 新增：内存限制
        deploy:
            resources:
                limits:
                    memory: 512M
                reservations:
                    memory: 256M
        # 新增：MySQL启动参数
        command: >
            --character-set-server=utf8mb4
            --collation-server=utf8mb4_general_ci
            --default-storage-engine=InnoDB
```

**步骤三：重启 MySQL 容器**

```bash
cd ~/mysql57
sudo docker compose down
sudo docker compose up -d

# 重新连接Docker网络
sudo docker network connect mynet mysql57
```

## PHP-FPM配置优化
**步骤一：创建 PHP-FPM 自定义配置**

```bash
sudo mkdir -p /data/php/conf
sudo nano /data/php/conf/zz-custom.conf
```

写入以下内容：

```ini
[www]
; 进程管理 - 动态模式
pm = dynamic
pm.max_children = 8             ; 2G机器最多8个进程
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
pm.max_requests = 200           ; 定期重启防内存泄漏

; 慢日志（排查问题用）
slowlog = /var/log/php-fpm-slow.log
request_slowlog_timeout = 3s
```

**步骤二：创建 PHP 自定义 ini 配置**

```bash
sudo mkdir -p /data/php/php-conf
sudo nano /data/php/php-conf/performance.ini
```

写入以下内容：

```ini
; 内存限制
memory_limit = 64M              ; 小站64M绰绰有余

; OPcache 优化
[opcache]
opcache.enable = 1
opcache.memory_consumption = 32         ; 32M够用
opcache.interned_strings_buffer = 4
opcache.max_accelerated_files = 2000    ; 项目文件数不多
opcache.validate_timestamps = 0         ; 生产环境关闭自动检测
opcache.save_comments = 1
opcache.fast_shutdown = 1
; 更新代码后需要手动重启 php-fpm 容器或通过面板清除缓存
```

**步骤三：修改 PHP 的 docker-compose.yml**

```bash
nano ~/php74-fpm/docker-compose.yml
```

修改为：

```yaml
version: '3.9'
services:
    php:
        image: 'php:7.4-fpm'
        ports:
            - '9000:9000'
        volumes:
            - '/var/www:/var/www'
            - '/data/php/conf/zz-custom.conf:/usr/local/etc/php-fpm.d/zz-custom.conf'  # 新增：FPM配置
            - '/data/php/php-conf:/usr/local/etc/php/conf.d/custom-performance'          # 新增：PHP配置
        restart: always
        container_name: php74-fpm
        # 新增：内存限制
        deploy:
            resources:
                limits:
                    memory: 256M
                reservations:
                    memory: 128M
```

**步骤四：重启 PHP 容器**

```bash
cd ~/php74-fpm
sudo docker compose down
sudo docker compose up -d

# 重新连接Docker网络
sudo docker network connect mynet php74-fpm
```
## 添加Swap分区
2G内存没有 Swap 很危险，OOM 时会直接杀进程。
```bash
# 创建 2G swap 文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 持久化配置
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 降低swap使用倾向（优先用物理内存）
echo 'vm.swappiness = 10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 验证
free -h
```


编辑 Nginx 站点配置：

```bash
sudo nano /etc/nginx/sites-available/default
```

在 `server` 块内替换现有 gzip 配置为：

```nginx
# ===== Gzip 压缩优化 =====
gzip on;
gzip_comp_level 5;              # 5是性价比最高的等级
gzip_min_length 1k;             # 小于1K不压缩
gzip_vary on;
gzip_buffers 4 8k;
gzip_http_version 1.1;
gzip_proxied any;
gzip_types
    text/plain
    text/css
    text/javascript
    application/javascript
    application/x-javascript
    application/json
    application/xml
    application/xml+rss
    image/svg+xml
    font/woff2
    font/ttf;
```

> CSS/JS 通常能压缩 60%~80%，效果立竿见影。


# 其他
- [DBeaver](https://dbeaver.io/) | 数据库管理(此处可用来转移、备份MySQL)
- [WinSCP](https://winscp.net/eng/docs/lang:chs) | SFTP工具(上传文件到服务器)
- [MobaXterm](https://mobaxterm.mobatek.net/download-home-edition.html) | SSH工具(连接服务器、编辑文件)

