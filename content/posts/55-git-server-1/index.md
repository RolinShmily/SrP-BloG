---
title: 部署一个简单的git-server用来存放私有代码
published: 2026-10-18
updated: 2026-10-18
pinned: false
description: 通过git-master官方中文指南，在VPS上部署一个简单的git-server存放私有代码，方便多设备之间的拉取推送，进行本地测试、上线部署。
image: ''
tags:
  - git
  - vps
  - ssh
draft: false
---

# 相关链接

- [服务器上的 Git - 配置服务器](https://git-scm.com/book/zh/v2/%e6%9c%8d%e5%8a%a1%e5%99%a8%e4%b8%8a%e7%9a%84-Git-%e9%85%8d%e7%bd%ae%e6%9c%8d%e5%8a%a1%e5%99%a8)

# 直接操作

```zsh
# 创建git专用账号(使用命令获取git-shell的路径)
sudo useradd -m -s "$(command -v git-shell)" git
# 设置git用户为无密码用户
sudo usermod -p '*' git
# 使用git身份创建git的ssh目录，并设置权限700
sudo -u git mkdir -p -m 700 /home/git/.ssh
# 创建authorized_keys并填入允许的公钥 
sudo -u git touch /home/git/.ssh/authorized_keys
sudo chmod 600 /home/git/.ssh/authorized_keys
# 创建一个初始仓库
sudo -u git git init --bare --initial-branch=main /home/git/repos/example.git
```

对于工作设备推送初始代码至此：

```zsh
git remote add origin git@server-address:repos/example.git
git push -u origin main
```

# SSH默认端口问题

`git push` 时的默认端口是22，但如果我们更改过默认端口，则可以对Host进行特殊配置：

```zsh
# 修改ssh配置
vim ~/.ssh/config
```

最简编辑如下（将server-address替换成你VPS的ip或者域名）：

```txt
Host server-address
	Port <your-real-port>
```
