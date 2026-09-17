/*
 * Scaffolds a new post folder:
 *   content/posts/<slug>/index.md
 *
 * Usage: pnpm run new-post -- <slug>
 *
 * The co-located layout (see src/lib/content/provider.ts) treats the folder
 * name as the canonical slug and `index.md` as the post entry file.
 * New posts are created as drafts so incomplete scaffolding never ships.
 */

import fs from "fs"
import path from "path"

function getDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error(`Error: No slug argument provided
Usage: pnpm run new-post -- <slug>`)
  process.exit(1)
}

// Accept an optional .md/.mdx suffix for muscle memory, but the folder name is
// the slug. Strip a leading content/posts prefix if the user pasted a path.
let slug = args[0].trim().replace(/\.(md|mdx)$/i, "")
slug = slug.replace(/\\/g, "/").replace(/^content\/posts\//, "").replace(/^\/+|\/+$/g, "")

if (!slug || slug.split("/").some((segment) => segment === ".." || segment === "." || segment === "")) {
  console.error(`Error: invalid slug "${args[0]}". Use a directory-safe name.`)
  process.exit(1)
}

const targetDir = path.join("content", "posts", slug)
const filePath = path.join(targetDir, "index.md")

if (fs.existsSync(filePath)) {
  console.error(`Error: ${filePath} already exists`)
  process.exit(1)
}

fs.mkdirSync(targetDir, { recursive: true })

const content = `---
title: ${slug}
published: ${getDate()}
description: ''
image: ''
tags: []
draft: true
lang: ''
---

`

fs.writeFileSync(filePath, content)
console.log(`Post created: ${filePath}`)
