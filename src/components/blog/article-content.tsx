"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { openImagePreview } from "./image-previewer";

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

    // 2. Heading anchor `#` (hover to reveal anchor)
    const headings = containerRef.current.querySelectorAll<HTMLElement>(
      "h1, h2, h3, h4, h5, h6"
    );
    headings.forEach((heading) => {
      const id = heading.id || heading.getAttribute("id");
      if (!id) return;
      if (heading.querySelector(".header-anchor")) return;
      const anchor = document.createElement("a");
      anchor.className = "header-anchor";
      anchor.href = `#${id}`;
      anchor.setAttribute("aria-hidden", "true");
      anchor.textContent = "#";
      heading.insertBefore(anchor, heading.firstChild);
    });

    // 3. Responsive table container
    const tables = containerRef.current.querySelectorAll("table");
    tables.forEach((table) => {
      if (table.parentElement?.classList.contains("table-wrapper")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    // 4. Enhance code blocks (Butterfly-inspired):
    //  - Retain top bar: left shows fold chevron + uppercase language, supporting full collapse.
    //  - Right shows sleek copy button.
    //  - Bottom features dynamic pulsing double-chevron arrow to expand/collapse overflow code (>12 lines).
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

      // Remove any legacy elements if re-running
      figure.querySelector(".code-block-header")?.remove();
      figure.querySelector(".code-bottom-expander")?.remove();
      figure.querySelector(".code-action-box")?.remove();
      figure.querySelector(".code-collapse-mask")?.remove();

      const pre = figure.tagName === "PRE" ? figure : figure.querySelector("pre");
      if (!pre) return;

      const code = pre.querySelector("code");

      const rawLang =
        figure.getAttribute("data-language") ||
        pre.getAttribute("data-language") ||
        code?.getAttribute("data-language") ||
        code?.className.match(/language-([a-zA-Z0-9_\-+]+)/)?.[1] ||
        "";
      const displayLang = (rawLang || "code").toUpperCase();

      figure.classList.add("code-block-wrapper");

      // 4.1 Build top bar
      const header = document.createElement("div");
      header.className = "code-block-header";

      // Left: fold chevron + language label
      const headerLeft = document.createElement("button");
      headerLeft.type = "button";
      headerLeft.className = "code-header-left";
      headerLeft.setAttribute("aria-label", "折叠/展开代码块");
      headerLeft.setAttribute("title", "点击全量折叠/展开");

      const chevronSvg = `
        <svg class="code-collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      `;

      headerLeft.innerHTML = `
        ${chevronSvg}
        <span class="code-lang-label">${displayLang}</span>
      `;

      // Full collapse toggle
      headerLeft.onclick = (e) => {
        e.preventDefault();
        figure.classList.toggle("is-fully-collapsed");
      };

      // Right: Copy button
      const headerRight = document.createElement("div");
      headerRight.className = "code-header-right";

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "code-copy-btn";
      copyBtn.setAttribute("aria-label", t.common.copy);
      copyBtn.setAttribute("title", t.common.copy);

      const copySvg = `
        <svg class="code-copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
      `;

      const checkSvg = `
        <svg class="code-copy-icon text-[#f75c7e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      `;

      copyBtn.innerHTML = copySvg;

      copyBtn.onclick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const textToCopy = code?.textContent || pre.textContent || "";
        try {
          await navigator.clipboard.writeText(textToCopy);
          copyBtn.innerHTML = checkSvg;
          copyBtn.classList.add("copied");

          setTimeout(() => {
            copyBtn.innerHTML = copySvg;
            copyBtn.classList.remove("copied");
          }, 2000);
        } catch (err) {
          console.error("Failed to copy code block:", err);
        }
      };

      headerRight.appendChild(copyBtn);
      header.appendChild(headerLeft);
      header.appendChild(headerRight);

      figure.insertBefore(header, pre);

      // 4.2 Bottom expander for long code (> 12 lines)
      const lines = code ? code.querySelectorAll("[data-line]") : [];
      const lineCount = lines.length || (code?.textContent?.split("\n").length ?? 0);
      const isLong = lineCount > 12;

      if (isLong) {
        figure.classList.add("is-truncated");

        const bottomExpander = document.createElement("div");
        bottomExpander.className = "code-bottom-expander";
        bottomExpander.setAttribute("role", "button");
        bottomExpander.setAttribute("tabindex", "0");
        bottomExpander.setAttribute("title", t.post.showAllCode);

        // Double chevron down icon matching Butterfly theme
        const doubleChevronSvg = `
          <svg class="code-expand-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m7 6 5 5 5-5"/>
            <path d="m7 13 5 5 5-5"/>
          </svg>
        `;

        bottomExpander.innerHTML = doubleChevronSvg;

        const toggleTruncated = (e: Event) => {
          e.preventDefault();
          const isTruncated = figure.classList.contains("is-truncated");
          if (isTruncated) {
            // Smooth expand
            const currentHeight = pre.offsetHeight;
            pre.style.maxHeight = `${currentHeight}px`;
            // Trigger reflow
            pre.offsetHeight;
            const fullHeight = pre.scrollHeight;
            pre.style.maxHeight = `${fullHeight}px`;

            figure.classList.remove("is-truncated");
            figure.classList.add("is-expanded");
            bottomExpander.setAttribute("title", t.post.collapseCode);

            const onExpandEnd = () => {
              if (figure.classList.contains("is-expanded")) {
                pre.style.maxHeight = "none";
              }
              pre.removeEventListener("transitionend", onExpandEnd);
            };
            pre.addEventListener("transitionend", onExpandEnd);
          } else {
            // Smooth collapse
            const fullHeight = pre.scrollHeight;
            pre.style.maxHeight = `${fullHeight}px`;
            pre.offsetHeight; // force reflow
            pre.style.maxHeight = "380px";

            figure.classList.remove("is-expanded");
            figure.classList.add("is-truncated");
            bottomExpander.setAttribute("title", t.post.showAllCode);

            const rect = figure.getBoundingClientRect();
            if (rect.top < 80) {
              figure.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            const onCollapseEnd = () => {
              if (figure.classList.contains("is-truncated")) {
                pre.style.maxHeight = "";
              }
              pre.removeEventListener("transitionend", onCollapseEnd);
            };
            pre.addEventListener("transitionend", onCollapseEnd);
          }
        };

        bottomExpander.onclick = toggleTruncated;
        bottomExpander.onkeydown = (e) => {
          if (e.key === "Enter" || e.key === " ") {
            toggleTruncated(e);
          }
        };

        figure.appendChild(bottomExpander);
      }
    });

    // 5. Clickable image preview for article images
    const images = Array.from(
      containerRef.current.querySelectorAll<HTMLImageElement>("img")
    );
    images.forEach((img, idx) => {
      img.classList.add("cursor-zoom-in");
      img.setAttribute("role", "button");
      img.setAttribute("tabindex", "0");
      img.setAttribute(
        "title",
        img.getAttribute("alt") || t.common.viewAll || "Preview"
      );

      const handleImgClick = (e: MouseEvent) => {
        // If image is inside a non-image link, let default navigation proceed
        const parentLink = img.closest("a");
        if (parentLink) {
          const href = parentLink.getAttribute("href") || "";
          const isSelfImageLink =
            href === img.src ||
            Boolean(href.match(/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i));
          if (!isSelfImageLink) return;
          e.preventDefault();
        }

        const previewList = images
          .map((el) => ({
            src: el.currentSrc || el.getAttribute("src") || "",
            alt: el.getAttribute("alt") || el.getAttribute("title") || "",
          }))
          .filter((item) => Boolean(item.src));

        const targetSrc = img.currentSrc || img.getAttribute("src");
        const targetIndex = previewList.findIndex((item) => item.src === targetSrc);

        openImagePreview({
          images: previewList,
          initialIndex: targetIndex >= 0 ? targetIndex : idx,
        });
      };

      img.onclick = handleImgClick;
      img.onkeydown = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          img.click();
        }
      };
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
