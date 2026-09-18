/**
 * Prebuild / build step: synchronizes or purges CMS admin assets (`public/admin/`
 * and `out/admin/`) based on `siteConfig.cms.enabled`.
 *
 * - When `siteConfig.cms.enabled === true`:
 *   Copies `src/admin/index.html` and `src/admin/config.yml` into `public/admin/`,
 *   ensuring the OAuth base URL and repository match `siteConfig`.
 *
 * - When `siteConfig.cms.enabled === false`:
 *   Completely deletes `public/admin/` and `out/admin/` so that visiting `/admin`
 *   or `/admin/` immediately returns 404 on both local dev and Cloudflare Workers.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { siteConfig } from "../src/config/site";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const srcAdminDir = path.join(rootDir, "src", "admin");
const publicAdminDir = path.join(rootDir, "public", "admin");
const outAdminDir = path.join(rootDir, "out", "admin");

export function syncCmsAssets() {
  const isEnabled = siteConfig.cms?.enabled ?? true;

  if (isEnabled) {
    if (!fs.existsSync(srcAdminDir)) {
      console.warn(`[sync-cms-assets] Source directory ${srcAdminDir} not found.`);
      return;
    }

    fs.mkdirSync(publicAdminDir, { recursive: true });

    // 1. Copy index.html
    const srcIndex = path.join(srcAdminDir, "index.html");
    const destIndex = path.join(publicAdminDir, "index.html");
    if (fs.existsSync(srcIndex)) {
      fs.copyFileSync(srcIndex, destIndex);
    }

    // 2. Process & sync config.yml
    const srcConfig = path.join(srcAdminDir, "config.yml");
    const destConfig = path.join(publicAdminDir, "config.yml");
    if (fs.existsSync(srcConfig)) {
      let configContent = fs.readFileSync(srcConfig, "utf8");

      // Inject dynamic settings from siteConfig if present
      if (siteConfig.cms?.oauthBaseUrl) {
        configContent = configContent.replace(
          /base_url:\s*.+/,
          `base_url: ${siteConfig.cms.oauthBaseUrl}`
        );
      }
      if (siteConfig.url) {
        configContent = configContent
          .replace(/site_url:\s*.+/, `site_url: ${siteConfig.url}`)
          .replace(/display_url:\s*.+/, `display_url: ${siteConfig.url}`);
      }

      fs.writeFileSync(destConfig, configContent, "utf8");
    }

    console.log("[sync-cms-assets] Sveltia CMS enabled: synced admin portal to public/admin/");
  } else {
    // Purge public/admin and out/admin to strictly block the /admin route
    let purged = false;
    if (fs.existsSync(publicAdminDir)) {
      fs.rmSync(publicAdminDir, { recursive: true, force: true });
      purged = true;
    }
    if (fs.existsSync(outAdminDir)) {
      fs.rmSync(outAdminDir, { recursive: true, force: true });
      purged = true;
    }

    if (purged) {
      console.log("[sync-cms-assets] Sveltia CMS disabled: purged public/admin/ and out/admin/ (/admin blocked -> 404)");
    } else {
      console.log("[sync-cms-assets] Sveltia CMS disabled: /admin route is blocked (404)");
    }
  }
}

// Run directly when executed via tsx / node
if (process.argv[1] === __filename) {
  syncCmsAssets();
}
