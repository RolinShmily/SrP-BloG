---
title: 0-XTLS
published: 2026-10-13
updated: 2026-10-13
pinned: false
description: ''
image: ''
tags: []
draft: true
---

# Kernel

- v2ray-core
- xray-core
- mihomo ( clash )
- sing-box

# Protocol

- Shadowsocks
- ShadowsocksR
- Vmess
- Trojan
- XTLS
- Vless
- Reality
- Hysteria 2

# Website

- [sing-box](https://sing-box.sagernet.org/)
- [mihomo](https://wiki.metacubex.one/)
- [xray](https://xtls.github.io/)

# Server

> Vless+XTLS-Vision+Reality (+) Hysteria2
>
> via 443 tcp/udp
>
> on Debian13

```zsh
sudo mkdir -p /etc/apt/keyrings &&
   sudo curl -fsSL https://sing-box.app/gpg.key -o /etc/apt/keyrings/sagernet.asc &&
   sudo chmod a+r /etc/apt/keyrings/sagernet.asc &&
   echo '
Types: deb
URIs: https://deb.sagernet.org/
Suites: *
Components: *
Enabled: yes
Signed-By: /etc/apt/keyrings/sagernet.asc
' | sudo tee /etc/apt/sources.list.d/sagernet.sources &&
   sudo apt-get update &&
   sudo apt-get install sing-box # or sing-box-beta
```

```zsh
sudo apt install ufw
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8443/tcp
sudo ufw allow 443/tcp
```
```zsh
sudo apt install nginx
sudo nano /etc/nginx/conf.d/sing-box.conf

sudo systemctl enable --now nginx
sudo systemctl restart nginx
```
```conf
server {
    listen 80;
    listen [::]:80;
    server_name www.example.com;
    return 301 https://$host$request_uri;
}
```

```zsh
sudo apt install certbot python3-certbot-nginx 
sudo certbot certonly --nginx -d www.example.com
```

```zsh
sudo systemctl show sing-box -p User -p Group
sudo nano /etc/letsencrypt/renewal-hooks/deploy/singbox-cert.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/singbox-cert.sh

sudo certbot renew --dry-run --run-deploy-hooks
```

```sh
#!/bin/sh
set -eu

CERT_NAME="www.example.com"
DEST_DIR="/opt/app/cert"
DEST_USER="sing-box"
DEST_GROUP="sing-box"
DIR_MODE="0750"
FILE_MODE="0640"
RELOAD_CMD="systemctl reload sing-box"

if [ "${RENEWED_LINEAGE:-}" != "/etc/letsencrypt/live/${CERT_NAME}" ]; then
    exit 0
fi

install -d -o "${DEST_USER}" -g "${DEST_GROUP}" -m "${DIR_MODE}" "${DEST_DIR}"

install -o "${DEST_USER}" -g "${DEST_GROUP}" -m "${FILE_MODE}" \
    "${RENEWED_LINEAGE}/fullchain.pem" \
    "${DEST_DIR}/fullchain.pem"
    
install -o "${DEST_USER}" -g "${DEST_GROUP}" -m "${FILE_MODE}" \
    "${RENEWED_LINEAGE}/privkey.pem" \
    "${DEST_DIR}/privkey.pem"

if [ -n "${RELOAD_CMD}" ]; then
    ${RELOAD_CMD}
fi
```

```zsh
sudo nano /etc/nginx/conf.d/sing-box.conf

sudo nginx -t && systemctl reload nginx
```

```conf
server {
    listen 80;
    listen [::]:80;
    server_name www.example.com;
    return 301 https://$host$request_uri;
}
 
server {
    listen 8443 ssl;
    listen [::]:8443 ssl;
    server_name www.example.com;
 
    ssl_certificate     /etc/letsencrypt/live/www.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.example.com/privkey.pem;
 
    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;
 
    autoindex off;
    charset utf-8;
    add_header Content-Disposition inline;
 
    location / {
        try_files $uri $uri/ =404;
    }
}
```

```zsh
# <PrivateKey>
# <PublicKey>
sing-box generate reality-keypair

# <shortID>
sing-box generate rand --hex 8

# <UUID>
sing-box generate uuid

# <Hysteria2-secret> / <API-Control-Key>
sing-box generate rand --hex 8

sing-box check -c /etc/sing-box/config.json
sudo systemctl enable --now sing-box
sudo systemctl restart sing-box
```

