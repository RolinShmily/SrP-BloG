import fs from "node:fs";
import path from "node:path";

interface ExportedPage {
  file: string;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  h1Count: number;
  imagesWithoutAlt: number;
  imagesWithEmptyAlt: number;
}

const outputDir = path.join(process.cwd(), "out");
const errors: string[] = [];

function collectHtmlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectHtmlFiles(entryPath));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(entryPath);
  }
  return files;
}

function capture(html: string, expression: RegExp): string {
  return html.match(expression)?.[1]?.trim() || "";
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

function findDuplicates(pages: ExportedPage[], key: "title" | "description" | "canonical") {
  const values = new Map<string, string[]>();
  for (const page of pages) {
    const value = normalize(page[key]);
    if (!value) continue;
    values.set(value, [...(values.get(value) || []), page.file]);
  }
  return [...values].filter(([, files]) => files.length > 1);
}

function verifySeoExport(): void {
  const htmlFiles = collectHtmlFiles(outputDir);
  if (htmlFiles.length === 0) {
    throw new Error("No exported HTML found in out/. Run `pnpm build` first.");
  }

  const pages: ExportedPage[] = htmlFiles.map((file) => {
    const html = fs.readFileSync(file, "utf8");
    const imageTags = html.match(/<img\b[^>]*>/gi) || [];
    const imagesWithoutAlt = imageTags.filter((image) => !/\balt\s*=/.test(image));
    const imagesWithEmptyAlt = imageTags.filter((image) => /\balt\s*=\s*(["'])\s*\1/.test(image));

    return {
      file: path.relative(outputDir, file),
      title: capture(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      description: capture(html, /<meta\s+name="description"\s+content="([^"]*)"/i),
      canonical: capture(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i),
      robots: capture(html, /<meta\s+name="robots"\s+content="([^"]*)"/i),
      h1Count: (html.match(/<h1\b/g) || []).length,
      imagesWithoutAlt: imagesWithoutAlt.length,
      imagesWithEmptyAlt: imagesWithEmptyAlt.length,
    };
  });

  const indexable = pages.filter((page) => !/noindex/i.test(page.robots));
  for (const page of indexable) {
    if (!page.title) errors.push(`${page.file}: missing <title>`);
    if (!page.description) errors.push(`${page.file}: missing meta description`);
    if (!page.canonical) errors.push(`${page.file}: missing canonical URL`);
    if (page.h1Count !== 1) errors.push(`${page.file}: expected one H1, found ${page.h1Count}`);
    if (page.imagesWithoutAlt > 0) {
      errors.push(`${page.file}: ${page.imagesWithoutAlt} image(s) missing an alt attribute`);
    }
    if (page.imagesWithEmptyAlt > 0) {
      errors.push(`${page.file}: ${page.imagesWithEmptyAlt} image(s) have empty alt text`);
    }
  }

  for (const key of ["title", "description", "canonical"] as const) {
    for (const [value, files] of findDuplicates(indexable, key)) {
      errors.push(`duplicate ${key} across ${files.length} indexable pages: ${value}`);
    }
  }

  const sitemapPath = path.join(outputDir, "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) {
    errors.push("out/sitemap.xml is missing");
  } else {
    const sitemap = fs.readFileSync(sitemapPath, "utf8");
    const sitemapUrls = new Set(
      [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim())
    );
    for (const page of indexable) {
      if (!sitemapUrls.has(page.canonical)) {
        errors.push(`${page.file}: canonical URL is absent from sitemap (${page.canonical})`);
      }
    }
    for (const url of sitemapUrls) {
      if (!indexable.some((page) => page.canonical === url)) {
        errors.push(`sitemap URL has no indexable exported page: ${url}`);
      }
    }
  }

  let jsonLdCount = 0;
  let invalidJsonLdCount = 0;
  for (const page of pages) {
    const file = path.join(outputDir, page.file);
    const html = fs.readFileSync(file, "utf8");
    for (const match of html.matchAll(
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    )) {
      jsonLdCount++;
      try {
        JSON.parse(match[1]);
      } catch (error) {
        invalidJsonLdCount++;
        const reason = error instanceof Error ? error.message : String(error);
        errors.push(`${page.file}: invalid JSON-LD (${reason})`);
      }
    }
  }

  const adminPage = pages.find((page) => page.file === path.join("admin", "index.html"));
  if (adminPage && !/noindex/i.test(adminPage.robots)) {
    errors.push("admin/index.html must be marked noindex");
  }

  console.log(`Exported HTML: ${pages.length}; indexable pages: ${indexable.length}`);
  console.log(`Sitemap URLs: ${fs.existsSync(sitemapPath) ? (fs.readFileSync(sitemapPath, "utf8").match(/<loc>/g) || []).length : 0}`);
  console.log(`Valid JSON-LD blocks: ${jsonLdCount - invalidJsonLdCount}/${jsonLdCount}`);
  console.log(`Pages with short descriptions (<60 characters, advisory): ${indexable.filter((page) => [...page.description].length < 60).length}`);

  if (errors.length > 0) {
    console.error(`SEO export verification failed with ${errors.length} issue(s):`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log("SEO export verification passed.");
}

verifySeoExport();
