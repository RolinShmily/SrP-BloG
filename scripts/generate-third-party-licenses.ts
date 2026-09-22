import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const licensesDir = path.join(rootDir, "licenses");
const outPath = path.join(rootDir, "public/third-party-licenses.txt");

/**
 * The scope boundary is defined by the tool, not by hand:
 * `--prod --no-optional` = the production dependency closure, minus
 * platform-specific optional binaries (sharp / libvips / @next/swc). Those run
 * on the build machine only and are never bundled into the site, so they carry
 * no distribution obligation. Using the flag instead of a hand-kept exclusion
 * list means the boundary cannot silently drift.
 */
const PNPM_ARGS = ["licenses", "list", "--prod", "--no-optional", "--json"];

/**
 * Self-hosted web fonts are not npm packages, so the dependency scan cannot see
 * them — but their binaries *do* ship inside the site, and OFL-1.1 clause 2
 * requires "each copy contains the above copyright notice and this license".
 * Keep this list in sync with the `next/font` faces in `src/app/layout.tsx`.
 */
const WEB_FONTS = [
  ["Inter", "Latin body/prose text", "Copyright (c) 2016-2023 The Inter Project Authors"],
  ["JetBrains Mono", "Latin/digits in code blocks and UI chrome", "Copyright (c) 2020 The JetBrains Mono Authors"],
  ["Noto Sans SC", "all Chinese text (Google + Adobe)", "Copyright (c) 2014-2025 Adobe, Google, and the Noto Project Authors"],
  ["Instrument Serif", "brand-only display serif", "Copyright (c) 2022 The Instrument Serif Project Authors"],
  [
    "KaTeX fonts",
    "math rendering, shipped with katex/dist/katex.min.css",
    "Copyright (c) 2009-2010, Design Science, Inc. (www.mathjax.org); Copyright (c) 2014 Khan Academy — with Reserved Font Name KaTeX_Main",
  ],
] as const;

/** Font license family whose text must be present in licenses/ for the fonts above. */
const FONT_LICENSE = "OFL-1.1";

interface PnpmLicenseEntry {
  name: string;
  versions: string[];
  paths?: string[];
}

type PnpmLicenseReport = Record<string, PnpmLicenseEntry[]>;

interface PackageRow {
  id: string;
  copyright: string[];
}

const RULE = "-".repeat(79);

/**
 * Matches a copyright notice that opens with a symbol, a year, a bracket or an angle bracket —
 * e.g. "Copyright (c) 2020 Foo", "Copyright 2013 Andrey Sitnik", "Copyright [yyyy] …".
 * Case-insensitive: "COPYRIGHT (C) 2020" is just as much a notice.
 */
const COPYRIGHT_SYMBOL = /^copyright\s*(?:\(c\)|©|\d{4}|\[|<)/i;

/**
 * Matches a notice that opens with a capitalised name — e.g. "Copyright OpenJS Foundation …".
 * Deliberately case-SENSITIVE: it must not match Apache-2.0 body text such as
 * "copyright notice that is included in or attached to the work" or
 * "copyright license to reproduce …", which are prose, not notices.
 */
const COPYRIGHT_NAME = /^Copyright\s+[A-Z]/;

/** Unfilled template placeholders carry no information, so they count as "no copyright line". */
const COPYRIGHT_PLACEHOLDER =
  /(<year>|<copyright holders?>|<owner>|<name of copyright holder|\[yyyy\]|\[year\]|\[name of copyright owner\]|\[owner\]|\[fullname\])/i;

/** True when a line is a real copyright notice rather than license prose. */
function isCopyrightNotice(line: string): boolean {
  if (COPYRIGHT_PLACEHOLDER.test(line)) return false;
  return COPYRIGHT_SYMBOL.test(line) || COPYRIGHT_NAME.test(line);
}

/** Reads a package's own license file and returns its `Copyright ...` lines. */
function readCopyrightLines(packageDir: string): string[] {
  let entries: string[];
  try {
    entries = fs.readdirSync(packageDir);
  } catch {
    return [];
  }

  const found: string[] = [];
  for (const entry of entries) {
    if (!/^licen[cs]e/i.test(entry) && !/^copying/i.test(entry)) continue;
    const filePath = path.join(packageDir, entry);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch {
      continue;
    }
    if (!stat.isFile() || stat.size > 64 * 1024) continue;

    let text: string;
    try {
      text = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!isCopyrightNotice(trimmed)) continue;
      if (!found.includes(trimmed)) found.push(trimmed);
    }
    if (found.length >= 2) break;
  }
  return found.slice(0, 2);
}

/** Resolves the exact `name@version` for one installed path. */
function identify(packageDir: string): string | null {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8")) as {
      name?: string;
      version?: string;
    };
    if (!manifest.name || !manifest.version) return null;
    return `${manifest.name}@${manifest.version}`;
  } catch {
    return null;
  }
}

