import type { Metadata } from "next";
import Script from "next/script";
import {
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Noto_Sans_SC,
} from "next/font/google";
import { LocaleProvider } from "@/i18n/locale-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SpotlightEffect } from "@/components/layout/spotlight";
import { ImagePreviewer } from "@/components/blog/image-previewer";
import { PageTransition } from "@/components/layout/page-transition";
import { RouteProgressBar } from "@/components/layout/route-progress";
import { BackToTop } from "@/components/layout/back-to-top";
import { AmbientArt } from "@/components/art/ambient-art";
import { siteConfig } from "@/config/site";
import "./globals.css";

/**
 * Four-font type system (all self-hosted by `next/font` at build time — no
 * runtime request to Google, which matters for a site read from mainland
 * China):
 *
 * - `--font-latin`   Inter          — Latin body/prose text
 * - `--font-cjk-sc`  Noto Sans SC   — all Chinese text (Source Han Sans)
 * - `--font-mono-latin` JetBrains Mono — Latin/digits in code and UI chrome
 * - `--font-display` Instrument Serif — brand-only serif (nav wordmark)
 *
 * These four variables are composed into the real stacks (`--font-sans`,
 * `--font-mono`) in `globals.css`, where CJK falls back per-glyph: a Latin
 * string resolves to Inter/JetBrains Mono, a Han string to Noto Sans SC.
 */
const displaySerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

const bodyLatin = Inter({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-latin",
});

const bodyChinese = Noto_Sans_SC({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-cjk-sc",
});

const monoLatin = JetBrains_Mono({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-mono-latin",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.title} - ${siteConfig.subtitle}`,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author, url: siteConfig.homeUrl }],
  creator: siteConfig.author,
  icons: {
    icon: "/favicon/favicon.ico",
  },
  alternates: {
    types: {
      "application/rss+xml": siteConfig.rssUrl,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    alternateLocale: ["en_US"],
    url: siteConfig.url,
    siteName: siteConfig.title,
    title: {
      default: `${siteConfig.title} - ${siteConfig.subtitle}`,
      template: `%s | ${siteConfig.title}`,
    },
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.title} - ${siteConfig.subtitle}`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: `${siteConfig.title} - ${siteConfig.subtitle}`,
      template: `%s | ${siteConfig.title}`,
    },
    description: siteConfig.description,
    creator: siteConfig.author,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.title} - ${siteConfig.subtitle}`,
      },
    ],
  },
  verification: {
    google:
      siteConfig.seo?.googleSearch?.enabled && siteConfig.seo.googleSearch.verificationCode
        ? siteConfig.seo.googleSearch.verificationCode
        : undefined,
    other: {
      ...(siteConfig.seo?.bingWebmaster?.enabled && siteConfig.seo.bingWebmaster.metaCode
        ? { "msvalidate.01": siteConfig.seo.bingWebmaster.metaCode }
        : {}),
    },
  },
};

/**
 * Pre-paint locale bootstrap. Mirrors `LocaleProvider.readInitialLocale` exactly:
 * `?lang=` → `localStorage["srp-locale"]` → `zh`. Runs before first paint so the
 * CSS `html[data-locale] [data-i18n]` rules never flash the wrong language.
 */
const LOCALE_INIT_SCRIPT = `(function(){try{var p=new URLSearchParams(location.search).get("lang");var v=(p==="zh"||p==="en")?p:null;if(!v){var s=localStorage.getItem("srp-locale");if(s==="zh"||s==="en")v=s;}if(!v)v="zh";document.documentElement.dataset.locale=v;document.documentElement.lang=v==="en"?"en":"zh-CN";}catch(e){document.documentElement.dataset.locale="zh";document.documentElement.lang="zh-CN";}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      data-locale="zh"
      className={`${displaySerif.variable} ${bodyLatin.variable} ${bodyChinese.variable} ${monoLatin.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_INIT_SCRIPT }} />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${siteConfig.title} RSS`}
          href={siteConfig.rssUrl}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <AmbientArt />
            <RouteProgressBar />
            <SpotlightEffect />
            <Navbar />
            <PageTransition>{children}</PageTransition>
            <Footer />
            <BackToTop />
            <ImagePreviewer />
          </LocaleProvider>
        </ThemeProvider>
        {siteConfig.seo?.googleAnalytics?.enabled &&
          siteConfig.seo.googleAnalytics.measurementId && (
            <>
              <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${siteConfig.seo.googleAnalytics.measurementId}`}
              />
              <Script id="google-analytics" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${siteConfig.seo.googleAnalytics.measurementId}');
                `}
              </Script>
            </>
          )}
      </body>
    </html>
  );
}
