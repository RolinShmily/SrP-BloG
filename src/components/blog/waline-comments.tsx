"use client";

import { useEffect, useRef } from "react";
import { siteConfig } from "@/config/site";
import { MessageSquare } from "lucide-react";
import type { WalineInstance } from "@waline/client";

import "@waline/client/style";
import "@waline/client/meta";
import "@/styles/waline.css";

interface WalineCommentsProps {
  path: string;
}

export function WalineComments({ path }: WalineCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const walineInstanceRef = useRef<WalineInstance | null>(null);

  const commentConfig = siteConfig.comment;
  const isEnabled = commentConfig?.enabled ?? false;
  const serverURL = commentConfig?.serverUrl || "";

  useEffect(() => {
    if (!isEnabled || !serverURL || !containerRef.current) {
      return;
    }

    let active = true;

    // Dynamically import init from @waline/client on client side
    import("@waline/client").then(({ init }) => {
      if (!active || !containerRef.current) return;

      walineInstanceRef.current = init({
        el: containerRef.current,
        serverURL,
        path,
        lang: "zh-CN",
        dark: "html.dark",
        locale: {
          placeholder: commentConfig?.placeholder ?? "说点什么吧... (支持 Markdown 语法)",
        },
        emoji: (commentConfig?.emoji as (`https://${string}` | `http://${string}` | `//${string}`)[]) ?? [
          "https://unpkg.com/@waline/emojis@1.4.0/weibo",
          "https://unpkg.com/@waline/emojis@1.4.0/bilibili",
        ],
        pageview: commentConfig?.pageview ?? false,
        comment: true,
        requiredMeta: (commentConfig?.requiredMeta as ("nick" | "mail" | "link")[]) ?? ["nick"],
      });
    });

    return () => {
      active = false;
      walineInstanceRef.current?.destroy();
      walineInstanceRef.current = null;
    };
  }, [isEnabled, serverURL, path, commentConfig?.emoji, commentConfig?.placeholder, commentConfig?.pageview, commentConfig?.requiredMeta]);

  if (!isEnabled) {
    return null;
  }

  return (
    <section id="comments" className="mt-10 sm:mt-12 space-y-4 pt-6 border-t border-border">
      <div className="flex items-center gap-2 text-foreground font-semibold text-lg">
        <MessageSquare className="h-5 w-5 text-[#f75c7e]" />
        <span>评论</span>
        <span className="text-xs font-normal text-muted-foreground font-mono">
          (Comments)
        </span>
      </div>

      {!serverURL ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          评论系统已就绪。请在 <code className="text-foreground">src/config/site.ts</code> 中配置{" "}
          <code className="text-foreground">comment.serverUrl</code> 后端服务器地址。
        </div>
      ) : (
        <div ref={containerRef} className="waline-custom-container" />
      )}
    </section>
  );
}
