-- ---------------------------------------------------------------------------
-- srp-blog UPV data migration: legacy Astro post slugs -> next-blog slugs
--
-- The old site was an Astro build whose post URLs were derived from the
-- markdown filename with github-slugger (lowercased, punctuation stripped).
-- Its tracker recorded `window.location.pathname`, i.e. the PERCENT-ENCODED
-- path with a trailing slash, so `page_views` / `page_visitors` hold keys
-- such as '/posts/srp-cfg/' or
-- '/posts/2026-07-18-%E5%9C%A8wsl%E4%B8%AD...-python-tts/'.
--
-- The rebuild (next-blog) renamed every post to '<N>-<english>-<n>' and the
-- client now requests '/posts/<N>-<english>-<n>'. Without this migration all
-- historical article counters would be orphaned under names nothing reads.
--
-- Semantics
--   * PV  : the legacy row's `views` is ADDED to the new slug's row, so
--           SUM(page_views.views) - and therefore the site total - is
--           preserved exactly.
--   * UV  : visitor-day rows are moved with INSERT OR IGNORE, so a
--           visitor who saw both spellings on one day still counts once.
--   * Non-post paths (/about, /archive, pagination, ...) are deliberately
--           left untouched: they are history, and deleting them would
--           silently shrink the site-wide totals.
--
-- Idempotent: every legacy key it touches is deleted, so a second run is a
-- no-op. Take a backup first:
--   npm run db:export                # -> ./backup-YYYYMMDD.sql
--   npm run db:migrate-slugs         # or: wrangler d1 execute srp-blog-stats --remote --file=<this file>
-- ---------------------------------------------------------------------------

-- Every statement below is a no-op when its legacy keys are absent, which is
-- the case for a database that never served the old site.

