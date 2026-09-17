"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/i18n/locale-provider";

interface ArticleContentProps {
  html: string;
}

export function ArticleContent({ html }: ArticleContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. External link security & target="_blank"
    const links = containerRef.current.querySelectorAll("a");
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });

    // 2. Enhance code blocks with top bar and Copy Code button
    const figures = containerRef.current.querySelectorAll<HTMLElement>(
      "figure[data-rehype-pretty-code-figure], pre"
    );

    figures.forEach((figure) => {
      if (
        figure.tagName === "PRE" &&
        figure.parentElement?.hasAttribute("data-rehype-pretty-code-figure")
      ) {
        return;
      }

      if (figure.querySelector(".code-block-header")) {
        return;
      }

      const pre = figure.tagName === "PRE" ? figure : figure.querySelector("pre");
      if (!pre) return;

      const code = pre.querySelector("code");

      const lang =
        figure.getAttribute("data-language") ||
        pre.getAttribute("data-language") ||
        code?.getAttribute("data-language") ||
        code?.className.match(/language-([a-zA-Z0-9_\-+]+)/)?.[1] ||
        "code";

      const header = document.createElement("div");
      header.className = "code-block-header";

      const langSpan = document.createElement("span");
      langSpan.className = "text-xs font-mono uppercase tracking-wider text-muted-foreground";
      langSpan.textContent = lang.toLowerCase();

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "code-copy-btn";
      copyBtn.setAttribute("aria-label", t.common.copy);

      const copySvg = `
        <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
      `;

      const checkSvg = `
        <svg class="h-3 w-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      `;

      const btnLabel = document.createElement("span");
      btnLabel.textContent = t.common.copy;

      copyBtn.innerHTML = copySvg;
      copyBtn.appendChild(btnLabel);

      copyBtn.onclick = async (e) => {
        e.preventDefault();
        const textToCopy = code?.textContent || pre.textContent || "";
        try {
          await navigator.clipboard.writeText(textToCopy);
          copyBtn.innerHTML = checkSvg;
          const successLabel = document.createElement("span");
          successLabel.textContent = t.common.copied;
          copyBtn.appendChild(successLabel);

          setTimeout(() => {
            copyBtn.innerHTML = copySvg;
            const resetLabel = document.createElement("span");
            resetLabel.textContent = t.common.copy;
            copyBtn.appendChild(resetLabel);
          }, 2000);
        } catch (err) {
          console.error("Failed to copy code block:", err);
        }
      };

      header.appendChild(langSpan);
      header.appendChild(copyBtn);

      figure.classList.add("code-block-wrapper");
      figure.insertBefore(header, figure.firstChild);
    });
  }, [html, t]);

  return (
    <div
      ref={containerRef}
      className="article-body prose prose-zinc dark:prose-invert max-w-none break-words"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
