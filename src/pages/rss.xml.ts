import rss from "@astrojs/rss";
import { getSortedPosts } from "@utils/content-utils";
import { url } from "@utils/url-utils";
import type { APIContext } from "astro";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { siteConfig } from "@/config";
import { parse as htmlParser } from "node-html-parser";
import { getImage } from "astro:assets";

const parser = new MarkdownIt();

// 1. 扫描范围锁定在 /src/content/assets/
const imagesGlob = import.meta.glob<{ default: ImageMetadata }>(
  "/src/content/assets/**/*.{jpeg,jpg,png,gif,webp,svg}"
);

function stripInvalidXmlChars(str: string): string {
  return str.replace(
    // biome-ignore lint/suspicious/noControlCharactersInRegex: https://www.w3.org/TR/xml/#charsets
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
    ""
  );
}

export async function GET(context: APIContext) {
  const blog = await getSortedPosts();
  const siteUrl = context.site?.toString() || "https://blog.srprolin.top";

  const items = await Promise.all(
    blog.map(async (post) => {
      const content =
        typeof post.body === "string" ? post.body : String(post.body || "");
      const cleanedContent = stripInvalidXmlChars(content);

      // 渲染 Markdown
      const html = htmlParser.parse(parser.render(cleanedContent));
      const images = html.querySelectorAll("img");

      for (const img of images) {
        const src = img.getAttribute("src");

        if (src && src.includes("assets/")) {
          const internalPath = src.replace("../assets", "/src/content/assets");

          const imageGetter = imagesGlob[internalPath];

          if (imageGetter) {
            const { default: asset } = await imageGetter();
            const optimizedImg = await getImage({ src: asset });

            const absoluteSrc = new URL(optimizedImg.src, siteUrl).href;
            img.setAttribute("src", absoluteSrc);
          }
        }
      }

      return {
        title: post.data.title,
        pubDate: post.data.published,
        description: post.data.description || "",
        link: url(`/posts/${post.slug}/`),
        content: sanitizeHtml(html.toString(), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: ["src", "alt", "title"],
          },
        }),
      };
    })
  );

  return rss({
    title: siteConfig.title,
    description: siteConfig.subtitle || "No description",
    site: siteUrl,
    items: items,
    customData: `<language>${siteConfig.lang}</language>`,
  });
}
