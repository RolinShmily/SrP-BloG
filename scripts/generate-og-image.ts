import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import sharp from "sharp";
import { siteConfig, type OgCardConfig } from "../src/config/site";
import { getAllPosts } from "../src/lib/content";
import type { Post } from "../src/lib/content/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const fontCacheDir = path.join(rootDir, ".cache", "satori-fonts");

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const CANVAS = { width: 1200, height: 630 };

type El = { type: string; props: Record<string, unknown> };

const div = (style: Record<string, unknown>, children?: unknown): El => ({
  type: "div",
  props: children === undefined ? { style } : { style, children },
});

const text = (style: Record<string, unknown>, value: string): El => ({
  type: "div",
  props: { style, children: value },
});

function tidy(value: string): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function titleSize(title: string): number {
  const n = title.length;
  if (n <= 14) return 68;
  if (n <= 20) return 60;
  if (n <= 28) return 52;
  if (n <= 36) return 46;
  return 42;
}

export interface CardData {
  title: string;
  subtitle?: string;
  description?: string;
  tags: string[];
  date?: string;
  readingTime?: string;
  author: string;
  avatar?: string | null;
  domain: string;
  slug: string;
  isSite: boolean;
}

/* -------------------------------------------------------------------------- */
/*                          Theme & Background Engine                         */
/* -------------------------------------------------------------------------- */

const THEME_MAP: Record<
  OgCardConfig["theme"],
  { bg: string; cardBg: string; border: string; textPrimary: string; textMuted: string }
> = {
  obsidian: {
    bg: "#0A0A0C",
    cardBg: "rgba(18, 18, 24, 0.76)",
    border: "rgba(255, 255, 255, 0.09)",
    textPrimary: "#FAFAFA",
    textMuted: "#9CA3AF",
  },
  zinc: {
    bg: "#09090B",
    cardBg: "rgba(24, 24, 27, 0.78)",
    border: "rgba(255, 255, 255, 0.08)",
    textPrimary: "#F4F4F5",
    textMuted: "#A1A1AA",
  },
  slate: {
    bg: "#0B0F19",
    cardBg: "rgba(15, 23, 42, 0.78)",
    border: "rgba(255, 255, 255, 0.09)",
    textPrimary: "#F8FAFC",
    textMuted: "#94A3B8",
  },
  pure: {
    bg: "#000000",
    cardBg: "rgba(18, 18, 18, 0.86)",
    border: "rgba(255, 255, 255, 0.12)",
    textPrimary: "#FFFFFF",
    textMuted: "#A3A3A3",
  },
};

function getBackgroundStyle(cfg: OgCardConfig) {
  const theme = THEME_MAP[cfg.theme] || THEME_MAP.obsidian;
  const accent = cfg.accentColor;
  let bgImage: string | undefined;
  let bgSize: string | undefined;

  if (cfg.backgroundPattern === "glow") {
    bgImage = [
      `radial-gradient(circle at 10% -10%, ${hexToRgba(accent, 0.16)} 0%, transparent 48%)`,
      `radial-gradient(circle at 95% 108%, rgba(99,102,241,0.13) 0%, transparent 52%)`,
    ].join(", ");
  } else if (cfg.backgroundPattern === "grid") {
    bgImage = [
      `linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
      `linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
      `radial-gradient(circle at 85% 15%, ${hexToRgba(accent, 0.14)} 0%, transparent 50%)`,
    ].join(", ");
    bgSize = "40px 40px, 40px 40px, auto";
  } else if (cfg.backgroundPattern === "dots") {
    bgImage = [
      `radial-gradient(circle, rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)`,
      `radial-gradient(circle at 12% 12%, ${hexToRgba(accent, 0.13)} 0%, transparent 45%)`,
    ].join(", ");
    bgSize = "28px 28px, auto";
  }

  return {
    backgroundColor: theme.bg,
    backgroundImage: bgImage,
    backgroundSize: bgSize,
  };
}

