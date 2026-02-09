/**
 * IndexNow自动提交脚本
 * 从sitemap解析URL，检测新增URL并提交到IndexNow API
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, existsSync } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== 配置区域 ====================
const CONFIG = {
  // IndexNow配置
  indexNow: {
    key: 'e6d05f27754c43a6b547e1df433311df',
    host: 'blog.srprolin.top',
    apiUrl: 'https://api.indexnow.org/indexnow',
    batchSize: 10000, // 每次最多提交的URL数量
  },

  // 文件路径配置
  paths: {
    distDir: 'dist',
    lastUrlsFile: '.last-urls.json',
  },
};
// ================================================

/**
 * 从sitemap文件中提取所有URL
 */
async function extractUrlsFromSitemap(sitemapPath) {
  const content = await readFile(sitemapPath, 'utf-8');
  const urlRegex = /<loc>(.*?)<\/loc>/g;
  const urls = [];
  let match;

  while ((match = urlRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }

  return urls.sort();
}

/**
 * 查找dist目录下的sitemap文件
 */
async function findSitemap() {
  const files = await readdir(CONFIG.paths.distDir);
  const sitemapFile = files.find(f => f.startsWith('sitemap') && f.endsWith('.xml'));
  return sitemapFile ? join(CONFIG.paths.distDir, sitemapFile) : null;
}

/**
 * 加载上次保存的URL列表
 */
async function loadLastUrls() {
  const lastUrlsPath = join(process.cwd(), CONFIG.paths.lastUrlsFile);

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
 * 保存当前URL列表
 */
async function saveUrls(urls) {
  const lastUrlsPath = join(process.cwd(), CONFIG.paths.lastUrlsFile);
  await writeFile(lastUrlsPath, JSON.stringify({ urls, timestamp: Date.now() }, null, 2));
}

/**
 * 获取新增的URL
 */
function getNewUrls(currentUrls, lastUrls) {
  const lastUrlsSet = new Set(lastUrls);
  return currentUrls.filter(url => !lastUrlsSet.has(url));
}

/**
 * 提交URL到IndexNow API
 */
async function submitToIndexNow(urls) {
  const { key, host, apiUrl, batchSize } = CONFIG.indexNow;
  const keyLocation = `https://${host}/${key}.txt`;

  // 分批提交
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
    console.log(`站点: ${CONFIG.indexNow.host}\n`);

    // 查找sitemap文件
    const sitemapPath = await findSitemap();
    if (!sitemapPath) {
      console.error('错误: 在dist目录下未找到sitemap文件');
      process.exit(1);
    }

    console.log(`使用sitemap文件: ${sitemapPath}`);

    // 提取当前所有URL
    const currentUrls = await extractUrlsFromSitemap(sitemapPath);
    console.log(`当前共有 ${currentUrls.length} 个URL\n`);

    // 加载上次的URL列表
    const lastUrls = await loadLastUrls();
    console.log(`上次记录: ${lastUrls.length} 个URL`);

    // 计算新增URL
    const newUrls = getNewUrls(currentUrls, lastUrls);

    if (newUrls.length === 0) {
      console.log('\n没有新URL，跳过提交');
      // 仍然保存当前URL列表以保持最新状态
      await saveUrls(currentUrls);
      console.log('已更新URL记录');
      process.exit(0);
    }

    console.log(`\n发现 ${newUrls.length} 个新URL:`);
    newUrls.slice(0, 10).forEach(url => console.log(`  + ${url}`));
    if (newUrls.length > 10) {
      console.log(`  ... 还有 ${newUrls.length - 10} 个`);
    }

    // 提交新URL到IndexNow
    await submitToIndexNow(newUrls);

    // 保存完整URL列表供下次比较
    await saveUrls(currentUrls);

    console.log('\n完成! 已更新URL记录');
  } catch (error) {
    console.error('发生错误:', error);
    process.exit(1);
  }
}

main();
