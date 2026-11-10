import { siteConfig } from "@/config/site";

/** Resource route: emits `build/client/robots.txt` during prerender. */
export async function loader() {
  const body = [
    "User-Agent: *",
    "Allow: /",
    "",
    `Host: ${siteConfig.url}`,
    `Sitemap: ${siteConfig.url}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
