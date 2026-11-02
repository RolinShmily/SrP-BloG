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

> Vless+XTLS-Vision+Reality (+) Hysteria2 (+) Vless+WebSocket+TLS
>
> via 443 tcp/udp and 8443 tcp 
>
> on Debian13 with the kernel of sing-box

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
sudo ufw allow 443/udp
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
sudo apt install certbot python3-certbot-nginx python3-certbot-dns-cloudflare

sudo nano /etc/letsencrypt/cloudflare.ini
dns_cloudflare_api_token = <Cloudflare_API_Token>
sudo chmod 600 /etc/letsencrypt/cloudflare.ini
 
sudo certbot certonly --dns-cloudflare --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini -d "example.com" -d "*.example.com"
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
DEST_DIR="/etc/sing-box/certs"
DEST_USER="sing-box"
DEST_GROUP="sing-box"
DIR_MODE="0750"
FILE_MODE="0640"
RELOAD_CMD="sudo systemctl restart nginx"

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
    listen 127.0.0.1:8080;
    server_name localhost;
 
    root /var/www/singbox;
    index index.html index.htm index.nginx-debian.html;
 
    autoindex off;
    default_type text/plain;
    charset utf-8;
    charset_types text/css text/plain application/javascript application/json text/yaml application/x-yaml;
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

mkdir ~/singbox-server
curl -fsSLO https://gh-proxy.org/https://raw.githubusercontent.com/RolinShmily/sub-rule/refs/heads/main/.custom/singbox-dual443/server/server_v4only.json
curl -fsSLO https://gh-proxy.org/https://github.com/RolinShmily/sub-rule/raw/refs/heads/main/.custom/singbox-dual443/Update-SingboxDual443.py
vim Update-SingboxDual443.py
uv run Update-SingboxDual443.py
sudo cp server_v4only.json /etc/sing-box/config.json

sing-box check -c /etc/sing-box/config.json
sudo systemctl enable --now sing-box
sudo systemctl restart sing-box
```

# Client

```zsh
curl -LO https://github.com/MetaCubeX/mihomo/releases/download/v1.19.33/mihomo-linux-amd64-v3-v1.19.33.deb
sudo apt install ./mihomo-linux-amd64-v3-*.deb

mkdir ~/mihomo-client
curl -fsSLO https://gh-proxy.org/https://github.com/RolinShmily/sub-rule/raw/refs/heads/main/.custom/singbox-dual443/client/mihomo-clash-v4only.yaml
curl -fsSLO https://gh-proxy.org/https://github.com/RolinShmily/sub-rule/raw/refs/heads/main/.custom/singbox-dual443/Update-SingboxDual443.py
vim Update-SingboxDual443.py
uv run Update-SingboxDual443.py
sudo cp mihomo-clash-v4only.yaml /etc/mihomo/config.yaml

sudo mihomo -t -d /etc/mihomo
sudo systemctl enable --now mihomo

# API
curl -i -H "Authorization: Bearer <Secret>" http://127.0.0.1:9090/version
# UI
curl -s -D - -o /dev/null http://127.0.0.1:9090/ui/
```