function renderWatermark(textStr?: string): El | null {
  if (!textStr) return null;
  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        right: "-20px",
        bottom: "-40px",
        fontSize: "320px",
        fontWeight: 900,
        fontFamily: "JetBrains Mono",
        color: "rgba(255, 255, 255, 0.025)",
        lineHeight: 1,
        letterSpacing: "-0.05em",
        userSelect: "none",
        pointerEvents: "none",
        display: "flex",
      },
      children: textStr,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                        Template 1: Modern (Linear / Raycast)                */
/* -------------------------------------------------------------------------- */

function renderModernTemplate(data: CardData, cfg: OgCardConfig): El {
  const theme = THEME_MAP[cfg.theme] || THEME_MAP.obsidian;
  const accent = cfg.accentColor;
  const bgStyle = getBackgroundStyle(cfg);

  // Meta items for bottom bar
  const metaItems: unknown[] = [];
  if (cfg.showAuthor) {
    const avatarEl = data.avatar
      ? {
          type: "img",
          props: {
            src: data.avatar,
            style: {
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: `1.5px solid ${hexToRgba(accent, 0.5)}`,
            },
          },
        }
      : div(
          {
            width: "26px",
            height: "26px",
            borderRadius: "6px",
            backgroundColor: hexToRgba(accent, 0.2),
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "JetBrains Mono",
          },
          data.author.charAt(0)
        );

    metaItems.push(
      div({ display: "flex", alignItems: "center", gap: "10px" }, [
        avatarEl,
        text({ fontSize: "15px", fontWeight: 700, color: theme.textPrimary }, data.author),
      ])
    );
  }
  if (cfg.showDate && data.date) {
    if (metaItems.length > 0) metaItems.push(text({ fontSize: "14px", color: "#52525B" }, "·"));
    metaItems.push(
      text(
        { fontSize: "14px", fontFamily: "JetBrains Mono", color: theme.textMuted },
        data.date
      )
    );
  }
  if (cfg.showReadingTime && data.readingTime) {
    if (metaItems.length > 0) metaItems.push(text({ fontSize: "14px", color: "#52525B" }, "·"));
    metaItems.push(
      text(
        { fontSize: "14px", fontFamily: "Noto Sans SC", color: theme.textMuted },
        data.readingTime
      )
    );
  }

  return div(
    {
      display: "flex",
      position: "relative",
      width: "100%",
      height: "100%",
      padding: "36px 44px",
      boxSizing: "border-box",
      fontFamily: "Noto Sans SC",
      ...bgStyle,
    },
    [
      renderWatermark(cfg.watermark),
      // Inner Floating Card
      div(
        {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          borderRadius: "20px",
          border: `1px solid ${theme.border}`,
          backgroundColor: theme.cardBg,
          padding: "44px 52px",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
        },
        [
          // Top subtle light beam
          div({
            position: "absolute",
            top: 0,
            left: "15%",
            width: "70%",
            height: "2px",
            backgroundImage: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
            opacity: 0.75,
          }),
          // Card Top Rail
          div(
            {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            },
            [
              div({ display: "flex", alignItems: "center", gap: "14px" }, [
                div({
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: accent,
                  boxShadow: `0 0 12px ${accent}`,
                }),
                text(
                  {
                    fontSize: "17px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: theme.textPrimary,
                  },
                  siteConfig.title
                ),
                data.tags.length > 0
                  ? div(
                      {
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginLeft: "6px",
                      },
                      data.tags.slice(0, 2).map((t) =>
                        div(
                          {
                            padding: "3px 10px",
                            borderRadius: "100px",
                            backgroundColor: hexToRgba(accent, 0.12),
                            border: `1px solid ${hexToRgba(accent, 0.3)}`,
                            color: accent,
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                          },
                          t
                        )
                      )
                    )
                  : null,
              ]),
              div(
                {
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  borderRadius: "100px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.09)",
                },
                [
                  div({
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#10B981",
                  }),
                  text(
                    {
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      color: "#A1A1AA",
                      fontFamily: "JetBrains Mono",
                    },
                    cfg.siteBadge
                  ),
                ]
              ),
            ]
          ),
          // Card Body
          div(
            {
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: "1 1 auto",
              paddingTop: "24px",
              paddingBottom: "16px",
            },
            [
              data.isSite
                ? div({ display: "flex", alignItems: "baseline", gap: "18px" }, [
                    text(
                      {
                        fontSize: "76px",
                        fontWeight: 700,
                        letterSpacing: "-2px",
                        color: theme.textPrimary,
                      },
                      siteConfig.title
                    ),
                    text(
                      {
                        fontSize: "26px",
                        fontWeight: 400,
                        color: accent,
                      },
                      `/ ${siteConfig.subtitle}`
                    ),
                  ])
                : {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        fontSize: `${titleSize(data.title)}px`,
                        fontWeight: 700,
                        lineHeight: 1.18,
                        letterSpacing: "-0.5px",
                        color: theme.textPrimary,
                        maxWidth: "1000px",
                        overflow: "hidden",
                      },
                      children: data.title,
                    },
                  },
              cfg.showDescription && data.description
                ? text(
                    {
                      fontSize: "19px",
                      fontWeight: 400,
                      lineHeight: 1.65,
                      color: theme.textMuted,
                      marginTop: "22px",
                      maxWidth: "960px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    },
                    data.description
                  )
                : null,
            ].filter(Boolean) as unknown[]
          ),
          // Card Bottom Rail
          div({ display: "flex", flexDirection: "column", width: "100%" }, [
            div({
              width: "100%",
              height: "1px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              marginBottom: "20px",
            }),
            div(
              {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              },
              [
                div({ display: "flex", alignItems: "center", gap: "12px" }, metaItems),
                cfg.showDomain
                  ? div(
                      {
                        padding: "5px 14px",
                        borderRadius: "8px",
                        backgroundColor: hexToRgba(accent, 0.09),
                        border: `1px solid ${hexToRgba(accent, 0.25)}`,
                        color: accent,
                        fontSize: "14px",
                        fontWeight: 700,
                        fontFamily: "JetBrains Mono",
                      },
                      data.domain
                    )
                  : null,
              ].filter(Boolean) as unknown[]
            ),
          ]),
        ]
      ),
    ]
  );
}

