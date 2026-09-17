import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSearchIndex } from "../src/lib/content/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

export async function generateSearchIndex() {
  console.log("[search-index] Generating public/search-index.json...");
  const searchIndex = await getSearchIndex({ includeDrafts: false });
  const outPath = path.join(rootDir, "public/search-index.json");

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(searchIndex), "utf8");

  console.log(
    `[search-index] Successfully generated index with ${searchIndex.length} items to ${outPath}`
  );
}

if (process.argv[1] === __filename) {
  generateSearchIndex().catch((err) => {
    console.error("[search-index] Failed to generate search index:", err);
    process.exit(1);
  });
}
