import fs from "node:fs";
import path from "node:path";

export interface Sponsor {
  name: string;
  /** Amount in CNY. Rendered as `¥{amount}`. */
  amount: number;
  /** ISO date (`YYYY-MM-DD`) the sponsorship was received. */
  date: string;
  /** Channel the sponsorship came through, e.g. `WeChat`. Optional. */
  platform?: string;
  /** Avatar URL. Optional — the card falls back to the name alone. */
  avatar?: string;
}

const SPONSORS_DIR = path.join(process.cwd(), "content", "sponsors");

/**
 * Returns the list of `*.json` file names inside the sponsors directory.
 *
 * Same naming convention as `content/friends/`: the file name is the entry's
 * STABLE IDENTIFIER while the displayed name comes from the `name` field, so a
 * mismatch between the two is expected and must not be treated as an error.
 */
function listSponsorFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Parses a single sponsor file (`content/sponsors/<name>.json`).
 *
 * Fail fast: a malformed file or a missing/invalid required field throws an
 * error naming the offending file, so a bad sponsorship PR fails at build time
 * instead of silently dropping someone from the thanks list.
 */
function parseSponsorFile(dir: string, fileName: string): Sponsor {
  const filePath = path.join(dir, fileName);
  const raw = fs.readFileSync(filePath, "utf8");

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`[sponsors] content/sponsors/${fileName} is not valid JSON: ${reason}`);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`[sponsors] content/sponsors/${fileName} must contain a single JSON object.`);
  }

  const item = data as Record<string, unknown>;
  const name = String(item.name ?? "").trim();
  const date = String(item.date ?? "").trim();
  const platform = item.platform ? String(item.platform).trim() : undefined;
  const avatar = item.avatar ? String(item.avatar).trim() : undefined;

  const missing: string[] = [];
  if (!name) missing.push("name");
  if (!date) missing.push("date");
  if (item.amount === undefined || item.amount === null || item.amount === "") {
    missing.push("amount");
  }
  if (missing.length > 0) {
    throw new Error(
      `[sponsors] content/sponsors/${fileName} is missing required field(s): ${missing.join(", ")}`
    );
  }

  // Accept both `520` and the legacy `"520￥"` written by the main branch, but
  // reject anything that does not reduce to a finite number so a typo cannot
  // turn into `¥NaN` on the page.
  const amount = Number.parseFloat(String(item.amount).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(amount)) {
    throw new Error(
      `[sponsors] content/sponsors/${fileName} has a non-numeric amount: ${String(item.amount)}`
    );
  }

  return { name, amount, date, platform, avatar };
}

/**
 * Reads every sponsor from `content/sponsors/*.json`, newest first.
 *
 * A missing directory yields an empty list rather than throwing, so a checkout
 * without sponsors still renders a valid `/friends` page.
 */
export async function getSponsors(dirPath?: string): Promise<Sponsor[]> {
  const targetDir = dirPath || SPONSORS_DIR;
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    return [];
  }

  const sponsors = listSponsorFiles(targetDir).map((fileName) =>
    parseSponsorFile(targetDir, fileName)
  );

  return sponsors.sort((a, b) => b.date.localeCompare(a.date));
}
