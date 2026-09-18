/**
 * IndexNow 自动提交脚本
 * 从 sitemap 解析 URL，检测新增 URL 并直接提交到 IndexNow API。
 * 配置直接引用 src/config/site.ts 中的 siteConfig.seo.indexNow。
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { siteConfig } from '../src/config/site.ts';

// 直接引用 siteConfig 中的配置，不保留重复的硬编码默认值
const host = new URL(siteConfig.url).hostname;
const indexNowConfig = siteConfig.seo?.indexNow;

const CONFIG = {
  enabled: indexNowConfig?.enabled ?? true,
  key: process.env.INDEXNOW_KEY || indexNowConfig?.key || '',
  host: process.env.INDEXNOW_HOST || host,
  apiUrl: process.env.INDEXNOW_API_URL || indexNowConfig?.apiUrl || 'https://api.indexnow.org/indexnow',
  batchSize: indexNowConfig?.batchSize || 10000,
  outDir: 'out',
  lastUrlsFile: '.last-urls.json',
};

/**
 * XML entity unescape + canonical single-pass percent-encoding.
 */
function normalizeSitemapUrl(rawUrl) {
  const decoded = rawUrl
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  try {
    return encodeURI(decodeURI(decoded));
  } catch {
    return decoded;
  }
}

/**
 * 仅提交本站域名下的 URL
 */
function isOwnHost(url) {
  return url.startsWith(`https://${CONFIG.host}/`) || url.startsWith(`http://${CONFIG.host}/`);
}

/**
 * 从 sitemap 文件中提取所有 URL
 */
async function extractUrlsFromSitemap(sitemapPath) {
  const content = await readFile(sitemapPath, 'utf-8');
  const urlRegex = /<loc>(.*?)<\/loc>/g;
  const urls = [];
  let match;

  while ((match = urlRegex.exec(content)) !== null) {
    urls.push(normalizeSitemapUrl(match[1]));
  }

  return urls.sort();
}

/**
 * 查找 out 目录下的 sitemap 文件
 */
async function findSitemap() {
  if (!existsSync(CONFIG.outDir)) {
    return null;
  }
  const files = await readdir(CONFIG.outDir);
  const sitemapFile =
    files.find((f) => f === 'sitemap.xml') ??
    files.find((f) => f.startsWith('sitemap') && f.endsWith('.xml'));
  return sitemapFile ? join(CONFIG.outDir, sitemapFile) : null;
}

/**
 * 加载上次保存的 URL 列表
 */
async function loadLastUrls() {
  const lastUrlsPath = join(process.cwd(), CONFIG.lastUrlsFile);

  if (!existsSync(lastUrlsPath)) {
    return [];
  }

  try {
    const content = await readFile(lastUrlsPath, 'utf-8');
    const data = JSON.parse(content);
    return data.urls || [];
  } catch {
    return [];
  }
}

/**
 * 保存当前 URL 列表
 */
async function saveUrls(urls) {
  const lastUrlsPath = join(process.cwd(), CONFIG.lastUrlsFile);
  await writeFile(lastUrlsPath, JSON.stringify({ urls, timestamp: Date.now() }, null, 2));
}

/**
 * 获取新增的 URL
 */
function getNewUrls(currentUrls, lastUrls) {
  const lastUrlsSet = new Set(lastUrls);
  return currentUrls.filter(url => !lastUrlsSet.has(url));
}

/**
 * 提交 URL 到 IndexNow API
 */
async function submitToIndexNow(urls) {
  const { key, host, apiUrl, batchSize } = CONFIG;
  const keyLocation = `https://${host}/${key}.txt`;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);

    console.log(`\n提交第 ${Math.floor(i / batchSize) + 1} 批 (${batch.length} 个URL)...`);

    const payload = {
      host,
      key,
      keyLocation,
      urlList: batch,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`✓ 提交成功`);
      } else {
        console.error(`✗ 提交失败: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('错误详情:', errorText);
      }
    } catch (error) {
      console.error(`✗ 提交出错:`, error.message);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('IndexNow 自动提交脚本');
    console.log('======================\n');

    if (!CONFIG.enabled) {
      console.log('IndexNow 未启用 (siteConfig.seo.indexNow.enabled = false)，跳过提交。');
      process.exit(0);
    }

    if (!CONFIG.key) {
      console.error('错误: siteConfig.seo.indexNow.key 为空，无法提交。');
      process.exit(1);
    }

    console.log(`站点: ${CONFIG.host}`);
    console.log(`Key: ${CONFIG.key}\n`);

    // 查找 sitemap 文件
    const sitemapPath = await findSitemap();
    if (!sitemapPath) {
      console.error(`错误: 在 ${CONFIG.outDir} 目录下未找到 sitemap 文件`);
      process.exit(1);
    }

    console.log(`使用 sitemap 文件: ${sitemapPath}`);

    // 提取当前所有 URL（仅保留本站域名，防止误提交外链）
    const sitemapUrls = await extractUrlsFromSitemap(sitemapPath);
    const currentUrls = sitemapUrls.filter(isOwnHost);
    if (currentUrls.length !== sitemapUrls.length) {
      console.log(`已过滤 ${sitemapUrls.length - currentUrls.length} 个非本站域名 URL\n`);
    }
    console.log(`当前共有 ${currentUrls.length} 个 URL\n`);

    // 加载上次的 URL 列表
    const lastUrls = await loadLastUrls();
    console.log(`上次记录: ${lastUrls.length} 个 URL`);

    // 计算新增 URL
    const newUrls = getNewUrls(currentUrls, lastUrls);

    // 检查 URL 列表是否有变化（新增或删除）
    const hasChanges = newUrls.length > 0 || currentUrls.length !== lastUrls.length;

    if (!hasChanges) {
      console.log('\n没有 URL 变化，跳过提交');
      process.exit(0);
    }

    if (newUrls.length === 0) {
      console.log('\n没有新 URL（但有 URL 被删除），跳过 IndexNow 提交');
    } else {
      console.log(`\n发现 ${newUrls.length} 个新 URL:`);
      newUrls.slice(0, 10).forEach(url => console.log(`  + ${url}`));
      if (newUrls.length > 10) {
        console.log(`  ... 还有 ${newUrls.length - 10} 个`);
      }

      // 提交新 URL 到 IndexNow
      await submitToIndexNow(newUrls);
    }

    // 保存完整 URL 列表供下次比较
    await saveUrls(currentUrls);

    console.log('\n完成! 已更新 URL 记录');
  } catch (error) {
    console.error('发生错误:', error);
    process.exit(1);
  }
}

main();