function collectReport(): PnpmLicenseReport {
  try {
    const raw = execFileSync("pnpm", PNPM_ARGS, {
      cwd: rootDir,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    return JSON.parse(raw) as PnpmLicenseReport;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `\`pnpm ${PNPM_ARGS.join(" ")}\` failed — the notice must be generated from a complete ` +
        `\`pnpm install\` with pnpm on PATH.\n${detail}`
    );
  }
}

/** Reads a verbatim license text from licenses/, failing loudly when absent. */
function readLicenseText(family: string): string {
  const filePath = path.join(licensesDir, `${family}.txt`);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing licenses/${family}.txt. The production dependency tree contains a license ` +
        `family with no verbatim text in licenses/ — add the upstream license text before shipping.`
    );
  }
  return fs.readFileSync(filePath, "utf8").trimEnd();
}

export function generateThirdPartyLicenses(): void {
  console.log("[licenses] Generating public/third-party-licenses.txt...");

  const report = collectReport();
  const families = Object.keys(report).sort();

  const sections: string[] = [];
  const texts: string[] = [];
  let totalPackages = 0;
  let totalInstances = 0;

  for (const family of families) {
    const rows: PackageRow[] = [];
    for (const entry of report[family]) {
      for (const packageDir of entry.paths ?? []) {
        const id = identify(packageDir) ?? `${entry.name}@${entry.versions.join("/")}`;
        rows.push({ id, copyright: readCopyrightLines(packageDir) });
      }
    }
    // `paths` can be absent in unusual layouts; fall back to name@version.
    if (rows.length === 0) {
      for (const entry of report[family]) {
        for (const version of entry.versions) rows.push({ id: `${entry.name}@${version}`, copyright: [] });
      }
    }
    rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    totalPackages += report[family].length;
    totalInstances += rows.length;

    const body = rows
      .map((row) =>
        row.copyright.length === 0
          ? `  ${row.id}\n      (upstream ships no copyright line)`
          : `  ${row.id}\n${row.copyright.map((line) => `      ${line}`).join("\n")}`
      )
      .join("\n");

    sections.push(
      `${family} (${report[family].length} ${report[family].length === 1 ? "package" : "packages"}, ` +
        `${rows.length} ${rows.length === 1 ? "instance" : "instances"})\n\n${body}`
    );
    texts.push(`### ${family} — licenses/${family}.txt\n\n${readLicenseText(family)}`);
  }

  // The font license is not an npm dependency, so it is validated separately.
  const fontText = readLicenseText(FONT_LICENSE);

  const header = [
    "THIRD-PARTY SOFTWARE NOTICES",
    "============================",
    "",
    "This file ships with the deployed site. It is generated at build time by",
    "scripts/generate-third-party-licenses.ts — do not edit it by hand.",
    "",
    `Scope: the production dependency closure (\`pnpm ${PNPM_ARGS.join(" ")}\`)`,
    `       — ${totalPackages} packages / ${totalInstances} version instances across ${families.length} license families.`,
    "       Platform-specific optional binaries (sharp / libvips / @next/swc) are",
    "       excluded: they run on the build machine and are never bundled into the site.",
    "",
    "The MIT, ISC and BSD licenses require the copyright notice and the license text to",
    "accompany every copy of the software. Each package below is redistributed inside this",
    "site's bundled JavaScript, so each entry carries its upstream copyright line, and the",
    "verbatim license texts follow at the end of this file.",
    "",
    "The self-hosted web fonts are not npm packages; their notices are in the next section.",
    "",
    RULE,
    "PACKAGES BY LICENSE",
    RULE,
    "",
    sections.join(`\n\n${RULE}\n\n`),
    "",
    RULE,
    "WEB FONTS (SIL Open Font License 1.1)",
    RULE,
    "",
    "Font binaries are self-hosted in out/_next/static/media/ and are therefore distributed",
    "with the site. OFL-1.1 requires each copy to contain the copyright notice and the license.",
    "",
    WEB_FONTS.map(([name, role, copyright]) => `  ${name}\n      ${role}\n      ${copyright}`).join("\n"),
    "",
    RULE,
    "VERBATIM LICENSE TEXTS",
    RULE,
    "",
    texts.join("\n\n"),
    "",
    `### ${FONT_LICENSE} — licenses/${FONT_LICENSE}.txt (web fonts)`,
    "",
    fontText,
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, header, "utf8");

  console.log(
    `[licenses] Wrote ${totalPackages} packages (${totalInstances} instances), ` +
      `${families.length} dependency license families + ${FONT_LICENSE} for fonts -> ${outPath}`
  );
}

if (process.argv[1] === __filename) {
  try {
    generateThirdPartyLicenses();
  } catch (error) {
    console.error("[licenses] Failed to generate third-party notices:", error);
    process.exit(1);
  }
}