-- Minecraft基础 | 虚拟局域网联机
-- 2 legacy keys: /posts/minecraft-1/  /posts/minecraft-1
INSERT INTO page_views (path, views)
	SELECT '/posts/1-minecraft-1', views FROM page_views WHERE path IN ('/posts/minecraft-1/', '/posts/minecraft-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/1-minecraft-1', visit_date FROM page_visitors WHERE path IN ('/posts/minecraft-1/', '/posts/minecraft-1');
DELETE FROM page_visitors WHERE path IN ('/posts/minecraft-1/', '/posts/minecraft-1');
DELETE FROM page_views WHERE path IN ('/posts/minecraft-1/', '/posts/minecraft-1');

-- C&C++在VScode中的配置
-- 2 legacy keys: /posts/c_invscode/  /posts/c_invscode
INSERT INTO page_views (path, views)
	SELECT '/posts/2-vscode-c-1', views FROM page_views WHERE path IN ('/posts/c_invscode/', '/posts/c_invscode')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/2-vscode-c-1', visit_date FROM page_visitors WHERE path IN ('/posts/c_invscode/', '/posts/c_invscode');
DELETE FROM page_visitors WHERE path IN ('/posts/c_invscode/', '/posts/c_invscode');
DELETE FROM page_views WHERE path IN ('/posts/c_invscode/', '/posts/c_invscode');

-- Python与Pytorch的环境搭建
-- 2 legacy keys: /posts/python-1/  /posts/python-1
INSERT INTO page_views (path, views)
	SELECT '/posts/3-python-1', views FROM page_views WHERE path IN ('/posts/python-1/', '/posts/python-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/3-python-1', visit_date FROM page_visitors WHERE path IN ('/posts/python-1/', '/posts/python-1');
DELETE FROM page_visitors WHERE path IN ('/posts/python-1/', '/posts/python-1');
DELETE FROM page_views WHERE path IN ('/posts/python-1/', '/posts/python-1');

-- 机器学习
-- 2 legacy keys: /posts/2026-03-02-machinelearning-1/  /posts/2026-03-02-machinelearning-1
INSERT INTO page_views (path, views)
	SELECT '/posts/4-ml-1', views FROM page_views WHERE path IN ('/posts/2026-03-02-machinelearning-1/', '/posts/2026-03-02-machinelearning-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/4-ml-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-03-02-machinelearning-1/', '/posts/2026-03-02-machinelearning-1');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-03-02-machinelearning-1/', '/posts/2026-03-02-machinelearning-1');
DELETE FROM page_views WHERE path IN ('/posts/2026-03-02-machinelearning-1/', '/posts/2026-03-02-machinelearning-1');

-- 如何投屏和串流？
-- 2 legacy keys: /posts/sunmoon-scrcpy/  /posts/sunmoon-scrcpy
INSERT INTO page_views (path, views)
	SELECT '/posts/5-scrcpy-1', views FROM page_views WHERE path IN ('/posts/sunmoon-scrcpy/', '/posts/sunmoon-scrcpy')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/5-scrcpy-1', visit_date FROM page_visitors WHERE path IN ('/posts/sunmoon-scrcpy/', '/posts/sunmoon-scrcpy');
DELETE FROM page_visitors WHERE path IN ('/posts/sunmoon-scrcpy/', '/posts/sunmoon-scrcpy');
DELETE FROM page_views WHERE path IN ('/posts/sunmoon-scrcpy/', '/posts/sunmoon-scrcpy');

-- SrP-CFG 游戏设置预设文件 | CS2
-- 2 legacy keys: /posts/srp-cfg/  /posts/srp-cfg
INSERT INTO page_views (path, views)
	SELECT '/posts/6-srp-cfg-1', views FROM page_views WHERE path IN ('/posts/srp-cfg/', '/posts/srp-cfg')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/6-srp-cfg-1', visit_date FROM page_visitors WHERE path IN ('/posts/srp-cfg/', '/posts/srp-cfg');
DELETE FROM page_visitors WHERE path IN ('/posts/srp-cfg/', '/posts/srp-cfg');
DELETE FROM page_views WHERE path IN ('/posts/srp-cfg/', '/posts/srp-cfg');

-- 略知Zerotier | 搭建虚拟局域网
-- 2 legacy keys: /posts/zerotier-1/  /posts/zerotier-1
INSERT INTO page_views (path, views)
	SELECT '/posts/7-zerotier-1', views FROM page_views WHERE path IN ('/posts/zerotier-1/', '/posts/zerotier-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/7-zerotier-1', visit_date FROM page_visitors WHERE path IN ('/posts/zerotier-1/', '/posts/zerotier-1');
DELETE FROM page_visitors WHERE path IN ('/posts/zerotier-1/', '/posts/zerotier-1');
DELETE FROM page_views WHERE path IN ('/posts/zerotier-1/', '/posts/zerotier-1');

-- 略知OBS | 开源视频录制与直播推流
-- 2 legacy keys: /posts/obs-1/  /posts/obs-1
INSERT INTO page_views (path, views)
	SELECT '/posts/8-obs-1', views FROM page_views WHERE path IN ('/posts/obs-1/', '/posts/obs-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/8-obs-1', visit_date FROM page_visitors WHERE path IN ('/posts/obs-1/', '/posts/obs-1');
DELETE FROM page_visitors WHERE path IN ('/posts/obs-1/', '/posts/obs-1');
DELETE FROM page_views WHERE path IN ('/posts/obs-1/', '/posts/obs-1');

-- 一些Markdown语法展示
-- 2 legacy keys: /posts/markdown-1/  /posts/markdown-1
INSERT INTO page_views (path, views)
	SELECT '/posts/9-markdown-1', views FROM page_views WHERE path IN ('/posts/markdown-1/', '/posts/markdown-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/9-markdown-1', visit_date FROM page_visitors WHERE path IN ('/posts/markdown-1/', '/posts/markdown-1');
DELETE FROM page_visitors WHERE path IN ('/posts/markdown-1/', '/posts/markdown-1');
DELETE FROM page_views WHERE path IN ('/posts/markdown-1/', '/posts/markdown-1');

-- SrP-Sakura For Minecraft | 自用插件服务器
-- 2 legacy keys: /posts/srp-sakura_minecraft/  /posts/srp-sakura_minecraft
INSERT INTO page_views (path, views)
	SELECT '/posts/10-sakura-mc-1', views FROM page_views WHERE path IN ('/posts/srp-sakura_minecraft/', '/posts/srp-sakura_minecraft')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/10-sakura-mc-1', visit_date FROM page_visitors WHERE path IN ('/posts/srp-sakura_minecraft/', '/posts/srp-sakura_minecraft');
DELETE FROM page_visitors WHERE path IN ('/posts/srp-sakura_minecraft/', '/posts/srp-sakura_minecraft');
DELETE FROM page_views WHERE path IN ('/posts/srp-sakura_minecraft/', '/posts/srp-sakura_minecraft');

-- 如何安全地使用SSH、SFTP？
-- 2 legacy keys: /posts/ssh-1/  /posts/ssh-1
INSERT INTO page_views (path, views)
	SELECT '/posts/11-ssh-1', views FROM page_views WHERE path IN ('/posts/ssh-1/', '/posts/ssh-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/11-ssh-1', visit_date FROM page_visitors WHERE path IN ('/posts/ssh-1/', '/posts/ssh-1');
DELETE FROM page_visitors WHERE path IN ('/posts/ssh-1/', '/posts/ssh-1');
DELETE FROM page_views WHERE path IN ('/posts/ssh-1/', '/posts/ssh-1');

-- Autoexec文件详解 | SrP-CFG | CS2
-- 2 legacy keys: /posts/autoexec/  /posts/autoexec
INSERT INTO page_views (path, views)
	SELECT '/posts/12-autoexec-1', views FROM page_views WHERE path IN ('/posts/autoexec/', '/posts/autoexec')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/12-autoexec-1', visit_date FROM page_visitors WHERE path IN ('/posts/autoexec/', '/posts/autoexec');
DELETE FROM page_visitors WHERE path IN ('/posts/autoexec/', '/posts/autoexec');
DELETE FROM page_views WHERE path IN ('/posts/autoexec/', '/posts/autoexec');

-- 内网穿透Frp搭建
-- 2 legacy keys: /posts/frp-1/  /posts/frp-1
INSERT INTO page_views (path, views)
	SELECT '/posts/13-frp-1', views FROM page_views WHERE path IN ('/posts/frp-1/', '/posts/frp-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/13-frp-1', visit_date FROM page_visitors WHERE path IN ('/posts/frp-1/', '/posts/frp-1');
DELETE FROM page_visitors WHERE path IN ('/posts/frp-1/', '/posts/frp-1');
DELETE FROM page_views WHERE path IN ('/posts/frp-1/', '/posts/frp-1');

-- 使用MacMini搭建Minecraft服务器 | MCSmanger面板 | SakuraFRP樱花映射
-- 2 legacy keys: /posts/mac-mc-1/  /posts/mac-mc-1
INSERT INTO page_views (path, views)
	SELECT '/posts/14-mac-mc-1', views FROM page_views WHERE path IN ('/posts/mac-mc-1/', '/posts/mac-mc-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/14-mac-mc-1', visit_date FROM page_visitors WHERE path IN ('/posts/mac-mc-1/', '/posts/mac-mc-1');
DELETE FROM page_visitors WHERE path IN ('/posts/mac-mc-1/', '/posts/mac-mc-1');
DELETE FROM page_views WHERE path IN ('/posts/mac-mc-1/', '/posts/mac-mc-1');

-- MC整合包MacMini实装 | rcon远程终端控制 | launchd系统进程守护
-- 2 legacy keys: /posts/mac-mc-2/  /posts/mac-mc-2
INSERT INTO page_views (path, views)
	SELECT '/posts/15-mac-mc-2', views FROM page_views WHERE path IN ('/posts/mac-mc-2/', '/posts/mac-mc-2')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/15-mac-mc-2', visit_date FROM page_visitors WHERE path IN ('/posts/mac-mc-2/', '/posts/mac-mc-2');
DELETE FROM page_visitors WHERE path IN ('/posts/mac-mc-2/', '/posts/mac-mc-2');
DELETE FROM page_views WHERE path IN ('/posts/mac-mc-2/', '/posts/mac-mc-2');

-- 基于SMB和Postgres的Davinci协同工作
-- 2 legacy keys: /posts/davinci-smb/  /posts/davinci-smb
INSERT INTO page_views (path, views)
	SELECT '/posts/16-davinci-smb-1', views FROM page_views WHERE path IN ('/posts/davinci-smb/', '/posts/davinci-smb')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/16-davinci-smb-1', visit_date FROM page_visitors WHERE path IN ('/posts/davinci-smb/', '/posts/davinci-smb');
DELETE FROM page_visitors WHERE path IN ('/posts/davinci-smb/', '/posts/davinci-smb');
DELETE FROM page_views WHERE path IN ('/posts/davinci-smb/', '/posts/davinci-smb');

-- 基于webDAV的远程文件虚拟盘符挂载
-- 2 legacy keys: /posts/webdav-1/  /posts/webdav-1
INSERT INTO page_views (path, views)
	SELECT '/posts/17-webdav-1', views FROM page_views WHERE path IN ('/posts/webdav-1/', '/posts/webdav-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/17-webdav-1', visit_date FROM page_visitors WHERE path IN ('/posts/webdav-1/', '/posts/webdav-1');
DELETE FROM page_visitors WHERE path IN ('/posts/webdav-1/', '/posts/webdav-1');
DELETE FROM page_views WHERE path IN ('/posts/webdav-1/', '/posts/webdav-1');

-- Switch系统更新 | AMS | hekate
-- 2 legacy keys: /posts/2026-02-05-switch_ams_1/  /posts/2026-02-05-switch_ams_1
INSERT INTO page_views (path, views)
	SELECT '/posts/18-switch-ams-1', views FROM page_views WHERE path IN ('/posts/2026-02-05-switch_ams_1/', '/posts/2026-02-05-switch_ams_1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/18-switch-ams-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-02-05-switch_ams_1/', '/posts/2026-02-05-switch_ams_1');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-02-05-switch_ams_1/', '/posts/2026-02-05-switch_ams_1');
DELETE FROM page_views WHERE path IN ('/posts/2026-02-05-switch_ams_1/', '/posts/2026-02-05-switch_ams_1');

-- Cloudflare优选原理小记
-- 2 legacy keys: /posts/2026-02-06-cloudflare_1/  /posts/2026-02-06-cloudflare_1
INSERT INTO page_views (path, views)
	SELECT '/posts/19-cloudflare-1', views FROM page_views WHERE path IN ('/posts/2026-02-06-cloudflare_1/', '/posts/2026-02-06-cloudflare_1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/19-cloudflare-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-02-06-cloudflare_1/', '/posts/2026-02-06-cloudflare_1');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-02-06-cloudflare_1/', '/posts/2026-02-06-cloudflare_1');
DELETE FROM page_views WHERE path IN ('/posts/2026-02-06-cloudflare_1/', '/posts/2026-02-06-cloudflare_1');

-- Nintendo_Switch插件仓库列表 | AMS | RDP
-- 2 legacy keys: /posts/2026-02-08-switch_ams_2/  /posts/2026-02-08-switch_ams_2
INSERT INTO page_views (path, views)
	SELECT '/posts/20-switch-ams-2', views FROM page_views WHERE path IN ('/posts/2026-02-08-switch_ams_2/', '/posts/2026-02-08-switch_ams_2')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/20-switch-ams-2', visit_date FROM page_visitors WHERE path IN ('/posts/2026-02-08-switch_ams_2/', '/posts/2026-02-08-switch_ams_2');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-02-08-switch_ams_2/', '/posts/2026-02-08-switch_ams_2');
DELETE FROM page_views WHERE path IN ('/posts/2026-02-08-switch_ams_2/', '/posts/2026-02-08-switch_ams_2');

-- 静态网页的文章管理后端！| Decap-CMS | GitHub-OAuth
-- 2 legacy keys: /posts/2026-02-09-cms_1/  /posts/2026-02-09-cms_1
INSERT INTO page_views (path, views)
	SELECT '/posts/21-cms-1', views FROM page_views WHERE path IN ('/posts/2026-02-09-cms_1/', '/posts/2026-02-09-cms_1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/21-cms-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-02-09-cms_1/', '/posts/2026-02-09-cms_1');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-02-09-cms_1/', '/posts/2026-02-09-cms_1');
DELETE FROM page_views WHERE path IN ('/posts/2026-02-09-cms_1/', '/posts/2026-02-09-cms_1');

-- 家庭网络连接 | 路由器接入方式 | 旁路由上网 | Router
-- 2 legacy keys: /posts/2026-02-11-router_1/  /posts/2026-02-11-router_1
INSERT INTO page_views (path, views)
	SELECT '/posts/22-router-1', views FROM page_views WHERE path IN ('/posts/2026-02-11-router_1/', '/posts/2026-02-11-router_1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/22-router-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-02-11-router_1/', '/posts/2026-02-11-router_1');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-02-11-router_1/', '/posts/2026-02-11-router_1');
DELETE FROM page_views WHERE path IN ('/posts/2026-02-11-router_1/', '/posts/2026-02-11-router_1');

-- Folo创作者所有权认证文章
-- 2 legacy keys: /posts/2026-02-23-folo/  /posts/2026-02-23-folo
INSERT INTO page_views (path, views)
	SELECT '/posts/23-folo-1', views FROM page_views WHERE path IN ('/posts/2026-02-23-folo/', '/posts/2026-02-23-folo')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/23-folo-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-02-23-folo/', '/posts/2026-02-23-folo');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-02-23-folo/', '/posts/2026-02-23-folo');
DELETE FROM page_views WHERE path IN ('/posts/2026-02-23-folo/', '/posts/2026-02-23-folo');

-- 中科云数据胶囊——免费大容量的S3云笔记obsidian同步空间
-- 2 legacy keys: /posts/2026-02-24-s3-1/  /posts/2026-02-24-s3-1
INSERT INTO page_views (path, views)
	SELECT '/posts/24-s3-obsidian-1', views FROM page_views WHERE path IN ('/posts/2026-02-24-s3-1/', '/posts/2026-02-24-s3-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/24-s3-obsidian-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-02-24-s3-1/', '/posts/2026-02-24-s3-1');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-02-24-s3-1/', '/posts/2026-02-24-s3-1');
DELETE FROM page_views WHERE path IN ('/posts/2026-02-24-s3-1/', '/posts/2026-02-24-s3-1');

-- AstrBot部署 | Mac Mini | Docker容器化
-- 2 legacy keys: /posts/2026-02-26-astrbot-1/  /posts/2026-02-26-astrbot-1
INSERT INTO page_views (path, views)
	SELECT '/posts/25-astrbot-1', views FROM page_views WHERE path IN ('/posts/2026-02-26-astrbot-1/', '/posts/2026-02-26-astrbot-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/25-astrbot-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-02-26-astrbot-1/', '/posts/2026-02-26-astrbot-1');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-02-26-astrbot-1/', '/posts/2026-02-26-astrbot-1');
DELETE FROM page_views WHERE path IN ('/posts/2026-02-26-astrbot-1/', '/posts/2026-02-26-astrbot-1');

-- PVE虚拟系统与OpenWrt配置
-- 2 legacy keys: /posts/2026-03-07-pve-1/  /posts/2026-03-07-pve-1
INSERT INTO page_views (path, views)
	SELECT '/posts/26-pve-openwrt-1', views FROM page_views WHERE path IN ('/posts/2026-03-07-pve-1/', '/posts/2026-03-07-pve-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/26-pve-openwrt-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-03-07-pve-1/', '/posts/2026-03-07-pve-1');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-03-07-pve-1/', '/posts/2026-03-07-pve-1');
DELETE FROM page_views WHERE path IN ('/posts/2026-03-07-pve-1/', '/posts/2026-03-07-pve-1');

-- 安装Archlinux+ClaudeCode，PVE小主机焕发第二春
-- 2 legacy keys: /posts/archlinux-1/  /posts/archlinux-1
INSERT INTO page_views (path, views)
	SELECT '/posts/27-archlinux-1', views FROM page_views WHERE path IN ('/posts/archlinux-1/', '/posts/archlinux-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/27-archlinux-1', visit_date FROM page_visitors WHERE path IN ('/posts/archlinux-1/', '/posts/archlinux-1');
DELETE FROM page_visitors WHERE path IN ('/posts/archlinux-1/', '/posts/archlinux-1');
DELETE FROM page_views WHERE path IN ('/posts/archlinux-1/', '/posts/archlinux-1');

-- 笔记本重装Windows系统 | 软件推荐
-- 2 legacy keys: /posts/2026-03-17-windows-1/  /posts/2026-03-17-windows-1
INSERT INTO page_views (path, views)
	SELECT '/posts/28-windows-1', views FROM page_views WHERE path IN ('/posts/2026-03-17-windows-1/', '/posts/2026-03-17-windows-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/28-windows-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-03-17-windows-1/', '/posts/2026-03-17-windows-1');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-03-17-windows-1/', '/posts/2026-03-17-windows-1');
DELETE FROM page_views WHERE path IN ('/posts/2026-03-17-windows-1/', '/posts/2026-03-17-windows-1');

-- 【重置版】在Windows系统中安装深度学习框架Pytorch与TensorFlow
-- 2 legacy keys: /posts/pytorch-2/  /posts/pytorch-2
INSERT INTO page_views (path, views)
	SELECT '/posts/29-pytorch-2', views FROM page_views WHERE path IN ('/posts/pytorch-2/', '/posts/pytorch-2')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/29-pytorch-2', visit_date FROM page_visitors WHERE path IN ('/posts/pytorch-2/', '/posts/pytorch-2');
DELETE FROM page_visitors WHERE path IN ('/posts/pytorch-2/', '/posts/pytorch-2');
DELETE FROM page_views WHERE path IN ('/posts/pytorch-2/', '/posts/pytorch-2');

-- 通过Docker搭建Minecraft服务器 | MacMini、ArchLinux实战
-- 2 legacy keys: /posts/docker-mc/  /posts/docker-mc
INSERT INTO page_views (path, views)
	SELECT '/posts/30-docker-mc-1', views FROM page_views WHERE path IN ('/posts/docker-mc/', '/posts/docker-mc')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/30-docker-mc-1', visit_date FROM page_visitors WHERE path IN ('/posts/docker-mc/', '/posts/docker-mc');
DELETE FROM page_visitors WHERE path IN ('/posts/docker-mc/', '/posts/docker-mc');
DELETE FROM page_views WHERE path IN ('/posts/docker-mc/', '/posts/docker-mc');

-- LGnewUI-2 部署 | Docker | PHP | MySQL | Nginx | Certbot
-- 2 legacy keys: /posts/lgnewui2/  /posts/lgnewui2
INSERT INTO page_views (path, views)
	SELECT '/posts/31-lgnewui-2', views FROM page_views WHERE path IN ('/posts/lgnewui2/', '/posts/lgnewui2')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/31-lgnewui-2', visit_date FROM page_visitors WHERE path IN ('/posts/lgnewui2/', '/posts/lgnewui2');
DELETE FROM page_visitors WHERE path IN ('/posts/lgnewui2/', '/posts/lgnewui2');
DELETE FROM page_views WHERE path IN ('/posts/lgnewui2/', '/posts/lgnewui2');

-- 使用Spire.Doc将代码块插入Word文档中 | Python
-- 2 legacy keys: /posts/2026-04-16-srp-scripts-2/  /posts/2026-04-16-srp-scripts-2
INSERT INTO page_views (path, views)
	SELECT '/posts/32-spire-doc-1', views FROM page_views WHERE path IN ('/posts/2026-04-16-srp-scripts-2/', '/posts/2026-04-16-srp-scripts-2')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/32-spire-doc-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-04-16-srp-scripts-2/', '/posts/2026-04-16-srp-scripts-2');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-04-16-srp-scripts-2/', '/posts/2026-04-16-srp-scripts-2');
DELETE FROM page_views WHERE path IN ('/posts/2026-04-16-srp-scripts-2/', '/posts/2026-04-16-srp-scripts-2');

-- Docker部署自建Bitwarden密码管理器 | Nginx
-- 2 legacy keys: /posts/2026-04-18-bitwarden-1/  /posts/2026-04-18-bitwarden-1
INSERT INTO page_views (path, views)
	SELECT '/posts/33-bitwarden-1', views FROM page_views WHERE path IN ('/posts/2026-04-18-bitwarden-1/', '/posts/2026-04-18-bitwarden-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/33-bitwarden-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-04-18-bitwarden-1/', '/posts/2026-04-18-bitwarden-1');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-04-18-bitwarden-1/', '/posts/2026-04-18-bitwarden-1');
DELETE FROM page_views WHERE path IN ('/posts/2026-04-18-bitwarden-1/', '/posts/2026-04-18-bitwarden-1');

-- 使用Docker部署Umami统计服务 | Nginx | PostgreSQL
-- 2 legacy keys: /posts/umami-1/  /posts/umami-1
INSERT INTO page_views (path, views)
	SELECT '/posts/34-umami-1', views FROM page_views WHERE path IN ('/posts/umami-1/', '/posts/umami-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/34-umami-1', visit_date FROM page_visitors WHERE path IN ('/posts/umami-1/', '/posts/umami-1');
DELETE FROM page_visitors WHERE path IN ('/posts/umami-1/', '/posts/umami-1');
DELETE FROM page_views WHERE path IN ('/posts/umami-1/', '/posts/umami-1');

-- 树莓派Pico2W实现无线DualSense手柄(PS5)的满血功能 | Raspberry Pi | Play Station5
-- 2 legacy keys: /posts/2026-04-22-ps-ds5/  /posts/2026-04-22-ps-ds5
INSERT INTO page_views (path, views)
	SELECT '/posts/35-pico-ps5-1', views FROM page_views WHERE path IN ('/posts/2026-04-22-ps-ds5/', '/posts/2026-04-22-ps-ds5')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/35-pico-ps5-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-04-22-ps-ds5/', '/posts/2026-04-22-ps-ds5');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-04-22-ps-ds5/', '/posts/2026-04-22-ps-ds5');
DELETE FROM page_views WHERE path IN ('/posts/2026-04-22-ps-ds5/', '/posts/2026-04-22-ps-ds5');

-- Windows Defender 卸载程序 | Bluetooth Audio Receiver
-- 4 legacy keys: /posts/2026-05-07-windows-defender-%E5%8D%B8%E8%BD%BD%E7%A8%8B%E5%BA%8F-bluetooth-audio-receiver/  /posts/2026-05-07-windows-defender-%E5%8D%B8%E8%BD%BD%E7%A8%8B%E5%BA%8F-bluetooth-audio-receiver  /posts/2026-05-07-windows-defender-卸载程序-bluetooth-audio-receiver/  /posts/2026-05-07-windows-defender-卸载程序-bluetooth-audio-receiver
INSERT INTO page_views (path, views)
	SELECT '/posts/36-defender-bt-1', views FROM page_views WHERE path IN ('/posts/2026-05-07-windows-defender-%E5%8D%B8%E8%BD%BD%E7%A8%8B%E5%BA%8F-bluetooth-audio-receiver/', '/posts/2026-05-07-windows-defender-%E5%8D%B8%E8%BD%BD%E7%A8%8B%E5%BA%8F-bluetooth-audio-receiver', '/posts/2026-05-07-windows-defender-卸载程序-bluetooth-audio-receiver/', '/posts/2026-05-07-windows-defender-卸载程序-bluetooth-audio-receiver')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/36-defender-bt-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-05-07-windows-defender-%E5%8D%B8%E8%BD%BD%E7%A8%8B%E5%BA%8F-bluetooth-audio-receiver/', '/posts/2026-05-07-windows-defender-%E5%8D%B8%E8%BD%BD%E7%A8%8B%E5%BA%8F-bluetooth-audio-receiver', '/posts/2026-05-07-windows-defender-卸载程序-bluetooth-audio-receiver/', '/posts/2026-05-07-windows-defender-卸载程序-bluetooth-audio-receiver');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-05-07-windows-defender-%E5%8D%B8%E8%BD%BD%E7%A8%8B%E5%BA%8F-bluetooth-audio-receiver/', '/posts/2026-05-07-windows-defender-%E5%8D%B8%E8%BD%BD%E7%A8%8B%E5%BA%8F-bluetooth-audio-receiver', '/posts/2026-05-07-windows-defender-卸载程序-bluetooth-audio-receiver/', '/posts/2026-05-07-windows-defender-卸载程序-bluetooth-audio-receiver');
DELETE FROM page_views WHERE path IN ('/posts/2026-05-07-windows-defender-%E5%8D%B8%E8%BD%BD%E7%A8%8B%E5%BA%8F-bluetooth-audio-receiver/', '/posts/2026-05-07-windows-defender-%E5%8D%B8%E8%BD%BD%E7%A8%8B%E5%BA%8F-bluetooth-audio-receiver', '/posts/2026-05-07-windows-defender-卸载程序-bluetooth-audio-receiver/', '/posts/2026-05-07-windows-defender-卸载程序-bluetooth-audio-receiver');

-- ClaudeCode原生安装与使用 | Agent | CC-Switch
-- 2 legacy keys: /posts/agent-1/  /posts/agent-1
INSERT INTO page_views (path, views)
	SELECT '/posts/37-claudecode-1', views FROM page_views WHERE path IN ('/posts/agent-1/', '/posts/agent-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/37-claudecode-1', visit_date FROM page_visitors WHERE path IN ('/posts/agent-1/', '/posts/agent-1');
DELETE FROM page_visitors WHERE path IN ('/posts/agent-1/', '/posts/agent-1');
DELETE FROM page_views WHERE path IN ('/posts/agent-1/', '/posts/agent-1');

-- 在Windows上使用MSYS2+MinGW工具链 | gcc | gdb | cmake | make | Ninja | VScode
-- 2 legacy keys: /posts/msys/  /posts/msys
INSERT INTO page_views (path, views)
	SELECT '/posts/38-msys2-mingw-1', views FROM page_views WHERE path IN ('/posts/msys/', '/posts/msys')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/38-msys2-mingw-1', visit_date FROM page_visitors WHERE path IN ('/posts/msys/', '/posts/msys');
DELETE FROM page_visitors WHERE path IN ('/posts/msys/', '/posts/msys');
DELETE FROM page_views WHERE path IN ('/posts/msys/', '/posts/msys');

-- Claude Code Hub 部署 | Docker | Nginx
-- 2 legacy keys: /posts/cch/  /posts/cch
INSERT INTO page_views (path, views)
	SELECT '/posts/39-cch-docker-1', views FROM page_views WHERE path IN ('/posts/cch/', '/posts/cch')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/39-cch-docker-1', visit_date FROM page_visitors WHERE path IN ('/posts/cch/', '/posts/cch');
DELETE FROM page_visitors WHERE path IN ('/posts/cch/', '/posts/cch');
DELETE FROM page_views WHERE path IN ('/posts/cch/', '/posts/cch');

-- 在Nginx中快速建立一个下载站
-- 2 legacy keys: /posts/nginx-download/  /posts/nginx-download
INSERT INTO page_views (path, views)
	SELECT '/posts/40-nginx-download-1', views FROM page_views WHERE path IN ('/posts/nginx-download/', '/posts/nginx-download')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/40-nginx-download-1', visit_date FROM page_visitors WHERE path IN ('/posts/nginx-download/', '/posts/nginx-download');
DELETE FROM page_visitors WHERE path IN ('/posts/nginx-download/', '/posts/nginx-download');
DELETE FROM page_views WHERE path IN ('/posts/nginx-download/', '/posts/nginx-download');

-- SteamCommunity 302 | Steam/Discord/GitHub 网络加速
-- 2 legacy keys: /posts/2026-06-15-steam302-1/  /posts/2026-06-15-steam302-1
INSERT INTO page_views (path, views)
	SELECT '/posts/41-steam302-1', views FROM page_views WHERE path IN ('/posts/2026-06-15-steam302-1/', '/posts/2026-06-15-steam302-1')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/41-steam302-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-06-15-steam302-1/', '/posts/2026-06-15-steam302-1');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-06-15-steam302-1/', '/posts/2026-06-15-steam302-1');
DELETE FROM page_views WHERE path IN ('/posts/2026-06-15-steam302-1/', '/posts/2026-06-15-steam302-1');

-- Antigravity Proxy 解决系统代理的不可达性
-- 4 legacy keys: /posts/2026-06-26-antigravity-proxy-%E8%A7%A3%E5%86%B3%E7%B3%BB%E7%BB%9F%E4%BB%A3%E7%90%86%E7%9A%84%E4%B8%8D%E5%8F%AF%E8%BE%BE%E6%80%A7/  /posts/2026-06-26-antigravity-proxy-%E8%A7%A3%E5%86%B3%E7%B3%BB%E7%BB%9F%E4%BB%A3%E7%90%86%E7%9A%84%E4%B8%8D%E5%8F%AF%E8%BE%BE%E6%80%A7  /posts/2026-06-26-antigravity-proxy-解决系统代理的不可达性/  /posts/2026-06-26-antigravity-proxy-解决系统代理的不可达性
INSERT INTO page_views (path, views)
	SELECT '/posts/42-antigravity-proxy-1', views FROM page_views WHERE path IN ('/posts/2026-06-26-antigravity-proxy-%E8%A7%A3%E5%86%B3%E7%B3%BB%E7%BB%9F%E4%BB%A3%E7%90%86%E7%9A%84%E4%B8%8D%E5%8F%AF%E8%BE%BE%E6%80%A7/', '/posts/2026-06-26-antigravity-proxy-%E8%A7%A3%E5%86%B3%E7%B3%BB%E7%BB%9F%E4%BB%A3%E7%90%86%E7%9A%84%E4%B8%8D%E5%8F%AF%E8%BE%BE%E6%80%A7', '/posts/2026-06-26-antigravity-proxy-解决系统代理的不可达性/', '/posts/2026-06-26-antigravity-proxy-解决系统代理的不可达性')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/42-antigravity-proxy-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-06-26-antigravity-proxy-%E8%A7%A3%E5%86%B3%E7%B3%BB%E7%BB%9F%E4%BB%A3%E7%90%86%E7%9A%84%E4%B8%8D%E5%8F%AF%E8%BE%BE%E6%80%A7/', '/posts/2026-06-26-antigravity-proxy-%E8%A7%A3%E5%86%B3%E7%B3%BB%E7%BB%9F%E4%BB%A3%E7%90%86%E7%9A%84%E4%B8%8D%E5%8F%AF%E8%BE%BE%E6%80%A7', '/posts/2026-06-26-antigravity-proxy-解决系统代理的不可达性/', '/posts/2026-06-26-antigravity-proxy-解决系统代理的不可达性');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-06-26-antigravity-proxy-%E8%A7%A3%E5%86%B3%E7%B3%BB%E7%BB%9F%E4%BB%A3%E7%90%86%E7%9A%84%E4%B8%8D%E5%8F%AF%E8%BE%BE%E6%80%A7/', '/posts/2026-06-26-antigravity-proxy-%E8%A7%A3%E5%86%B3%E7%B3%BB%E7%BB%9F%E4%BB%A3%E7%90%86%E7%9A%84%E4%B8%8D%E5%8F%AF%E8%BE%BE%E6%80%A7', '/posts/2026-06-26-antigravity-proxy-解决系统代理的不可达性/', '/posts/2026-06-26-antigravity-proxy-解决系统代理的不可达性');
DELETE FROM page_views WHERE path IN ('/posts/2026-06-26-antigravity-proxy-%E8%A7%A3%E5%86%B3%E7%B3%BB%E7%BB%9F%E4%BB%A3%E7%90%86%E7%9A%84%E4%B8%8D%E5%8F%AF%E8%BE%BE%E6%80%A7/', '/posts/2026-06-26-antigravity-proxy-%E8%A7%A3%E5%86%B3%E7%B3%BB%E7%BB%9F%E4%BB%A3%E7%90%86%E7%9A%84%E4%B8%8D%E5%8F%AF%E8%BE%BE%E6%80%A7', '/posts/2026-06-26-antigravity-proxy-解决系统代理的不可达性/', '/posts/2026-06-26-antigravity-proxy-解决系统代理的不可达性');

-- nvidiaProfileInspector 一个高级的N卡控制面板
-- 4 legacy keys: /posts/2026-06-28-nvidiaprofileinspector-%E4%B8%80%E4%B8%AA%E9%AB%98%E7%BA%A7%E7%9A%84n%E5%8D%A1%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF/  /posts/2026-06-28-nvidiaprofileinspector-%E4%B8%80%E4%B8%AA%E9%AB%98%E7%BA%A7%E7%9A%84n%E5%8D%A1%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF  /posts/2026-06-28-nvidiaprofileinspector-一个高级的n卡控制面板/  /posts/2026-06-28-nvidiaprofileinspector-一个高级的n卡控制面板
INSERT INTO page_views (path, views)
	SELECT '/posts/43-nvidia-profile-1', views FROM page_views WHERE path IN ('/posts/2026-06-28-nvidiaprofileinspector-%E4%B8%80%E4%B8%AA%E9%AB%98%E7%BA%A7%E7%9A%84n%E5%8D%A1%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF/', '/posts/2026-06-28-nvidiaprofileinspector-%E4%B8%80%E4%B8%AA%E9%AB%98%E7%BA%A7%E7%9A%84n%E5%8D%A1%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF', '/posts/2026-06-28-nvidiaprofileinspector-一个高级的n卡控制面板/', '/posts/2026-06-28-nvidiaprofileinspector-一个高级的n卡控制面板')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/43-nvidia-profile-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-06-28-nvidiaprofileinspector-%E4%B8%80%E4%B8%AA%E9%AB%98%E7%BA%A7%E7%9A%84n%E5%8D%A1%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF/', '/posts/2026-06-28-nvidiaprofileinspector-%E4%B8%80%E4%B8%AA%E9%AB%98%E7%BA%A7%E7%9A%84n%E5%8D%A1%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF', '/posts/2026-06-28-nvidiaprofileinspector-一个高级的n卡控制面板/', '/posts/2026-06-28-nvidiaprofileinspector-一个高级的n卡控制面板');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-06-28-nvidiaprofileinspector-%E4%B8%80%E4%B8%AA%E9%AB%98%E7%BA%A7%E7%9A%84n%E5%8D%A1%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF/', '/posts/2026-06-28-nvidiaprofileinspector-%E4%B8%80%E4%B8%AA%E9%AB%98%E7%BA%A7%E7%9A%84n%E5%8D%A1%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF', '/posts/2026-06-28-nvidiaprofileinspector-一个高级的n卡控制面板/', '/posts/2026-06-28-nvidiaprofileinspector-一个高级的n卡控制面板');
DELETE FROM page_views WHERE path IN ('/posts/2026-06-28-nvidiaprofileinspector-%E4%B8%80%E4%B8%AA%E9%AB%98%E7%BA%A7%E7%9A%84n%E5%8D%A1%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF/', '/posts/2026-06-28-nvidiaprofileinspector-%E4%B8%80%E4%B8%AA%E9%AB%98%E7%BA%A7%E7%9A%84n%E5%8D%A1%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF', '/posts/2026-06-28-nvidiaprofileinspector-一个高级的n卡控制面板/', '/posts/2026-06-28-nvidiaprofileinspector-一个高级的n卡控制面板');

-- Intel-ax101板载网卡上网小记(Linux上网曲线救国) | OpenWrt | PVE
-- 2 legacy keys: /posts/ax101/  /posts/ax101
INSERT INTO page_views (path, views)
	SELECT '/posts/44-ax101-1', views FROM page_views WHERE path IN ('/posts/ax101/', '/posts/ax101')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/44-ax101-1', visit_date FROM page_visitors WHERE path IN ('/posts/ax101/', '/posts/ax101');
DELETE FROM page_visitors WHERE path IN ('/posts/ax101/', '/posts/ax101');
DELETE FROM page_views WHERE path IN ('/posts/ax101/', '/posts/ax101');

-- 在WSL上编译你的OpenWrt固件 | ImmortalWrt | WSL
-- 2 legacy keys: /posts/immortalwrt-build/  /posts/immortalwrt-build
INSERT INTO page_views (path, views)
	SELECT '/posts/45-immortalwrt-1', views FROM page_views WHERE path IN ('/posts/immortalwrt-build/', '/posts/immortalwrt-build')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/45-immortalwrt-1', visit_date FROM page_visitors WHERE path IN ('/posts/immortalwrt-build/', '/posts/immortalwrt-build');
DELETE FROM page_visitors WHERE path IN ('/posts/immortalwrt-build/', '/posts/immortalwrt-build');
DELETE FROM page_views WHERE path IN ('/posts/immortalwrt-build/', '/posts/immortalwrt-build');

-- Windows中的超级管理员Administrator开启方法 | 账户丢失 | 桌面丢失 | 密码忘却
-- 4 legacy keys: /posts/2026-07-12-windows%E4%B8%AD%E7%9A%84%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98administrator%E5%BC%80%E5%90%AF%E6%96%B9%E6%B3%95-%E8%B4%A6%E6%88%B7%E4%B8%A2%E5%A4%B1-%E6%A1%8C%E9%9D%A2%E4%B8%A2%E5%A4%B1-%E5%AF%86%E7%A0%81%E5%BF%98%E5%8D%B4/  /posts/2026-07-12-windows%E4%B8%AD%E7%9A%84%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98administrator%E5%BC%80%E5%90%AF%E6%96%B9%E6%B3%95-%E8%B4%A6%E6%88%B7%E4%B8%A2%E5%A4%B1-%E6%A1%8C%E9%9D%A2%E4%B8%A2%E5%A4%B1-%E5%AF%86%E7%A0%81%E5%BF%98%E5%8D%B4  /posts/2026-07-12-windows中的超级管理员administrator开启方法-账户丢失-桌面丢失-密码忘却/  /posts/2026-07-12-windows中的超级管理员administrator开启方法-账户丢失-桌面丢失-密码忘却
INSERT INTO page_views (path, views)
	SELECT '/posts/46-administrator-1', views FROM page_views WHERE path IN ('/posts/2026-07-12-windows%E4%B8%AD%E7%9A%84%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98administrator%E5%BC%80%E5%90%AF%E6%96%B9%E6%B3%95-%E8%B4%A6%E6%88%B7%E4%B8%A2%E5%A4%B1-%E6%A1%8C%E9%9D%A2%E4%B8%A2%E5%A4%B1-%E5%AF%86%E7%A0%81%E5%BF%98%E5%8D%B4/', '/posts/2026-07-12-windows%E4%B8%AD%E7%9A%84%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98administrator%E5%BC%80%E5%90%AF%E6%96%B9%E6%B3%95-%E8%B4%A6%E6%88%B7%E4%B8%A2%E5%A4%B1-%E6%A1%8C%E9%9D%A2%E4%B8%A2%E5%A4%B1-%E5%AF%86%E7%A0%81%E5%BF%98%E5%8D%B4', '/posts/2026-07-12-windows中的超级管理员administrator开启方法-账户丢失-桌面丢失-密码忘却/', '/posts/2026-07-12-windows中的超级管理员administrator开启方法-账户丢失-桌面丢失-密码忘却')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/46-administrator-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-07-12-windows%E4%B8%AD%E7%9A%84%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98administrator%E5%BC%80%E5%90%AF%E6%96%B9%E6%B3%95-%E8%B4%A6%E6%88%B7%E4%B8%A2%E5%A4%B1-%E6%A1%8C%E9%9D%A2%E4%B8%A2%E5%A4%B1-%E5%AF%86%E7%A0%81%E5%BF%98%E5%8D%B4/', '/posts/2026-07-12-windows%E4%B8%AD%E7%9A%84%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98administrator%E5%BC%80%E5%90%AF%E6%96%B9%E6%B3%95-%E8%B4%A6%E6%88%B7%E4%B8%A2%E5%A4%B1-%E6%A1%8C%E9%9D%A2%E4%B8%A2%E5%A4%B1-%E5%AF%86%E7%A0%81%E5%BF%98%E5%8D%B4', '/posts/2026-07-12-windows中的超级管理员administrator开启方法-账户丢失-桌面丢失-密码忘却/', '/posts/2026-07-12-windows中的超级管理员administrator开启方法-账户丢失-桌面丢失-密码忘却');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-07-12-windows%E4%B8%AD%E7%9A%84%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98administrator%E5%BC%80%E5%90%AF%E6%96%B9%E6%B3%95-%E8%B4%A6%E6%88%B7%E4%B8%A2%E5%A4%B1-%E6%A1%8C%E9%9D%A2%E4%B8%A2%E5%A4%B1-%E5%AF%86%E7%A0%81%E5%BF%98%E5%8D%B4/', '/posts/2026-07-12-windows%E4%B8%AD%E7%9A%84%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98administrator%E5%BC%80%E5%90%AF%E6%96%B9%E6%B3%95-%E8%B4%A6%E6%88%B7%E4%B8%A2%E5%A4%B1-%E6%A1%8C%E9%9D%A2%E4%B8%A2%E5%A4%B1-%E5%AF%86%E7%A0%81%E5%BF%98%E5%8D%B4', '/posts/2026-07-12-windows中的超级管理员administrator开启方法-账户丢失-桌面丢失-密码忘却/', '/posts/2026-07-12-windows中的超级管理员administrator开启方法-账户丢失-桌面丢失-密码忘却');
DELETE FROM page_views WHERE path IN ('/posts/2026-07-12-windows%E4%B8%AD%E7%9A%84%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98administrator%E5%BC%80%E5%90%AF%E6%96%B9%E6%B3%95-%E8%B4%A6%E6%88%B7%E4%B8%A2%E5%A4%B1-%E6%A1%8C%E9%9D%A2%E4%B8%A2%E5%A4%B1-%E5%AF%86%E7%A0%81%E5%BF%98%E5%8D%B4/', '/posts/2026-07-12-windows%E4%B8%AD%E7%9A%84%E8%B6%85%E7%BA%A7%E7%AE%A1%E7%90%86%E5%91%98administrator%E5%BC%80%E5%90%AF%E6%96%B9%E6%B3%95-%E8%B4%A6%E6%88%B7%E4%B8%A2%E5%A4%B1-%E6%A1%8C%E9%9D%A2%E4%B8%A2%E5%A4%B1-%E5%AF%86%E7%A0%81%E5%BF%98%E5%8D%B4', '/posts/2026-07-12-windows中的超级管理员administrator开启方法-账户丢失-桌面丢失-密码忘却/', '/posts/2026-07-12-windows中的超级管理员administrator开启方法-账户丢失-桌面丢失-密码忘却');

-- 在WSL中快速使用IndexTTS推理 | Python | TTS
-- 4 legacy keys: /posts/2026-07-18-%E5%9C%A8wsl%E4%B8%AD%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8indextts%E6%8E%A8%E7%90%86-python-tts/  /posts/2026-07-18-%E5%9C%A8wsl%E4%B8%AD%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8indextts%E6%8E%A8%E7%90%86-python-tts  /posts/2026-07-18-在wsl中快速使用indextts推理-python-tts/  /posts/2026-07-18-在wsl中快速使用indextts推理-python-tts
INSERT INTO page_views (path, views)
	SELECT '/posts/47-indextts-1', views FROM page_views WHERE path IN ('/posts/2026-07-18-%E5%9C%A8wsl%E4%B8%AD%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8indextts%E6%8E%A8%E7%90%86-python-tts/', '/posts/2026-07-18-%E5%9C%A8wsl%E4%B8%AD%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8indextts%E6%8E%A8%E7%90%86-python-tts', '/posts/2026-07-18-在wsl中快速使用indextts推理-python-tts/', '/posts/2026-07-18-在wsl中快速使用indextts推理-python-tts')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/47-indextts-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-07-18-%E5%9C%A8wsl%E4%B8%AD%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8indextts%E6%8E%A8%E7%90%86-python-tts/', '/posts/2026-07-18-%E5%9C%A8wsl%E4%B8%AD%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8indextts%E6%8E%A8%E7%90%86-python-tts', '/posts/2026-07-18-在wsl中快速使用indextts推理-python-tts/', '/posts/2026-07-18-在wsl中快速使用indextts推理-python-tts');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-07-18-%E5%9C%A8wsl%E4%B8%AD%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8indextts%E6%8E%A8%E7%90%86-python-tts/', '/posts/2026-07-18-%E5%9C%A8wsl%E4%B8%AD%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8indextts%E6%8E%A8%E7%90%86-python-tts', '/posts/2026-07-18-在wsl中快速使用indextts推理-python-tts/', '/posts/2026-07-18-在wsl中快速使用indextts推理-python-tts');
DELETE FROM page_views WHERE path IN ('/posts/2026-07-18-%E5%9C%A8wsl%E4%B8%AD%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8indextts%E6%8E%A8%E7%90%86-python-tts/', '/posts/2026-07-18-%E5%9C%A8wsl%E4%B8%AD%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8indextts%E6%8E%A8%E7%90%86-python-tts', '/posts/2026-07-18-在wsl中快速使用indextts推理-python-tts/', '/posts/2026-07-18-在wsl中快速使用indextts推理-python-tts');

-- 在WSL中安装ArchLinux并配置Dotfiles开启VibeCoding之旅 | WSL | ArchLinux | Dotfiles
-- 4 legacy keys: /posts/2026-07-25-%E5%9C%A8wsl%E4%B8%AD%E5%AE%89%E8%A3%85archlinux%E5%B9%B6%E9%85%8D%E7%BD%AEdotfiles%E5%BC%80%E5%90%AFvibecoding%E4%B9%8B%E6%97%85-wsl-archlinux-dotfiles/  /posts/2026-07-25-%E5%9C%A8wsl%E4%B8%AD%E5%AE%89%E8%A3%85archlinux%E5%B9%B6%E9%85%8D%E7%BD%AEdotfiles%E5%BC%80%E5%90%AFvibecoding%E4%B9%8B%E6%97%85-wsl-archlinux-dotfiles  /posts/2026-07-25-在wsl中安装archlinux并配置dotfiles开启vibecoding之旅-wsl-archlinux-dotfiles/  /posts/2026-07-25-在wsl中安装archlinux并配置dotfiles开启vibecoding之旅-wsl-archlinux-dotfiles
INSERT INTO page_views (path, views)
	SELECT '/posts/48-wsl-arch-1', views FROM page_views WHERE path IN ('/posts/2026-07-25-%E5%9C%A8wsl%E4%B8%AD%E5%AE%89%E8%A3%85archlinux%E5%B9%B6%E9%85%8D%E7%BD%AEdotfiles%E5%BC%80%E5%90%AFvibecoding%E4%B9%8B%E6%97%85-wsl-archlinux-dotfiles/', '/posts/2026-07-25-%E5%9C%A8wsl%E4%B8%AD%E5%AE%89%E8%A3%85archlinux%E5%B9%B6%E9%85%8D%E7%BD%AEdotfiles%E5%BC%80%E5%90%AFvibecoding%E4%B9%8B%E6%97%85-wsl-archlinux-dotfiles', '/posts/2026-07-25-在wsl中安装archlinux并配置dotfiles开启vibecoding之旅-wsl-archlinux-dotfiles/', '/posts/2026-07-25-在wsl中安装archlinux并配置dotfiles开启vibecoding之旅-wsl-archlinux-dotfiles')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/48-wsl-arch-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-07-25-%E5%9C%A8wsl%E4%B8%AD%E5%AE%89%E8%A3%85archlinux%E5%B9%B6%E9%85%8D%E7%BD%AEdotfiles%E5%BC%80%E5%90%AFvibecoding%E4%B9%8B%E6%97%85-wsl-archlinux-dotfiles/', '/posts/2026-07-25-%E5%9C%A8wsl%E4%B8%AD%E5%AE%89%E8%A3%85archlinux%E5%B9%B6%E9%85%8D%E7%BD%AEdotfiles%E5%BC%80%E5%90%AFvibecoding%E4%B9%8B%E6%97%85-wsl-archlinux-dotfiles', '/posts/2026-07-25-在wsl中安装archlinux并配置dotfiles开启vibecoding之旅-wsl-archlinux-dotfiles/', '/posts/2026-07-25-在wsl中安装archlinux并配置dotfiles开启vibecoding之旅-wsl-archlinux-dotfiles');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-07-25-%E5%9C%A8wsl%E4%B8%AD%E5%AE%89%E8%A3%85archlinux%E5%B9%B6%E9%85%8D%E7%BD%AEdotfiles%E5%BC%80%E5%90%AFvibecoding%E4%B9%8B%E6%97%85-wsl-archlinux-dotfiles/', '/posts/2026-07-25-%E5%9C%A8wsl%E4%B8%AD%E5%AE%89%E8%A3%85archlinux%E5%B9%B6%E9%85%8D%E7%BD%AEdotfiles%E5%BC%80%E5%90%AFvibecoding%E4%B9%8B%E6%97%85-wsl-archlinux-dotfiles', '/posts/2026-07-25-在wsl中安装archlinux并配置dotfiles开启vibecoding之旅-wsl-archlinux-dotfiles/', '/posts/2026-07-25-在wsl中安装archlinux并配置dotfiles开启vibecoding之旅-wsl-archlinux-dotfiles');
DELETE FROM page_views WHERE path IN ('/posts/2026-07-25-%E5%9C%A8wsl%E4%B8%AD%E5%AE%89%E8%A3%85archlinux%E5%B9%B6%E9%85%8D%E7%BD%AEdotfiles%E5%BC%80%E5%90%AFvibecoding%E4%B9%8B%E6%97%85-wsl-archlinux-dotfiles/', '/posts/2026-07-25-%E5%9C%A8wsl%E4%B8%AD%E5%AE%89%E8%A3%85archlinux%E5%B9%B6%E9%85%8D%E7%BD%AEdotfiles%E5%BC%80%E5%90%AFvibecoding%E4%B9%8B%E6%97%85-wsl-archlinux-dotfiles', '/posts/2026-07-25-在wsl中安装archlinux并配置dotfiles开启vibecoding之旅-wsl-archlinux-dotfiles/', '/posts/2026-07-25-在wsl中安装archlinux并配置dotfiles开启vibecoding之旅-wsl-archlinux-dotfiles');

-- 在Linux中创建一个可局域网共享的samba文件夹 | SMB
-- 4 legacy keys: /posts/2026-07-28-%E5%9C%A8linux%E4%B8%AD%E5%88%9B%E5%BB%BA%E4%B8%80%E4%B8%AA%E5%8F%AF%E5%B1%80%E5%9F%9F%E7%BD%91%E5%85%B1%E4%BA%AB%E7%9A%84samba%E6%96%87%E4%BB%B6%E5%A4%B9-smb/  /posts/2026-07-28-%E5%9C%A8linux%E4%B8%AD%E5%88%9B%E5%BB%BA%E4%B8%80%E4%B8%AA%E5%8F%AF%E5%B1%80%E5%9F%9F%E7%BD%91%E5%85%B1%E4%BA%AB%E7%9A%84samba%E6%96%87%E4%BB%B6%E5%A4%B9-smb  /posts/2026-07-28-在linux中创建一个可局域网共享的samba文件夹-smb/  /posts/2026-07-28-在linux中创建一个可局域网共享的samba文件夹-smb
INSERT INTO page_views (path, views)
	SELECT '/posts/49-linux-samba-1', views FROM page_views WHERE path IN ('/posts/2026-07-28-%E5%9C%A8linux%E4%B8%AD%E5%88%9B%E5%BB%BA%E4%B8%80%E4%B8%AA%E5%8F%AF%E5%B1%80%E5%9F%9F%E7%BD%91%E5%85%B1%E4%BA%AB%E7%9A%84samba%E6%96%87%E4%BB%B6%E5%A4%B9-smb/', '/posts/2026-07-28-%E5%9C%A8linux%E4%B8%AD%E5%88%9B%E5%BB%BA%E4%B8%80%E4%B8%AA%E5%8F%AF%E5%B1%80%E5%9F%9F%E7%BD%91%E5%85%B1%E4%BA%AB%E7%9A%84samba%E6%96%87%E4%BB%B6%E5%A4%B9-smb', '/posts/2026-07-28-在linux中创建一个可局域网共享的samba文件夹-smb/', '/posts/2026-07-28-在linux中创建一个可局域网共享的samba文件夹-smb')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/49-linux-samba-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-07-28-%E5%9C%A8linux%E4%B8%AD%E5%88%9B%E5%BB%BA%E4%B8%80%E4%B8%AA%E5%8F%AF%E5%B1%80%E5%9F%9F%E7%BD%91%E5%85%B1%E4%BA%AB%E7%9A%84samba%E6%96%87%E4%BB%B6%E5%A4%B9-smb/', '/posts/2026-07-28-%E5%9C%A8linux%E4%B8%AD%E5%88%9B%E5%BB%BA%E4%B8%80%E4%B8%AA%E5%8F%AF%E5%B1%80%E5%9F%9F%E7%BD%91%E5%85%B1%E4%BA%AB%E7%9A%84samba%E6%96%87%E4%BB%B6%E5%A4%B9-smb', '/posts/2026-07-28-在linux中创建一个可局域网共享的samba文件夹-smb/', '/posts/2026-07-28-在linux中创建一个可局域网共享的samba文件夹-smb');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-07-28-%E5%9C%A8linux%E4%B8%AD%E5%88%9B%E5%BB%BA%E4%B8%80%E4%B8%AA%E5%8F%AF%E5%B1%80%E5%9F%9F%E7%BD%91%E5%85%B1%E4%BA%AB%E7%9A%84samba%E6%96%87%E4%BB%B6%E5%A4%B9-smb/', '/posts/2026-07-28-%E5%9C%A8linux%E4%B8%AD%E5%88%9B%E5%BB%BA%E4%B8%80%E4%B8%AA%E5%8F%AF%E5%B1%80%E5%9F%9F%E7%BD%91%E5%85%B1%E4%BA%AB%E7%9A%84samba%E6%96%87%E4%BB%B6%E5%A4%B9-smb', '/posts/2026-07-28-在linux中创建一个可局域网共享的samba文件夹-smb/', '/posts/2026-07-28-在linux中创建一个可局域网共享的samba文件夹-smb');
