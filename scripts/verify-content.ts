import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  getAllCategories,
  getAllPosts,
  getAllTags,
  getPostBySlug,
  getSiteStats,
  getSearchIndex,
} from "../src/lib/content";
import { collectDictionaryKeys, dictionaries, getDictionary } from "../src/i18n";
import { getFriendLinks } from "../src/lib/friends";
import { getSponsors } from "../src/lib/sponsors";
import { CUSTOM_FONT_SIZE_TOKENS } from "../src/lib/utils";
import { postsDir, publicPostsDir, syncPostAssets } from "./sync-post-assets";

const EXPECTED_TOTAL_POSTS = 53;
const EXPECTED_PUBLISHED_POSTS = 51;
const EXPECTED_FRIEND_LINKS = 11;

/** Returns true when the value parses as an absolute http(s) URL. */
function isHttpUrl(value: unknown): boolean {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

interface FlatPostFile {
  slug: string;
  locale: string;
  fileName: string;
}

/** Lists every co-located post file: `content/posts/<slug>/index.<locale>.md`. */
function listPostFiles(): FlatPostFile[] {
  const files: FlatPostFile[] = [];
  if (!fs.existsSync(postsDir)) return files;

  for (const slugEntry of fs.readdirSync(postsDir, { withFileTypes: true })) {
    if (!slugEntry.isDirectory()) continue;
    const slugDir = path.join(postsDir, slugEntry.name);
    for (const fileEntry of fs.readdirSync(slugDir, { withFileTypes: true })) {
      const match = /^index\.(zh|en)\.mdx?$/.exec(fileEntry.name);
      if (match && fileEntry.isFile()) {
        files.push({ slug: slugEntry.name, locale: match[1], fileName: fileEntry.name });
      }
    }
  }
  return files;
}

async function verifyContent() {
  console.log("==================================================");
  console.log("  Running Content Pipeline Verification Suite");
  console.log("==================================================\n");

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failedTests++;
    }
  }

  // 1. Verify co-located directory layout
  console.log("1. Verifying co-located bilingual layout under content/posts/...");
  assert(fs.existsSync(postsDir), `Root directory content/posts exists`);
  assert(
    fs.existsSync(path.join(process.cwd(), "content/friends")),
    `Friend links directory content/friends/ exists`
  );

  const postDirs = fs
    .readdirSync(postsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());
  const flatMarkdownFiles = fs
    .readdirSync(postsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.mdx?$/.test(entry.name));
  const postFiles = listPostFiles();
  const zhFiles = postFiles.filter((file) => file.locale === "zh");
  const enFiles = postFiles.filter((file) => file.locale === "en");

  assert(
    postDirs.length === EXPECTED_TOTAL_POSTS,
    `content/posts contains ${EXPECTED_TOTAL_POSTS} post directories (got: ${postDirs.length})`
  );
  assert(
    zhFiles.length === EXPECTED_TOTAL_POSTS,
    `Found ${EXPECTED_TOTAL_POSTS} index.zh.md files (got: ${zhFiles.length})`
  );
  assert(
    enFiles.length >= 0,
    `English source files discovered in the co-located layout (count: ${enFiles.length})`
  );
  assert(
    flatMarkdownFiles.length === 0,
    `No legacy flat markdown files remain in content/posts root (got: ${flatMarkdownFiles.length})`
  );
  const dirsMissingZh = postDirs.filter(
    (entry) => !fs.existsSync(path.join(postsDir, entry.name, "index.zh.md"))
  );
  assert(
    dirsMissingZh.length === 0,
    `Every post directory has an index.zh.md (missing: ${dirsMissingZh.map((d) => d.name).join(", ") || "none"})`
  );
  // Every post now co-locates its images, so the fixture is a draft post that
  // carries a post-local image in frontmatter as well as in its body.
  const COVER_POST = "13-CFGInstaller";
  const COVER_FILE = "2026-01-05-16-37.png";
  const coverAsset = path.join(postsDir, COVER_POST, COVER_FILE);
  assert(
    fs.existsSync(coverAsset),
    `Co-located asset preserved in post directory (content/posts/${COVER_POST}/${COVER_FILE})`
  );
  assert(
    !fs.existsSync(path.join(process.cwd(), "public/assets/images")),
    `Legacy shared image directory public/assets/images has been migrated away`
  );

  // 2. Verify Post Count & Frontmatter Parsing
  console.log("\n2. Verifying Posts Count and Frontmatter Parsing...");
  const allPosts = await getAllPosts("zh", { includeDrafts: true });
  assert(
    allPosts.length === EXPECTED_TOTAL_POSTS,
    `Total posts parsed equals ${EXPECTED_TOTAL_POSTS} (got: ${allPosts.length})`
  );

  const publishedPosts = await getAllPosts("zh", { includeDrafts: false });
  assert(
    publishedPosts.length === EXPECTED_PUBLISHED_POSTS,
    `Published posts count equals ${EXPECTED_PUBLISHED_POSTS} (${EXPECTED_TOTAL_POSTS} total - 12 drafts) (got: ${publishedPosts.length})`
  );

  const slugs = new Set<string>();
  let allHaveValidFields = true;
  let allImagesResolved = true;
  let allLocaleMetaValid = true;

  for (const post of allPosts) {
    if (slugs.has(post.slug)) {
      console.error(`    Duplicate slug found: ${post.slug}`);
      allHaveValidFields = false;
    }
    slugs.add(post.slug);

    if (!post.title || !post.published || post.wordCount <= 0 || !post.readingTime) {
      console.error(`    Invalid post metadata in slug: ${post.slug}`);
      allHaveValidFields = false;
    }

    if (!/^\d+ 分钟阅读$/.test(post.readingTime)) {
      console.error(`    Invalid readingTime format: ${post.readingTime} in ${post.slug}`);
      allHaveValidFields = false;
    }

    if (post.image && post.image.startsWith("../assets")) {
      console.error(
        `    Unresolved relative image path in frontmatter: ${post.image} in ${post.slug}`
      );
      allImagesResolved = false;
    }

    if (
      !post.availableLocales.includes("zh") ||
      post.contentLocale !== "zh" ||
      post.isFallback !== false ||
      post.hasTranslation !== (post.availableLocales.length > 1)
    ) {
      console.error(`    Invalid locale metadata in slug: ${post.slug}`);
      allLocaleMetaValid = false;
    }
  }

  assert(slugs.size === EXPECTED_TOTAL_POSTS, `All ${EXPECTED_TOTAL_POSTS} posts have unique canonical slugs`);
  assert(
    allHaveValidFields,
    `All posts have valid title, published date, wordCount, and readingTime`
  );
  assert(allImagesResolved, `All frontmatter image paths resolved to browser-ready paths`);
  assert(
    allLocaleMetaValid,
    `Every post exposes availableLocales/hasTranslation/contentLocale/isFallback correctly`
  );
  assert(
    allPosts.every((post) => post.excerpt && post.excerpt.length > 0),
    `Every post has a non-empty excerpt`
  );

  // 3. Verify Sorting Order
  console.log("\n3. Verifying Post Sorting Order (pinned first, then date descending)...");
  const allPinned = allPosts.filter((post) => post.pinned);
  assert(allPinned.length === 1, `1 pinned post found overall (including drafts)`);
  const publishedPinned = publishedPosts.filter((post) => post.pinned);
  assert(
    publishedPinned.length === 1,
    `1 pinned post found among published posts (${publishedPosts[0].slug})`
  );
  assert(
    publishedPosts[0].pinned === true,
    `First published post is pinned (${publishedPosts[0].slug})`
  );
  assert(
    publishedPosts[1].pinned === false,
    `Second published post is unpinned (${publishedPosts[1].slug})`
  );

  let datesDescending = true;
  for (let i = 1; i < publishedPosts.length - 1; i++) {
    const d1 = new Date(publishedPosts[i].published).getTime();
    const d2 = new Date(publishedPosts[i + 1].published).getTime();
    if (d1 < d2) {
      console.error(
        `    Sorting mismatch: ${publishedPosts[i].published} < ${publishedPosts[i + 1].published}`
      );
      datesDescending = false;
      break;
    }
  }
  assert(datesDescending, `Unpinned posts are sorted descending by published date`);

  // 4. Verify HTML Rendering, Math, Code Highlighting, and TOC on all posts
  console.log(`\n4. Verifying Markdown Rendering across all ${EXPECTED_TOTAL_POSTS} posts...`);
  let renderErrors = 0;
  let hasImageUnresolvedInBody = false;
  let translationsBundlesValid = true;

  for (const post of allPosts) {
    try {
      const detail = await getPostBySlug(post.slug, "zh", { includeDrafts: true });
      if (!detail) {
        console.error(`    Failed to fetch detail for slug: ${post.slug}`);
        renderErrors++;
        continue;
      }
      if (detail.contentHtml.includes('src="../assets/images/')) {
        console.error(`    Unresolved ../assets/images in body of ${post.slug}`);
        hasImageUnresolvedInBody = true;
      }

      const primary = detail.translations[detail.contentLocale];
      if (
        !primary ||
        primary.contentHtml !== detail.contentHtml ||
        primary.toc.length !== detail.toc.length ||
        primary.wordCount !== detail.wordCount ||
        primary.readingTime !== detail.readingTime
      ) {
        console.error(`    Invalid translations bundle for slug: ${post.slug}`);
        translationsBundlesValid = false;
      }

      const bundleLocales = Object.keys(detail.translations);
      if (bundleLocales.some((locale) => !detail.availableLocales.includes(locale as "zh" | "en"))) {
        console.error(`    translations bundle exposes a locale without a source file: ${post.slug}`);
        translationsBundlesValid = false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`    Error rendering ${post.slug}: ${message}`);
      renderErrors++;
    }
  }
  assert(
    renderErrors === 0,
    `All ${EXPECTED_TOTAL_POSTS} posts rendered without throwing errors (errors: ${renderErrors})`
  );
  assert(!hasImageUnresolvedInBody, `No unresolved ../assets/images/ found in rendered HTML`);
  assert(
    translationsBundlesValid,
    `Every PostDetail exposes a self-consistent, pre-rendered translations bundle`
  );

  // Math Rendering Verification
  const MATH_POST = "9-Markdown-1";
  const mathPost = await getPostBySlug(MATH_POST, "zh", { includeDrafts: true });
  const hasKatex = mathPost?.contentHtml.includes('class="katex"');
  assert(Boolean(hasKatex), `KaTeX formulas rendered correctly in ${MATH_POST} (contains class="katex")`);

  // Code Highlighting and Line Numbers Verification
  const CODE_POST = "47-immortalwrt-build";
  const codePost = await getPostBySlug(CODE_POST, "zh");
  const hasCodeBlock = codePost?.contentHtml.includes("data-rehype-pretty-code-figure");
  const hasLineNumbers = codePost?.contentHtml.includes("data-line-numbers");
  assert(Boolean(hasCodeBlock), `Shiki code blocks highlighted with data-rehype-pretty-code-figure`);
  assert(Boolean(hasLineNumbers), `Code blocks include line numbers (data-line-numbers attribute)`);
  assert(
    Boolean(codePost?.toc && codePost.toc.length > 0),
    `Headings extracted for Table of Contents (${codePost?.toc.length} headings in ${CODE_POST})`
  );

  // 5. Verify CJK slugs and locale fallback behaviour
  console.log("\n5. Verifying CJK slugs and locale fallback...");
  const cjkSlug = "38-windows-defender-卸载程序-bluetooth-audio-receiver";
  const cjkPostRaw = await getPostBySlug(cjkSlug, "zh");
  const cjkPostEncoded = await getPostBySlug(encodeURIComponent(cjkSlug), "zh");
  assert(Boolean(cjkPostRaw), `CJK slug resolves by raw directory name (${cjkSlug})`);
  assert(
    Boolean(cjkPostEncoded) && cjkPostEncoded?.slug === cjkSlug,
    `CJK slug resolves when percent-encoded (${encodeURIComponent(cjkSlug)})`
  );
  assert(
    cjkPostRaw?.slug === cjkSlug,
    `CJK slug is preserved verbatim as the canonical slug (got: ${cjkPostRaw?.slug})`
  );

  const englishPosts = await getAllPosts("en", { includeDrafts: true });
  assert(
    englishPosts.length === enFiles.length,
    `getAllPosts("en") lists exactly the posts that ship an index.en.md (listed: ${englishPosts.length}, files: ${enFiles.length})`
  );

  const fallbackDetail = await getPostBySlug("32-docker-mc", "en");
  assert(Boolean(fallbackDetail), `getPostBySlug(slug, "en") falls back to zh instead of returning null`);
  assert(
    fallbackDetail?.isFallback === true && fallbackDetail?.contentLocale === "zh",
    `Fallback detail is marked isFallback=true / contentLocale="zh"`
  );
  assert(
    Boolean(
      fallbackDetail?.translations.zh &&
        fallbackDetail.translations.zh.contentHtml === fallbackDetail.contentHtml &&
        fallbackDetail.translations.zh.toc.length === fallbackDetail.toc.length
    ),
    `Fallback detail still ships the pre-rendered zh translation bundle`
  );
  assert(
    fallbackDetail?.availableLocales.length === 1 && fallbackDetail?.hasTranslation === false,
    `Fallback detail reports availableLocales=["zh"] and hasTranslation=false`
  );

  const unpublishedPost = await getPostBySlug(COVER_POST, "zh");
  assert(unpublishedPost === null, `Draft posts are hidden by default (${COVER_POST} -> null)`);

  // 6. Verify asset references and the prebuild sync script
  console.log("\n6. Verifying post-local assets and scripts/sync-post-assets.ts...");
  const dockerMc = await getPostBySlug("32-docker-mc", "zh");
  assert(
    Boolean(dockerMc?.image?.startsWith("/posts/32-docker-mc/")),
    `Post-local frontmatter image resolves under /posts/<slug>/ (${dockerMc?.image})`
  );
  assert(
    Boolean(dockerMc?.contentHtml.includes('src="/posts/32-docker-mc/')),
    `Body images rewritten to /posts/<slug>/ in rendered HTML`
  );
  // The old shared-assets form must no longer appear anywhere in rendered HTML.
  assert(
    !dockerMc?.contentHtml.includes("/assets/images/"),
    `Rendered HTML no longer references the retired /assets/images/ path`
  );
  const coverPost = await getPostBySlug(COVER_POST, "zh", { includeDrafts: true });
  assert(
    coverPost?.image === `/posts/${COVER_POST}/${COVER_FILE}`,
    `Post-local ./${COVER_FILE} resolves to /posts/${COVER_POST}/${COVER_FILE} (got: ${coverPost?.image})`
  );

  const syncProbeDir = fs.mkdtempSync(path.join(os.tmpdir(), "srp-post-assets-"));
  try {
    const firstSync = syncPostAssets({ destination: syncProbeDir });
    const secondSync = syncPostAssets({ destination: syncProbeDir });
    const syncedCoverProbe = path.join(syncProbeDir, COVER_POST, COVER_FILE);
    assert(
      firstSync.copied.includes(path.join(COVER_POST, COVER_FILE)),
      `sync-post-assets copies ${COVER_POST}/${COVER_FILE} into a fresh destination`
    );
    assert(
      secondSync.copied.length === 0 && secondSync.skipped.length === firstSync.copied.length,
      `sync-post-assets is idempotent (second run copied ${secondSync.copied.length}, skipped ${secondSync.skipped.length})`
    );
    assert(
      fs.existsSync(syncedCoverProbe) &&
        fs.statSync(syncedCoverProbe).size === fs.statSync(coverAsset).size,
      `Copied asset byte size matches its source (${fs.existsSync(syncedCoverProbe) ? fs.statSync(syncedCoverProbe).size : "missing"} bytes)`
    );

    // A directory left in the destination by a renamed or deleted post must not
    // survive the next sync, or it ships to production as an orphan.
    const orphanDir = path.join(syncProbeDir, "a-post-that-no-longer-exists");
    fs.mkdirSync(orphanDir, { recursive: true });
    fs.writeFileSync(path.join(orphanDir, "stale.png"), "stale");
    const prunedSync = syncPostAssets({ destination: syncProbeDir });
    assert(
      prunedSync.pruned.includes("a-post-that-no-longer-exists") &&
        !fs.existsSync(orphanDir),
      `sync-post-assets prunes destination directories with no source counterpart`
    );
    assert(
      fs.existsSync(syncedCoverProbe),
      `Pruning leaves directories that still have a source untouched`
    );
  } finally {
    fs.rmSync(syncProbeDir, { recursive: true, force: true });
  }

  syncPostAssets();
  const syncedCover = path.join(publicPostsDir, COVER_POST, COVER_FILE);
  assert(fs.existsSync(syncedCover), `public/posts/${COVER_POST}/${COVER_FILE} exists after sync`);

  // 7. Verify Categories and Tags Aggregation
  console.log("\n7. Verifying Categories and Tags Aggregation...");
  const tags = await getAllTags("zh");
  assert(tags.length > 0, `Tags aggregated successfully (total tags: ${tags.length})`);
  const isTagsSorted = tags.every((tag, idx) => idx === 0 || tags[idx - 1].count >= tag.count);
  assert(isTagsSorted, `Tags are sorted descending by post count`);

  const categories = await getAllCategories("zh");
  assert(
    categories.length > 0,
    `Categories aggregated successfully (total categories: ${categories.length})`
  );

  // 8. Verify Site Stats & Search Index
  console.log("\n8. Verifying Site Stats and Search Index...");
  const stats = await getSiteStats("zh");
  const manualWordCount = publishedPosts.reduce((sum, post) => sum + post.wordCount, 0);
  assert(
    stats.totalPosts === EXPECTED_PUBLISHED_POSTS,
    `SiteStats.totalPosts matches published posts count (${EXPECTED_PUBLISHED_POSTS})`
  );
  assert(
    stats.totalWordCount === manualWordCount,
    `SiteStats.totalWordCount (${stats.totalWordCount}) equals sum of published word counts (${manualWordCount})`
  );

  const searchIndex = await getSearchIndex("zh", { includeDrafts: false });
  assert(
    searchIndex.length === EXPECTED_PUBLISHED_POSTS,
    `Search index generated for all ${EXPECTED_PUBLISHED_POSTS} published posts`
  );
  assert(
    searchIndex.every(
      (item) => Boolean(item.slug && item.title && item.date && item.plainText) && item.locale === "zh"
    ),
    `Every search index item includes slug/title/date/plainText plus a locale field`
  );
  assert(
    searchIndex.every((item) => (item.titleEn ? Boolean(item.plainTextEn) : true)),
    `Search index only attaches English text when an index.en.md exists`
  );

  // 9. Verify i18n dictionaries
  console.log("\n9. Verifying UI i18n dictionaries (zh/en key parity)...");
  const zhKeys = collectDictionaryKeys(dictionaries.zh).sort();
  const enKeys = collectDictionaryKeys(dictionaries.en).sort();
  const missingInEn = zhKeys.filter((key) => !enKeys.includes(key));
  const missingInZh = enKeys.filter((key) => !zhKeys.includes(key));
  assert(
    missingInEn.length === 0 && missingInZh.length === 0,
    `zh/en dictionaries expose identical keys (${zhKeys.length} keys; en missing: ${missingInEn.join(", ") || "none"}; zh missing: ${missingInZh.join(", ") || "none"})`
  );

  const requiredKeys = [
    "stats.totalPosts",
    "stats.totalWords",
    "stats.minutesRead",
    "stats.words",
    "stats.views",
    "stats.visitors",
    "search.placeholder",
    "pagination.prev",
    "pagination.next",
    "post.prev",
    "post.next",
    "friends.apply",
    "archives.timeline",
    "archives.year",
    "translation.showMachine",
  ];
  const missingRequired = requiredKeys.filter((key) => !zhKeys.includes(key));
  assert(
    missingRequired.length === 0,
    `Dictionary covers the required UI strings (missing: ${missingRequired.join(", ") || "none"})`
  );

  const allStringValues = [...zhKeys, ...enKeys].length > 0;
  assert(
    allStringValues &&
      getDictionary("zh").stats.totalPosts === "文章总数" &&
      getDictionary("en").stats.totalPosts === "Total Posts" &&
      getDictionary("en").translation.showMachine === "Show machine translation",
    `getDictionary() returns locale-specific strings`
  );

  // 10. Verify Friend Links Provider
  //
  // Naming convention (intentional, see README "File naming convention"):
  // the file name is the entry's STABLE IDENTIFIER, while the displayed name
  // comes from the `name` field. The two are allowed to differ — some files
  // keep their original names from the upstream repository (e.g.
  // `雨月空间.json` has `"name": "Mintimate's Blog"`). Do NOT add an assertion
  // that the file name must match `name`, and do not "fix" such mismatches:
  // renaming breaks historical PRs, external references and diff traceability.
  console.log("\n10. Verifying Friend Links Provider from content/friends/...");
  const friendsDir = path.join(process.cwd(), "content/friends");
  const friendFiles = fs.existsSync(friendsDir)
    ? fs
        .readdirSync(friendsDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b))
    : [];
  assert(fs.existsSync(friendsDir), `Friend links directory content/friends/ exists`);
  assert(
    friendFiles.length === EXPECTED_FRIEND_LINKS,
    `content/friends/ contains ${EXPECTED_FRIEND_LINKS} JSON files (got: ${friendFiles.length})`
  );

  const friendFileErrors: string[] = [];
  const friendUrlErrors: string[] = [];
  const friendAvatarErrors: string[] = [];
  const duplicateUrls: string[] = [];
  const duplicateNames: string[] = [];
  const seenFriendUrls = new Map<string, string>();
  const seenFriendNames = new Map<string, string>();

  for (const fileName of friendFiles) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(friendsDir, fileName), "utf8"));
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      friendFileErrors.push(`${fileName}: invalid JSON (${reason})`);
      continue;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      friendFileErrors.push(`${fileName}: must contain a single JSON object`);
      continue;
    }

    const entry = parsed as Record<string, unknown>;
    const name = String(entry.name ?? "").trim();
    const url = String(entry.url ?? "").trim();
    const description = String(entry.description ?? "").trim();
    const avatar = String(entry.avatar ?? entry.avartar ?? "").trim();

    for (const [field, value] of [
      ["name", name],
      ["url", url],
      ["description", description],
      ["avatar", avatar],
    ] as const) {
      if (!value) friendFileErrors.push(`${fileName}: missing required field ${field}`);
    }

    if (url && !isHttpUrl(url)) friendUrlErrors.push(`${fileName}: url is not http(s) (${url})`);
    if (avatar && !isHttpUrl(avatar)) {
      friendAvatarErrors.push(`${fileName}: avatar is not http(s) (${avatar})`);
    }

    if (url) {
      const key = url.replace(/\/+$/, "").toLowerCase();
      const owner = seenFriendUrls.get(key);
      if (owner) duplicateUrls.push(`${fileName} <-> ${owner} (${url})`);
      else seenFriendUrls.set(key, fileName);
    }
    if (name) {
      const owner = seenFriendNames.get(name);
      if (owner) duplicateNames.push(`${fileName} <-> ${owner} (${name})`);
      else seenFriendNames.set(name, fileName);
    }
  }

  assert(
    friendFileErrors.length === 0,
    `Every content/friends/*.json is a single object with name/url/description/avatar (${friendFileErrors.join("; ") || "all valid"})`
  );
  assert(
    friendUrlErrors.length === 0,
    `Every friend link url is a valid http(s) URL (${friendUrlErrors.join("; ") || "all valid"})`
  );
  assert(
    friendAvatarErrors.length === 0,
    `Every friend link avatar is a valid http(s) URL (${friendAvatarErrors.join("; ") || "all valid"})`
  );
  assert(
    duplicateUrls.length === 0,
    `Friend link urls are unique across content/friends/ (${duplicateUrls.join("; ") || "no duplicates"})`
  );
  assert(
    duplicateNames.length === 0,
    `Friend link names are unique across content/friends/ (${duplicateNames.join("; ") || "no duplicates"})`
  );

  const friendLinks = await getFriendLinks();
  assert(
    friendLinks.length === EXPECTED_FRIEND_LINKS,
    `Friend links parsed all ${EXPECTED_FRIEND_LINKS} entries from content/friends/ (got: ${friendLinks.length})`
  );
  assert(
    friendLinks.every((link) => Boolean(link.name && link.url && link.description && link.avatar)),
    `Every friend link has valid name, url, description, and avatar`
  );

  console.log("\n11. Verifying Sponsors Provider from content/sponsors/...");
  const sponsorsDir = path.join(process.cwd(), "content/sponsors");
  assert(fs.existsSync(sponsorsDir), `Sponsors directory content/sponsors/ exists`);

  const sponsors = await getSponsors();
  assert(
    sponsors.length > 0,
    `At least one sponsor parsed from content/sponsors/ (got: ${sponsors.length})`
  );
  assert(
    sponsors.every((sponsor) => Boolean(sponsor.name && sponsor.date)),
    `Every sponsor has a name and a date`
  );
  assert(
    sponsors.every((sponsor) => Number.isFinite(sponsor.amount) && sponsor.amount > 0),
    `Every sponsor amount is a positive number (got: ${sponsors.map((s) => s.amount).join(", ")})`
  );
  assert(
    sponsors.every((sponsor) => /^\d{4}-\d{2}-\d{2}$/.test(sponsor.date)),
    `Every sponsor date is ISO YYYY-MM-DD (got: ${sponsors.map((s) => s.date).join(", ")})`
  );

  const sponsorAvatarErrors = sponsors
    .filter((sponsor) => sponsor.avatar && !isHttpUrl(sponsor.avatar))
    .map((sponsor) => `${sponsor.name}: avatar is not http(s) (${sponsor.avatar})`);
  assert(
    sponsorAvatarErrors.length === 0,
    `Every sponsor avatar is a valid http(s) URL (${sponsorAvatarErrors.join("; ") || "all valid"})`
  );

  const duplicateSponsorNames = sponsors
    .map((sponsor) => sponsor.name)
    .filter((name, index, all) => all.indexOf(name) !== index);
  assert(
    duplicateSponsorNames.length === 0,
    `Sponsor names are unique across content/sponsors/ (${[...new Set(duplicateSponsorNames)].join("; ") || "no duplicates"})`
  );

  // The sponsorship section renders real payment codes; a missing file would
  // silently degrade to a broken image in production, so check the assets.
  const sponsorQrAssets = ["public/sponsors/alipay.png", "public/sponsors/wechat.png"];
  const missingQrAssets = sponsorQrAssets.filter(
    (asset) => !fs.existsSync(path.join(process.cwd(), asset))
  );
  assert(
    missingQrAssets.length === 0,
    `Sponsorship QR assets exist (${missingQrAssets.join(", ") || "all present"})`
  );

  // A custom `text-<name>` font-size token is indistinguishable from a text
  // colour to tailwind-merge unless it is registered in src/lib/utils.ts. When
  // it is not, `cn()` silently drops the accompanying colour class — the
  // pagination button once rendered white-on-white in dark mode this way.
  console.log("\n12. Verifying tailwind-merge font-size token registration...");
  const tailwindConfigSrc = fs.readFileSync(
    path.join(process.cwd(), "tailwind.config.ts"),
    "utf8"
  );
  const fontSizeBlock = tailwindConfigSrc.match(/fontSize:\s*\{([\s\S]*?)\n\s{6}\}/);
  assert(
    Boolean(fontSizeBlock),
    `tailwind.config.ts declares a theme.fontSize block`
  );
  const configuredFontSizes = fontSizeBlock
    ? [...fontSizeBlock[1].matchAll(/^\s*"?([\w-]+)"?:/gm)].map((m) => m[1])
    : [];
  const unregisteredFontSizes = configuredFontSizes.filter(
    (token) => !(CUSTOM_FONT_SIZE_TOKENS as readonly string[]).includes(token)
  );
  assert(
    unregisteredFontSizes.length === 0,
    `Every theme.fontSize token is registered in CUSTOM_FONT_SIZE_TOKENS (${unregisteredFontSizes.join(", ") || "all registered"})`
  );

  console.log("\n==================================================");
  console.log(`  Verification Complete: ${passedTests} passed, ${failedTests} failed`);
  console.log("==================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

verifyContent().catch((err) => {
  console.error("Fatal error during verification:", err);
  process.exit(1);
});