/* -------------------------------------------------------------------------- */
/*                        Template 2: Editorial (Swiss Poster)                */
/* -------------------------------------------------------------------------- */

function renderEditorialTemplate(data: CardData, cfg: OgCardConfig): El {
  const theme = THEME_MAP[cfg.theme] || THEME_MAP.obsidian;
  const accent = cfg.accentColor;
  const bgStyle = getBackgroundStyle(cfg);

  const kicker =
    data.tags.length > 0 ? data.tags.slice(0, 2).join("   ·   ").toUpperCase() : cfg.siteBadge;

  const bottomItems: unknown[] = [];
  if (cfg.showAuthor) {
    bottomItems.push(
      div({ display: "flex", alignItems: "center", gap: "9px" }, [
        data.avatar
          ? {
              type: "img",
              props: {
                src: data.avatar,
                style: {
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: `1.5px solid ${hexToRgba(accent, 0.5)}`,
                },
              },
            }
          : null,
        text(
          {
            fontSize: "15px",
            fontWeight: 700,
            color: theme.textPrimary,
            fontFamily: "Noto Sans SC",
          },
          data.author
        ),
      ].filter(Boolean) as unknown[])
    );
  }
  if (cfg.showDate && data.date) {
    if (bottomItems.length > 0) bottomItems.push(text({ fontSize: "15px", color: "#52525B" }, "·"));
    bottomItems.push(
      text(
        {
          fontSize: "15px",
          fontWeight: 400,
          color: theme.textMuted,
          fontFamily: "JetBrains Mono",
        },
        data.date
      )
    );
  }
  if (cfg.showReadingTime && data.readingTime) {
    if (bottomItems.length > 0) bottomItems.push(text({ fontSize: "15px", color: "#52525B" }, "·"));
    bottomItems.push(
      text(
        {
          fontSize: "15px",
          fontWeight: 400,
          color: theme.textMuted,
          fontFamily: "Noto Sans SC",
        },
        data.readingTime
      )
    );
  }

  return div(
    {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      width: "100%",
      height: "100%",
      padding: "64px 76px",
      boxSizing: "border-box",
      fontFamily: "Noto Sans SC",
      position: "relative",
      overflow: "hidden",
      ...bgStyle,
    },
    [
      renderWatermark(cfg.watermark),
      // Top Rail
      div(
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        },
        [
          div({ display: "flex", alignItems: "center", gap: "11px" }, [
            div({
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: accent,
            }),
            text(
              {
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: theme.textMuted,
              },
              siteConfig.title
            ),
          ]),
          text(
            {
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#71717A",
              fontFamily: "JetBrains Mono",
            },
            cfg.siteBadge
          ),
        ]
      ),
      // Anchored Band
      div(
        {
          display: "flex",
          flexDirection: "column",
          flex: "1 1 auto",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          paddingBottom: "56px",
        },
        [
          text(
            {
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: accent,
              marginBottom: "16px",
            },
            kicker
          ),
          div({
            width: "52px",
            height: "2px",
            backgroundColor: accent,
            marginBottom: "26px",
            opacity: 0.85,
          }),
          data.isSite
            ? div({ display: "flex", alignItems: "baseline", gap: "20px" }, [
                text(
                  {
                    fontSize: "84px",
                    fontWeight: 700,
                    lineHeight: 1.05,
                    letterSpacing: "-2px",
                    color: theme.textPrimary,
                  },
                  siteConfig.title
                ),
                text(
                  {
                    fontSize: "26px",
                    fontWeight: 400,
                    color: accent,
                    letterSpacing: "0.02em",
                  },
                  `/ ${siteConfig.subtitle}`
                ),
              ])
            : {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: `${titleSize(data.title)}px`,
                    fontWeight: 700,
                    lineHeight: 1.18,
                    letterSpacing: "-0.5px",
                    color: theme.textPrimary,
                    maxWidth: "1000px",
                    overflow: "hidden",
                  },
                  children: data.title,
                },
              },
          cfg.showDescription && data.description
            ? text(
                {
                  fontSize: "20px",
                  fontWeight: 400,
                  lineHeight: 1.7,
                  color: theme.textMuted,
                  marginTop: "26px",
                  maxWidth: "920px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                },
                data.description
              )
            : null,
        ].filter(Boolean) as unknown[]
      ),
      // Bottom Rail
      div({ display: "flex", flexDirection: "column", width: "100%" }, [
        div({
          width: "100%",
          height: "1px",
          backgroundColor: theme.border,
          marginBottom: "22px",
        }),
        div(
          {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          },
          [
            div({ display: "flex", alignItems: "center", gap: "12px" }, bottomItems),
            cfg.showDomain
              ? text(
                  {
                    fontSize: "15px",
                    fontWeight: 700,
                    fontFamily: "JetBrains Mono",
                    color: accent,
                  },
                  data.domain
                )
              : null,
          ].filter(Boolean) as unknown[]
        ),
      ]),
    ]
  );
}

