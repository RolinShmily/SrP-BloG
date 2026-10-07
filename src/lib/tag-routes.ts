import type { TagInfo } from "@/lib/content/types";

/** Canonical display names for tags that differ only by accidental casing. */
const TAG_CANONICAL_NAMES: Record<string, string> = {
  vscode: "VSCode",
  nvidia: "NVIDIA",
  pytorch: "PyTorch",
  cpp: "Cpp",
};

export function normalizeTagKey(name: string): string {
  return name.trim().toLocaleLowerCase("en-US");
}

export function canonicalTagName(name: string): string {
  const trimmed = name.trim();
  return TAG_CANONICAL_NAMES[normalizeTagKey(trimmed)] || trimmed;
}

/** Merges case-only tag variants so they share one stable landing page. */
export function groupTagInfos(tags: TagInfo[]): TagInfo[] {
  const groups = new Map<string, TagInfo>();

  for (const tag of tags) {
    const key = normalizeTagKey(tag.name);
    const existing = groups.get(key);
    if (existing) {
      existing.count += tag.count;
    } else {
      groups.set(key, { name: canonicalTagName(tag.name), count: tag.count });
    }
  }

  return [...groups.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN")
  );
}

export function tagPageHref(name: string): string {
  return `/tags/${encodeURIComponent(canonicalTagName(name))}/`;
}
