"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { siteConfig } from "@/config/site";

export function FriendInfoBox() {
  const { t, locale } = useLocale();
  const [copied, setCopied] = useState(false);

  const info = siteConfig.friendSiteInfo;

  const formatKeyValueText = (lang: "zh" | "en") => {
    return Object.entries(info)
      .map(([key, val]) => {
        const text =
          typeof val === "object" && val !== null && lang in val
            ? val[lang]
            : String(val);
        return `${key}: ${text}`;
      })
      .join("\n");
  };

  const textZh = formatKeyValueText("zh");
  const textEn = formatKeyValueText("en");

  const handleCopy = async () => {
    const textToCopy = locale === "en" ? textEn : textZh;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy friend exchange info:", err);
    }
  };

  return (
    <div className="relative group rounded-lg border border-border bg-muted/40 font-mono text-xs text-foreground overflow-hidden">
      {/* Top-right copy button */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background/80 hover:bg-background px-2.5 py-1 text-[11px] font-sans text-muted-foreground hover:text-foreground backdrop-blur-sm transition-all shadow-xs active:scale-95 cursor-pointer"
          aria-label={copied ? t.common.copied : t.common.copy}
          title={copied ? t.common.copied : t.common.copy}
        >
          {copied ? (
            <>
              <Check className="size-3 text-primary animate-in fade-in zoom-in-75 duration-150" />
              <span className="text-primary font-medium">{t.common.copied}</span>
            </>
          ) : (
            <>
              <Copy className="size-3 opacity-70 group-hover:opacity-100" />
              <span>{t.common.copy}</span>
            </>
          )}
        </button>
      </div>

      {/* Bilingual preformatted key-value text */}
      <div className="p-3.5 pr-20 overflow-x-auto">
        <pre
          data-i18n="zh"
          className="leading-relaxed whitespace-pre font-mono text-xs select-text"
        >
          {textZh}
        </pre>
        <pre
          data-i18n="en"
          className="leading-relaxed whitespace-pre font-mono text-xs select-text"
        >
          {textEn}
        </pre>
      </div>
    </div>
  );
}