/* -------------------------------------------------------------------------- */
/*                        Template 3: Terminal (macOS Geek)                   */
/* -------------------------------------------------------------------------- */

function renderTerminalTemplate(data: CardData, cfg: OgCardConfig): El {
  const theme = THEME_MAP[cfg.theme] || THEME_MAP.obsidian;
  const accent = cfg.accentColor;
  const bgStyle = getBackgroundStyle(cfg);

  const filePath = data.isSite ? "~/blog/site.config" : `~/posts/${data.slug}.md`;

  return div(
    {
      display: "flex",
      position: "relative",
      width: "100%",
      height: "100%",
      padding: "34px 44px",
      boxSizing: "border-box",
      fontFamily: "JetBrains Mono",
      ...bgStyle,
    },
    [
      renderWatermark(cfg.watermark),
      // macOS Terminal Window
      div(
        {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          borderRadius: "16px",
          border: `1px solid ${theme.border}`,
          backgroundColor: theme.cardBg,
          boxSizing: "border-box",
          overflow: "hidden",
        },
        [
          // Terminal Window Titlebar
          div(
            {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "46px",
              padding: "0 20px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              borderBottom: `1px solid ${theme.border}`,
            },
            [
              // Traffic lights
              div({ display: "flex", alignItems: "center", gap: "8px" }, [
                div({ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FF5F56" }),
                div({ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FFBD2E" }),
                div({ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#27C93F" }),
              ]),
              // Center breadcrumb path
              text(
                {
                  fontSize: "13px",
                  color: "#A1A1AA",
                  letterSpacing: "0.04em",
                },
                filePath
              ),
              // Right branch
              div(
                {
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "#71717A",
                },
                [
                  div({ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: accent }),
                  text({}, "git:(main)"),
                ]
              ),
            ]
          ),
          // Terminal Window Body
          div(
            {
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: "1 1 auto",
              padding: "36px 48px",
            },
            [
              // Prompt line
              div(
                {
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "15px",
                  marginBottom: "24px",
                },
                [
                  text({ color: "#10B981", fontWeight: 700 }, "➜"),
                  text({ color: "#60A5FA" }, `~/${siteConfig.title.toLowerCase()}`),
                  text({ color: "#F43F5E" }, "git:(main)"),
                  text({ color: "#E4E4E7" }, `$ cat ${data.isSite ? "site.json" : "post.md"}`),
                ]
              ),
              // Headline with Markdown # prefix
              div({ display: "flex", alignItems: "baseline", gap: "14px" }, [
                text(
                  {
                    fontSize: `${titleSize(data.title)}px`,
                    fontWeight: 700,
                    color: accent,
                    lineHeight: 1.15,
                  },
                  "#"
                ),
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      fontSize: `${titleSize(data.title)}px`,
                      fontWeight: 700,
                      lineHeight: 1.15,
                      letterSpacing: "-0.5px",
                      color: theme.textPrimary,
                      fontFamily: "Noto Sans SC",
                      maxWidth: "960px",
                      overflow: "hidden",
                    },
                    children: data.title,
                  },
                },
                data.subtitle
                  ? text(
                      {
                        fontSize: "24px",
                        fontWeight: 400,
                        color: accent,
                        marginLeft: "6px",
                      },
                      `/ ${data.subtitle}`
                    )
                  : null,
              ]),
              // Description in blockquote style
              cfg.showDescription && data.description
                ? div(
                    {
                      display: "flex",
                      borderLeft: `3px solid ${hexToRgba(accent, 0.6)}`,
                      paddingLeft: "16px",
                      marginTop: "20px",
                      maxWidth: "940px",
                    },
                    [
                      text(
                        {
                          fontSize: "18px",
                          fontWeight: 400,
                          lineHeight: 1.6,
                          color: theme.textMuted,
                          fontFamily: "Noto Sans SC",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        },
                        data.description
                      ),
                    ]
                  )
                : null,
            ].filter(Boolean) as unknown[]
          ),
          // Terminal Status Bar (Vim / IDE statusline)
          div(
            {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "40px",
              padding: "0 20px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              borderTop: `1px solid ${theme.border}`,
              fontSize: "13px",
            },
            [
              div({ display: "flex", alignItems: "center", gap: "14px" }, [
                div(
                  {
                    padding: "2px 8px",
                    borderRadius: "4px",
                    backgroundColor: accent,
                    color: "#000000",
                    fontWeight: 700,
                    fontSize: "12px",
                  },
                  "NORMAL"
                ),
                text({ color: "#A1A1AA" }, "UTF-8"),
                text({ color: "#52525B" }, "│"),
                cfg.showAuthor
                  ? div({ display: "flex", alignItems: "center", gap: "8px" }, [
                      data.avatar
                        ? {
                            type: "img",
                            props: {
                              src: data.avatar,
                              style: {
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                border: `1px solid ${accent}`,
                              },
                            },
                          }
                        : null,
                      text({ color: theme.textPrimary, fontWeight: 700 }, data.author),
                    ].filter(Boolean) as unknown[])
                  : null,
                cfg.showDate && data.date
                  ? div({ display: "flex", alignItems: "center", gap: "12px" }, [
                      text({ color: "#52525B" }, "│"),
                      text({ color: theme.textMuted }, data.date),
                    ])
                  : null,
                cfg.showReadingTime && data.readingTime
                  ? div({ display: "flex", alignItems: "center", gap: "12px" }, [
                      text({ color: "#52525B" }, "│"),
                      text({ color: theme.textMuted, fontFamily: "Noto Sans SC" }, data.readingTime),
                    ])
                  : null,
              ].filter(Boolean) as unknown[]),
              cfg.showDomain
                ? text({ color: accent, fontWeight: 700 }, data.domain)
                : null,
            ].filter(Boolean) as unknown[]
          ),
        ]
      ),
    ]
  );
}

/* -------------------------------------------------------------------------- */
/*                        Template 4: Matrix (Technical Blueprint)            */
/* -------------------------------------------------------------------------- */

function renderMatrixTemplate(data: CardData, cfg: OgCardConfig): El {
  const theme = THEME_MAP[cfg.theme] || THEME_MAP.obsidian;
  const accent = cfg.accentColor;
  const bgStyle = getBackgroundStyle(cfg);

  return div(
    {
      display: "flex",
      position: "relative",
      width: "100%",
      height: "100%",
      padding: "44px 52px",
      boxSizing: "border-box",
      fontFamily: "JetBrains Mono",
      ...bgStyle,
    },
    [
      renderWatermark(cfg.watermark),
      // Outer Corner Crosshairs
      text(
        { position: "absolute", top: "30px", left: "38px", fontSize: "24px", color: accent, fontWeight: 700 },
        "+"
      ),
      text(
        { position: "absolute", top: "30px", right: "38px", fontSize: "24px", color: accent, fontWeight: 700 },
        "+"
      ),
      text(
        { position: "absolute", bottom: "30px", left: "38px", fontSize: "24px", color: accent, fontWeight: 700 },
        "+"
      ),
      text(
        { position: "absolute", bottom: "30px", right: "38px", fontSize: "24px", color: accent, fontWeight: 700 },
        "+"
      ),
      // Inset Dashed Frame
      div(
        {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          border: "1px dashed rgba(255, 255, 255, 0.16)",
          padding: "32px 40px",
          boxSizing: "border-box",
        },
        [
          // Header Readout
          div(
            {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            },
            [
              text(
                { fontSize: "14px", fontWeight: 700, letterSpacing: "0.15em", color: accent },
                `[ SYS // ${siteConfig.title.toUpperCase()} ]`
              ),
              div(
                { display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "#A1A1AA" },
                [
                  text({}, `[ REF: ${data.slug.toUpperCase() || "SITE_ROOT"} ]`),
                  text({ color: "#10B981" }, "[ STATUS: ACTIVE ]"),
                ]
              ),
            ]
          ),
          // Blueprint Body
          div(
            {
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: "1 1 auto",
              paddingTop: "24px",
              paddingBottom: "16px",
            },
            [
              data.tags.length > 0
                ? div(
                    { display: "flex", gap: "10px", marginBottom: "16px" },
                    data.tags.slice(0, 3).map((t) =>
                      div(
                        {
                          padding: "3px 10px",
                          borderRadius: "4px",
                          backgroundColor: hexToRgba(accent, 0.12),
                          border: `1px solid ${hexToRgba(accent, 0.35)}`,
                          color: accent,
                          fontSize: "12px",
                          fontWeight: 700,
                        },
                        `// ${t.toUpperCase()}`
                      )
                    )
                  )
                : null,
              div({ display: "flex", alignItems: "baseline", gap: "16px" }, [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      fontSize: `${titleSize(data.title)}px`,
                      fontWeight: 700,
                      lineHeight: 1.15,
                      letterSpacing: "-0.5px",
                      color: theme.textPrimary,
                      fontFamily: "Noto Sans SC",
                      maxWidth: "960px",
                      overflow: "hidden",
                    },
                    children: data.title,
                  },
                },
                data.subtitle
                  ? text(
                      {
                        fontSize: "24px",
                        fontWeight: 400,
                        color: accent,
                      },
                      `/ ${data.subtitle}`
                    )
                  : null,
              ]),
              cfg.showDescription && data.description
                ? div(
                    {
                      display: "flex",
                      borderLeft: `3px solid ${accent}`,
                      paddingLeft: "16px",
                      marginTop: "20px",
                      maxWidth: "940px",
                    },
                    [
                      text(
                        {
                          fontSize: "18px",
                          fontWeight: 400,
                          lineHeight: 1.6,
                          color: theme.textMuted,
                          fontFamily: "Noto Sans SC",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        },
                        data.description
                      ),
                    ]
                  )
                : null,
            ].filter(Boolean) as unknown[]
          ),
          // Blueprint Footer Readout
          div(
            {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              paddingTop: "16px",
              borderTop: "1px dashed rgba(255, 255, 255, 0.16)",
              fontSize: "13px",
              color: "#9CA3AF",
            },
            [
              div({ display: "flex", alignItems: "center", gap: "16px" }, [
                cfg.showAuthor
                  ? div({ display: "flex", alignItems: "center", gap: "8px" }, [
                      data.avatar
                        ? {
                            type: "img",
                            props: {
                              src: data.avatar,
                              style: {
                                width: "20px",
                                height: "20px",
                                borderRadius: "4px",
                                border: `1px solid ${accent}`,
                              },
                            },
                          }
                        : null,
                      text({}, `OPERATOR: ${data.author}`),
                    ].filter(Boolean) as unknown[])
                  : null,
                data.isSite
                  ? text({}, `STACK: Next.js 15`)
                  : cfg.showDate && data.date
                  ? text({}, `DATE: ${data.date}`)
                  : null,
                data.isSite
                  ? text({ fontFamily: "Noto Sans SC" }, `ENGINE: Satori · Pagefind`)
                  : cfg.showReadingTime && data.readingTime
                  ? text({ fontFamily: "Noto Sans SC" }, `DURATION: ${data.readingTime}`)
                  : null,
              ].filter(Boolean) as unknown[]),
              cfg.showDomain
                ? text({ color: accent, fontWeight: 700 }, `ORIGIN // ${data.domain}`)
                : null,
            ].filter(Boolean) as unknown[]
          ),
        ]
      ),
    ]
  );
}

