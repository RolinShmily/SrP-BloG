import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import type { TocItem } from "./types";

/**
 * Normalizes and resolves image paths for frontmatter and markdown body.
 * Converts:
 * - ../assets/images/... -> /assets/images/...
 * - ../assets/... -> /assets/...
 * - ./cover.jpeg -> /posts/{slug}/cover.jpeg
 */
export function resolveImagePath(imagePath?: string, slug?: string): string | undefined {
  if (!imagePath) return undefined;
  const trimmed = imagePath.trim();
  if (!trimmed) return undefined;

  // External URLs, absolute paths, or data URIs
  if (/^(?:https?:\/\/|\/\/|\/|data:)/i.test(trimmed)) {
    return trimmed;
  }

  // Relative to assets: ../assets/images/...
  if (trimmed.startsWith("../assets/images/")) {
    return `/assets/images/${trimmed.slice("../assets/images/".length)}`;
  }
  if (trimmed.startsWith("../assets/")) {
    return `/assets/${trimmed.slice("../assets/".length)}`;
  }
  if (trimmed.startsWith("assets/")) {
    return `/${trimmed}`;
  }

  // Relative to current post directory: ./cover.jpeg
  if (trimmed.startsWith("./")) {
    const filename = trimmed.slice(2);
    if (slug) {
      return `/posts/${slug}/${filename}`;
    }
    return `/posts/${filename}`;
  }

  return trimmed;
}

/**
 * Traverses an AST tree recursively.
 */
function walkAst(node: any, visitor: (node: any) => void) {
  if (!node || typeof node !== "object") return;
  visitor(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walkAst(child, visitor);
    }
  }
}

/**
 * Remark plugin to resolve relative image URLs to browser-accessible /assets/... or /posts/... paths.
 */
function remarkResolveImages(slug?: string) {
  return (tree: any) => {
    walkAst(tree, (node: any) => {
      if (node.type === "image" && typeof node.url === "string") {
        node.url = resolveImagePath(node.url, slug) || node.url;
      } else if (node.type === "html" && typeof node.value === "string") {
        node.value = node.value.replace(
          /(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi,
          (_match: string, p1: string, url: string, p3: string) => {
            return `${p1}${resolveImagePath(url, slug) || url}${p3}`;
          }
        );
      }
    });
  };
}

/**
 * Rehype plugin to extract headings for the table of contents.
 */
function rehypeExtractToc(tocList: TocItem[]) {
  return (tree: any) => {
    function getHeadingText(node: any): string {
      if (!node) return "";
      if (node.type === "text" && typeof node.value === "string") return node.value;
      if (Array.isArray(node.children)) {
        return node.children.map(getHeadingText).join("");
      }
      return "";
    }

    walkAst(tree, (node: any) => {
      if (node.type === "element" && /^h[1-6]$/.test(node.tagName)) {
        const level = parseInt(node.tagName[1], 10);
        const id = node.properties?.id ? String(node.properties.id) : "";
        const text = getHeadingText(node).trim();
        if (id && text) {
          tocList.push({ id, text, level });
        }
        if (id) {
          if (!Array.isArray(node.children)) {
            node.children = [];
          }
          node.children.unshift({
            type: "element",
            tagName: "a",
            properties: {
              className: ["header-anchor"],
              href: `#${id}`,
              ariaHidden: "true",
            },
            children: [{ type: "text", value: "#" }],
          });
        }
      }
    });
  };
}

/**
 * Strips markdown and HTML syntax to extract clean plain text for word count and search indexing.
 */
export function stripMarkdown(content: string): string {
  if (!content) return "";
  return content
    // Remove fenced code blocks content marker, keep inner code content
    .replace(/```[^\n]*\n([\s\S]*?)```/g, "$1")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove image syntax ![alt](url) -> alt
    .replace(/!\[(.*?)\]\([^)]*\)/g, "$1")
    // Remove link syntax [text](url) -> text
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    // Remove HTML tags
    .replace(/<[^>]+>/g, "")
    // Remove blockquote markers
    .replace(/^>+\s*/gm, "")
    // Remove headings markers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic markers
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove strikethrough
    .replace(/~~(.*?)~~/g, "$1")
    // Remove horizontal rules
    .replace(/^(?:---|\*\*\*|___)\s*$/gm, "")
    // Remove KaTeX math blocks and inline markers
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$([^\$\n]+)\$/g, "$1")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Counts words accurately supporting both CJK characters and Latin/alphanumeric words.
 * Each CJK character is counted as 1 word.
 * Each contiguous sequence of Latin/alphanumeric characters is counted as 1 word.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  // CJK characters (Han, Hiragana, Katakana, Hangul)
  const cjkMatches = text.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;

  // Replace CJK characters with space so Latin word boundaries are unaffected
  const nonCjk = text.replace(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g, " ");
  const words = nonCjk.match(/[a-zA-Z0-9_\u00C0-\u024F]+/g);
  const wordCount = words ? words.length : 0;

  return cjkCount + wordCount;
}

/**
 * Calculates reading time in Chinese format (e.g. "X 分钟阅读") based on ~350 chars/words per minute.
 */
export function calculateReadingTime(wordCount: number): string {
  const wordsPerMinute = 350;
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return `${minutes} 分钟阅读`;
}

export interface RenderResult {
  contentHtml: string;
  toc: TocItem[];
}

/**
 * Rehype plugin to preserve explicit table cell alignment (left / center / right).
 * Sets data-align and inline text-align style so CSS resets never override table alignment.
 */
function rehypeTableAlignment() {
  return (tree: any) => {
    walkAst(tree, (node: any) => {
      if (node.type === "element" && (node.tagName === "th" || node.tagName === "td")) {
        const align = node.properties?.align;
        if (align && typeof align === "string") {
          node.properties["data-align"] = align;
          const currentStyle = (node.properties.style as string) || "";
          node.properties.style = `text-align: ${align}; ${currentStyle}`.trim();
        }
      }
    });
  };
}

/**
 * Parses markdown to HTML string with Unified pipeline:
 * - remark-gfm
 * - remark-math + rehype-katex
 * - rehype-slug
 * - rehype-pretty-code (Shiki)
 * - TOC extraction
 * - Relative image rewriting
 */
export async function renderMarkdownToHtml(markdown: string, slug?: string): Promise<RenderResult> {
  const toc: TocItem[] = [];

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkResolveImages, slug)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeSlug)
    .use(rehypeExtractToc, toc)
    .use(rehypeTableAlignment)
    .use(rehypePrettyCode, {
      theme: {
        light: "github-light",
        dark: "github-dark",
      },
      keepBackground: false,
      filterMetaString: (meta: string) => {
        const trimmed = (meta || "").trim();
        return trimmed.includes("showLineNumbers")
          ? trimmed
          : trimmed ? `${trimmed} showLineNumbers` : "showLineNumbers";
      },
    })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const file = await processor.process(markdown);
  return {
    contentHtml: String(file),
    toc,
  };
}