DELETE FROM page_views WHERE path IN ('/posts/2026-07-28-%E5%9C%A8linux%E4%B8%AD%E5%88%9B%E5%BB%BA%E4%B8%80%E4%B8%AA%E5%8F%AF%E5%B1%80%E5%9F%9F%E7%BD%91%E5%85%B1%E4%BA%AB%E7%9A%84samba%E6%96%87%E4%BB%B6%E5%A4%B9-smb/', '/posts/2026-07-28-%E5%9C%A8linux%E4%B8%AD%E5%88%9B%E5%BB%BA%E4%B8%80%E4%B8%AA%E5%8F%AF%E5%B1%80%E5%9F%9F%E7%BD%91%E5%85%B1%E4%BA%AB%E7%9A%84samba%E6%96%87%E4%BB%B6%E5%A4%B9-smb', '/posts/2026-07-28-在linux中创建一个可局域网共享的samba文件夹-smb/', '/posts/2026-07-28-在linux中创建一个可局域网共享的samba文件夹-smb');

-- 在OpenWrt中搭建Zerotier双子网互通
-- 4 legacy keys: /posts/2026-07-28-%E5%9C%A8openwrt%E4%B8%AD%E6%90%AD%E5%BB%BAzerotier%E5%8F%8C%E5%AD%90%E7%BD%91%E4%BA%92%E9%80%9A/  /posts/2026-07-28-%E5%9C%A8openwrt%E4%B8%AD%E6%90%AD%E5%BB%BAzerotier%E5%8F%8C%E5%AD%90%E7%BD%91%E4%BA%92%E9%80%9A  /posts/2026-07-28-在openwrt中搭建zerotier双子网互通/  /posts/2026-07-28-在openwrt中搭建zerotier双子网互通
INSERT INTO page_views (path, views)
	SELECT '/posts/50-openwrt-zerotier-1', views FROM page_views WHERE path IN ('/posts/2026-07-28-%E5%9C%A8openwrt%E4%B8%AD%E6%90%AD%E5%BB%BAzerotier%E5%8F%8C%E5%AD%90%E7%BD%91%E4%BA%92%E9%80%9A/', '/posts/2026-07-28-%E5%9C%A8openwrt%E4%B8%AD%E6%90%AD%E5%BB%BAzerotier%E5%8F%8C%E5%AD%90%E7%BD%91%E4%BA%92%E9%80%9A', '/posts/2026-07-28-在openwrt中搭建zerotier双子网互通/', '/posts/2026-07-28-在openwrt中搭建zerotier双子网互通')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/50-openwrt-zerotier-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-07-28-%E5%9C%A8openwrt%E4%B8%AD%E6%90%AD%E5%BB%BAzerotier%E5%8F%8C%E5%AD%90%E7%BD%91%E4%BA%92%E9%80%9A/', '/posts/2026-07-28-%E5%9C%A8openwrt%E4%B8%AD%E6%90%AD%E5%BB%BAzerotier%E5%8F%8C%E5%AD%90%E7%BD%91%E4%BA%92%E9%80%9A', '/posts/2026-07-28-在openwrt中搭建zerotier双子网互通/', '/posts/2026-07-28-在openwrt中搭建zerotier双子网互通');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-07-28-%E5%9C%A8openwrt%E4%B8%AD%E6%90%AD%E5%BB%BAzerotier%E5%8F%8C%E5%AD%90%E7%BD%91%E4%BA%92%E9%80%9A/', '/posts/2026-07-28-%E5%9C%A8openwrt%E4%B8%AD%E6%90%AD%E5%BB%BAzerotier%E5%8F%8C%E5%AD%90%E7%BD%91%E4%BA%92%E9%80%9A', '/posts/2026-07-28-在openwrt中搭建zerotier双子网互通/', '/posts/2026-07-28-在openwrt中搭建zerotier双子网互通');