/* -------------------------------------------------------------------------- */
/*                             Template Dispatcher                            */
/* -------------------------------------------------------------------------- */

function renderCard(data: CardData, cfg: OgCardConfig): El {
  switch (cfg.template) {
    case "modern":
      return renderModernTemplate(data, cfg);
    case "editorial":
      return renderEditorialTemplate(data, cfg);
    case "terminal":
      return renderTerminalTemplate(data, cfg);
    case "matrix":
      return renderMatrixTemplate(data, cfg);
    default:
      return renderModernTemplate(data, cfg);
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Rendering                                 */
/* -------------------------------------------------------------------------- */

interface FontSpec {
  name: string;
  weight: 400 | 700;
  file: string;
  url: string;
}

const FONT_SPECS: FontSpec[] = [
  {
    name: "Noto Sans SC",
    weight: 400,
    file: "noto-sans-sc-400.woff",
    url: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-400-normal.woff",
  },
  {
    name: "Noto Sans SC",
    weight: 700,
    file: "noto-sans-sc-700.woff",
    url: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-700-normal.woff",
  },
  {
    name: "JetBrains Mono",
    weight: 400,
    file: "jetbrains-mono-400.woff",
    url: "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.woff",
  },
  {
    name: "JetBrains Mono",
    weight: 700,
    file: "jetbrains-mono-700.woff",
    url: "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-700-normal.woff",
  },
];

async function loadFonts() {
  fs.mkdirSync(fontCacheDir, { recursive: true });

  const fonts = [];
  for (const spec of FONT_SPECS) {
    const filePath = path.join(fontCacheDir, spec.file);
    let data: Buffer;

    if (fs.existsSync(filePath)) {
      data = fs.readFileSync(filePath);
    } else {
      console.log(`[og] Downloading font ${spec.file}…`);
      const response = await fetch(spec.url);
      if (!response.ok) {
        throw new Error(`Failed to download ${spec.url}: HTTP ${response.status}`);
      }
      data = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filePath, data);
    }

    fonts.push({ name: spec.name, data, weight: spec.weight, style: "normal" as const });
  }

  return fonts;
}

async function renderPng(element: El, fonts: Awaited<ReturnType<typeof loadFonts>>) {
  const svg = await satori(element as never, {
    ...CANVAS,
    fonts,
    embedFont: false,
  });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: false }).toBuffer();
}

