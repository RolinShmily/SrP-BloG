import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { LocaleProvider } from "@/i18n/locale-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SpotlightEffect } from "@/components/layout/spotlight";
import { PageTransition } from "@/components/layout/page-transition";
import { RouteProgressBar } from "@/components/layout/route-progress";
import { siteConfig } from "@/config/site";
import "./globals.css";

/**
 * Display serif for the nav wordmark only.
 *
 * The body font stack (Maple Mono NF CN) is a locally-installed face, so it has
 * no italic to lean on. This adds a real editorial serif with a genuine italic
 * for the brand, and `next/font` self-hosts it at build time — no runtime request
 * to Google, which matters for a site read from mainland China.
 */
const displaySerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
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
    <html lang="zh-CN" data-locale="zh" className={displaySerif.variable} suppressHydrationWarning>
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
            <RouteProgressBar />
            <SpotlightEffect />
            <Navbar />
            <PageTransition>{children}</PageTransition>
            <Footer />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
