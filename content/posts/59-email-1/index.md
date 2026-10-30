---
title: 借助cloudflare+resend搭建最简域名邮箱
published: 2026-10-26
updated: 2026-10-27
pinned: false
description: 在网站上展示与网站域名相同的邮箱地址，是较为可信的做法，因此萌生搭建一个简易域名邮箱的收发服务，好在cloudflare+resend可以免费提供相应支持，只需稍加操作。
image: ''
tags: []
draft: false
---

# 话在前头

本文只涉及到一个最简易的收、发邮件服务，且只加一个域名的外壳，如果你需要的是一个免费的全面邮件管理系统，请看这个开源项目：[maillab/cloud-mail](https://github.com/maillab/cloud-mail)

# 域名邮件接收

可以有两种方案，一种是由[resend](https://resend.com/)全面接管，目前是支持**收**、**发**的两种服务，提供一定的免费额度；另一种就是通过cloudflare的[邮件服务](https://www.cloudflare.com/zh-cn/developer-platform/products/email-routing/)，当前只免费转发邮件，也就是只解决**收**，发送邮件需要付费购买计划。

笔者使用cloudflare收邮件的方式，在域名接入cloudflare的DNS之后，在**电子邮件路由**处可以设置域名邮箱，真实收件地址需要在**目标地址**处进行验证，然后设置**路由规则**即可选择将域名邮件发送到哪里。

# 域名邮件发送

这里需要将域名也接入**resend**的服务，在resend配置域名，自动由cloudflare设置DNS，然后创建一个API-Key。

当在上一步使用cloudflare转发邮件后，笔者以gmail为例，在**设置**->**账号和导入**->**添加其他电子邮件地址**，然后设置[resend的smtp服务器](https://resend.com/settings/smtp)和身份即可。

# 飞书webhook

现代社会邮件不再是唯一信息渠道，因此设置一个应用提醒其实还挺必要的，这时候就体现了cloudflare的好处，在**路由规则**中可以将域名邮件处理指向**workers**，workers可以理解成一个边缘js脚本，我们可以借助代码进行邮件信息提醒，比如这里：

```js

function decodeSubject(subject) {
  if (!subject) return "(无主题)";

  const normalized = subject.replace(/\r?\n[ \t]+/g, " ");

  return normalized.replace(
    /=\?([^?]+)\?([bq])\?([^?]*)\?=/gi,
    (match, charset, encoding, value) => {
      try {
        let bytes;

        if (encoding.toLowerCase() === "b") {
          const binary = atob(value);
          bytes = Uint8Array.from(
            binary,
            (char) => char.charCodeAt(0)
          );
        } else {
          const input = value.replace(/_/g, " ");
          const output = [];

          for (let i = 0; i < input.length; i++) {
            if (
              input[i] === "=" &&
              /^[0-9a-f]{2}$/i.test(input.slice(i + 1, i + 3))
            ) {
              output.push(
                parseInt(input.slice(i + 1, i + 3), 16)
              );
              i += 2;
            } else {
              const code = input.charCodeAt(i);

              if (code > 255) {
                return match;
              }

              output.push(code);
            }
          }

          bytes = new Uint8Array(output);
        }

        return new TextDecoder(charset).decode(bytes);
      } catch (error) {
        console.error("Subject decode failed:", charset, error);
        return match;
      }
    }
  ).trim();
}

export default {
  async email(message, env, ctx) {
    const rawSubject = message.headers.get("subject") || "";
    const subject = decodeSubject(rawSubject);
    const date =
      message.headers.get("date") || new Date().toUTCString();

    const notification = [
      "📧 收到新的联系邮件",
      `发件人：${message.from}`,
      `收件人：${message.to}`,
      `主题：${subject}`,
      `时间：${date}`,
    ].join("\n");

    try {
      if (!env.FEISHU_WEBHOOK_URL) {
        throw new Error("FEISHU_WEBHOOK_URL 未配置");
      }

      const response = await fetch(env.FEISHU_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          msg_type: "text",
          content: {
            text: notification,
          },
        }),
      });

      const result = await response.text();

      if (!response.ok) {
        console.error(
          "Feishu HTTP error:",
          response.status,
          result
        );
      } else {
        console.log("Feishu response:", result);
      }
    } catch (error) {
      console.error("Feishu notification failed:", error);
    }

    try {
      if (!env.GMAIL_FORWARD_TO) {
        throw new Error("GMAIL_FORWARD_TO 未配置");
      }

      await message.forward(env.GMAIL_FORWARD_TO);
      console.log("Email forwarded to Gmail");
    } catch (error) {
      console.error("Gmail forwarding failed:", error);
      throw error;
    }
  },
};
```

这里需要在worker后台的设置中，配置环境变量(推荐密钥方式)：

- `FEISHU_WEBHOOK_URL`: 飞书群机器人的webhook地址
- `GMAIL_FORWARD_TO`: 真实已验证邮件地址

如此设置之后，就会在收到域名邮件时，获得飞书机器人的通知。
