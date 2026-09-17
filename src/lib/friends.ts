import fs from "node:fs";
import path from "node:path";

export interface FriendLink {
  name: string;
  url: string;
  description: string;
  avatar: string;
  backlink?: string;
}

const FRIENDS_DIR = path.join(process.cwd(), "content", "friends");

/**
 * Returns the list of `*.json` file names inside the friends directory.
 *
 * Naming convention: the file name is the entry's STABLE IDENTIFIER, whereas the
 * displayed name comes from the `name` field. The two are allowed to differ —
 * several files keep their original names from the upstream repository (e.g.
 * `雨月空间.json` has `"name": "Mintimate's Blog"`). Renaming a file breaks
 * historical PRs, external references and diff traceability, so mismatches must
 * not be treated as errors.
 */
function listFriendFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Parses a single friend-link file (`content/friends/<site>.json`).
 *
 * Fail fast: a malformed JSON file or a missing required field throws an error
 * that names the offending file, so CI fails at PR time instead of silently
 * dropping data from the rendered page.
 */
function parseFriendFile(dir: string, fileName: string): FriendLink {
  const filePath = path.join(dir, fileName);
  const raw = fs.readFileSync(filePath, "utf8");

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`[friends] content/friends/${fileName} is not valid JSON: ${reason}`);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`[friends] content/friends/${fileName} must contain a single JSON object.`);
  }

  const item = data as Record<string, unknown>;
  const name = String(item.name ?? "").trim();
  const url = String(item.url ?? "").trim();
  const description = String(item.description ?? "").trim();
  // Historical typo tolerance: `avartar` (main branch) is still accepted.
  const avatar = String(item.avatar ?? item.avartar ?? "").trim();
  const backlink = item.backlink ? String(item.backlink).trim() : undefined;

  const missing: string[] = [];
  if (!name) missing.push("name");
  if (!url) missing.push("url");
  if (!description) missing.push("description");
  if (!avatar) missing.push("avatar");
  if (missing.length > 0) {
    throw new Error(
      `[friends] content/friends/${fileName} is missing required field(s): ${missing.join(", ")}`
    );
  }

  return { name, url, description, avatar, backlink };
}

/**
 * Reads every friend link from `content/friends/*.json` and returns them sorted
 * by name (Chinese pinyin / unicode aware).
 *
 * If the directory does not exist an empty array is returned: a repository
 * checkout without friend links (or a stripped-down test fixture) should still
 * build a valid, empty `/friends` page instead of crashing the whole export.
 */
export async function getFriendLinks(dirPath?: string): Promise<FriendLink[]> {
  const targetDir = dirPath || FRIENDS_DIR;
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    return [];
  }

  const links = listFriendFiles(targetDir).map((fileName) => parseFriendFile(targetDir, fileName));

  return links.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}