DELETE FROM page_views WHERE path IN ('/posts/2026-07-28-%E5%9C%A8openwrt%E4%B8%AD%E6%90%AD%E5%BB%BAzerotier%E5%8F%8C%E5%AD%90%E7%BD%91%E4%BA%92%E9%80%9A/', '/posts/2026-07-28-%E5%9C%A8openwrt%E4%B8%AD%E6%90%AD%E5%BB%BAzerotier%E5%8F%8C%E5%AD%90%E7%BD%91%E4%BA%92%E9%80%9A', '/posts/2026-07-28-在openwrt中搭建zerotier双子网互通/', '/posts/2026-07-28-在openwrt中搭建zerotier双子网互通');

-- Git的初始化配置，GitHub云平台GPG密钥 | SSH
-- 4 legacy keys: /posts/2026-08-02-git%E7%9A%84%E5%88%9D%E5%A7%8B%E5%8C%96%E9%85%8D%E7%BD%AEgithub%E4%BA%91%E5%B9%B3%E5%8F%B0gpg%E5%AF%86%E9%92%A5-ssh/  /posts/2026-08-02-git%E7%9A%84%E5%88%9D%E5%A7%8B%E5%8C%96%E9%85%8D%E7%BD%AEgithub%E4%BA%91%E5%B9%B3%E5%8F%B0gpg%E5%AF%86%E9%92%A5-ssh  /posts/2026-08-02-git的初始化配置github云平台gpg密钥-ssh/  /posts/2026-08-02-git的初始化配置github云平台gpg密钥-ssh
INSERT INTO page_views (path, views)
	SELECT '/posts/51-git-ssh-1', views FROM page_views WHERE path IN ('/posts/2026-08-02-git%E7%9A%84%E5%88%9D%E5%A7%8B%E5%8C%96%E9%85%8D%E7%BD%AEgithub%E4%BA%91%E5%B9%B3%E5%8F%B0gpg%E5%AF%86%E9%92%A5-ssh/', '/posts/2026-08-02-git%E7%9A%84%E5%88%9D%E5%A7%8B%E5%8C%96%E9%85%8D%E7%BD%AEgithub%E4%BA%91%E5%B9%B3%E5%8F%B0gpg%E5%AF%86%E9%92%A5-ssh', '/posts/2026-08-02-git的初始化配置github云平台gpg密钥-ssh/', '/posts/2026-08-02-git的初始化配置github云平台gpg密钥-ssh')
	ON CONFLICT(path) DO UPDATE SET views = views + excluded.views;
INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date)
	SELECT visitor_hash, '/posts/51-git-ssh-1', visit_date FROM page_visitors WHERE path IN ('/posts/2026-08-02-git%E7%9A%84%E5%88%9D%E5%A7%8B%E5%8C%96%E9%85%8D%E7%BD%AEgithub%E4%BA%91%E5%B9%B3%E5%8F%B0gpg%E5%AF%86%E9%92%A5-ssh/', '/posts/2026-08-02-git%E7%9A%84%E5%88%9D%E5%A7%8B%E5%8C%96%E9%85%8D%E7%BD%AEgithub%E4%BA%91%E5%B9%B3%E5%8F%B0gpg%E5%AF%86%E9%92%A5-ssh', '/posts/2026-08-02-git的初始化配置github云平台gpg密钥-ssh/', '/posts/2026-08-02-git的初始化配置github云平台gpg密钥-ssh');
DELETE FROM page_visitors WHERE path IN ('/posts/2026-08-02-git%E7%9A%84%E5%88%9D%E5%A7%8B%E5%8C%96%E9%85%8D%E7%BD%AEgithub%E4%BA%91%E5%B9%B3%E5%8F%B0gpg%E5%AF%86%E9%92%A5-ssh/', '/posts/2026-08-02-git%E7%9A%84%E5%88%9D%E5%A7%8B%E5%8C%96%E9%85%8D%E7%BD%AEgithub%E4%BA%91%E5%B9%B3%E5%8F%B0gpg%E5%AF%86%E9%92%A5-ssh', '/posts/2026-08-02-git的初始化配置github云平台gpg密钥-ssh/', '/posts/2026-08-02-git的初始化配置github云平台gpg密钥-ssh');
DELETE FROM page_views WHERE path IN ('/posts/2026-08-02-git%E7%9A%84%E5%88%9D%E5%A7%8B%E5%8C%96%E9%85%8D%E7%BD%AEgithub%E4%BA%91%E5%B9%B3%E5%8F%B0gpg%E5%AF%86%E9%92%A5-ssh/', '/posts/2026-08-02-git%E7%9A%84%E5%88%9D%E5%A7%8B%E5%8C%96%E9%85%8D%E7%BD%AEgithub%E4%BA%91%E5%B9%B3%E5%8F%B0gpg%E5%AF%86%E9%92%A5-ssh', '/posts/2026-08-02-git的初始化配置github云平台gpg密钥-ssh/', '/posts/2026-08-02-git的初始化配置github云平台gpg密钥-ssh');

-- ---------------------------------------------------------------------------
-- Re-derive the materialised site counters from the raw tables (identical to
-- the service's own `recount()`); this also repairs any drift.
-- ---------------------------------------------------------------------------
UPDATE site_stats SET value = (SELECT COALESCE(SUM(views), 0) FROM page_views) WHERE key = 'total_views';
UPDATE site_stats SET value = (SELECT COUNT(*) FROM site_visitors) WHERE key = 'total_visitors';