function loadAvatarDataUri(): string | null {
  const avatarPath = path.join(rootDir, "public", "avatar.png");
  if (!fs.existsSync(avatarPath)) return null;
  const buf = fs.readFileSync(avatarPath);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

const globalAvatarUri = loadAvatarDataUri();

function cleanDomain(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function postToCardData(post: Post): CardData {
  return {
    title: tidy(post.title).replace(/\s*\+\s*/g, " + "),
    description: tidy(post.description || post.excerpt || ""),
    tags: post.tags || [],
    date: post.updated && post.updated !== post.published ? post.updated : post.published,
    readingTime: post.readingTime || "",
    author: siteConfig.author,
    avatar: globalAvatarUri,
    domain: cleanDomain(siteConfig.url),
    slug: post.slug,
    isSite: false,
  };
}

function siteToCardData(): CardData {
  return {
    title: siteConfig.title,
    subtitle: siteConfig.subtitle,
    description: tidy(siteConfig.description),
    tags: siteConfig.keywords || [],
    author: siteConfig.author,
    avatar: globalAvatarUri,
    date: "Next.js 15",
    readingTime: "Satori · Pagefind",
    domain: cleanDomain(siteConfig.url),
    slug: "site",
    isSite: true,
  };
}

export async function generateAllOgImages() {
  const ogDir = path.join(rootDir, "public", "og");
  const postsOgDir = path.join(ogDir, "posts");
  fs.mkdirSync(postsOgDir, { recursive: true });

  const fonts = await loadFonts();
  const cfg = siteConfig.ogCard;

  // 1. Site-wide card
  const sitePng = await renderPng(renderCard(siteToCardData(), cfg), fonts);
  const sitePngPath = path.join(ogDir, "og.png");
  fs.writeFileSync(sitePngPath, sitePng);
  console.log(`[og] Site card (${cfg.template}) -> ${path.relative(rootDir, sitePngPath)}`);

  // 2. Per-post cards
  const posts = await getAllPosts({ includeDrafts: false });
  for (const post of posts) {
    const png = await renderPng(renderCard(postToCardData(post), cfg), fonts);
    fs.writeFileSync(path.join(postsOgDir, `${post.slug}.png`), png);
  }
  console.log(`[og] ${posts.length} article cards (${cfg.template}) -> public/og/posts/`);
}

/**
 * Preview renderer: generates sample cards for each template into a specified directory.
 */
export async function renderPreviews(outDir: string, samplePost?: Post) {
  fs.mkdirSync(outDir, { recursive: true });
  const fonts = await loadFonts();
  const templates: OgCardConfig["template"][] = ["modern", "editorial", "terminal", "matrix"];

  const sampleData: CardData = samplePost
    ? postToCardData(samplePost)
    : {
        title: "借助cloudflare + resend搭建最简域名邮箱",
        description:
          "在网站上展示与网站域名相同的邮箱地址，是较为可信的做法，因此萌生搭建一个简易域名邮箱的收发服务，好在cloudflare+resend可以免费提供相应支持，只需稍加操作。",
        tags: ["Cloudflare", "Resend", "Email"],
        date: "2026-10-27",
        readingTime: "3 分钟阅读",
        author: siteConfig.author,
        avatar: globalAvatarUri,
        domain: cleanDomain(siteConfig.url),
        slug: "59-email-1",
        isSite: false,
      };

  const siteData = siteToCardData();

  for (const t of templates) {
    const testCfg: OgCardConfig = {
      ...siteConfig.ogCard,
      template: t,
    };
    const postPng = await renderPng(renderCard(sampleData, testCfg), fonts);
    const postDest = path.join(outDir, `preview-${t}-post.png`);
    fs.writeFileSync(postDest, postPng);

    const sitePng = await renderPng(renderCard(siteData, testCfg), fonts);
    const siteDest = path.join(outDir, `preview-${t}-site.png`);
    fs.writeFileSync(siteDest, sitePng);

    console.log(`[og preview] Rendered template '${t}' (post & site) -> ${outDir}`);
  }
}

if (process.argv[1] === __filename) {
  if (process.argv.includes("--preview")) {
    const previewDir = path.join(rootDir, ".cache", "og-previews");
    renderPreviews(previewDir).catch((error) => {
      console.error("[og] Failed to render previews:", error);
      process.exit(1);
    });
  } else {
    generateAllOgImages().catch((error) => {
      console.error("[og] Failed to render Open Graph cards:", error);
      process.exit(1);
    });
  }
}
