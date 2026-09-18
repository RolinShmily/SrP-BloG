import type { Metadata } from "next";
import { getFriendLinks } from "@/lib/friends";
import { getSponsors } from "@/lib/sponsors";
import { createPageMetadata } from "@/lib/seo";
import { FriendCard } from "@/components/blog/friend-card";
import { FriendInfoBox } from "@/components/blog/friend-info-box";
import { Sponsorship, SponsorList } from "@/components/blog/sponsorship";
import { WalineComments } from "@/components/blog/waline-comments";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { T } from "@/components/i18n/t";
import { dictionaries } from "@/i18n";
import { siteConfig } from "@/config/site";
import { ArrowUpRight, Coffee } from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = createPageMetadata({
  title: "友情链接 (Friends)",
  description: "优秀的独立技术博客与创作者朋友们，欢迎交换友链共同成长。",
  path: "/friends/",
});

const zh = dictionaries.zh;
const en = dictionaries.en;

export default async function FriendsPage() {
  const [friends, sponsors] = await Promise.all([getFriendLinks(), getSponsors()]);

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div className="space-y-1 pb-2">
        <T
          as="h1"
          className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground"
          zh={zh.pages.friends.title}
          en={en.pages.friends.title}
        />
        <T
          as="p"
          className="text-sm text-muted-foreground"
          zh={zh.friends.subheading.replace("{count}", String(friends.length))}
          en={en.friends.subheading.replace("{count}", String(friends.length))}
        />
      </div>

      {/* Friends Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {friends.map((friend, idx) => (
          <div
            key={friend.name}
            className="card-animate-in"
            style={{ "--stagger-index": idx } as React.CSSProperties}
          >
            <FriendCard friend={friend} />
          </div>
        ))}
      </div>

      {/* Friend Link Application Guide */}
      <Card className="shadow-none">
        <CardHeader className="p-5 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">
            <T zh={zh.friends.apply} en={en.friends.apply} />
          </CardTitle>
          <CardDescription className="text-xs">
            <T zh={zh.friends.applyDescription} en={en.friends.applyDescription} />
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 pt-0 space-y-4">
          <div className="space-y-1.5">
            <T
              as="span"
              className="text-xs text-muted-foreground font-mono"
              zh={zh.friends.ourInfo}
              en={en.friends.ourInfo}
            />
            <FriendInfoBox />
          </div>

          {siteConfig.friendApplication?.enabled !== false && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {(siteConfig.friendApplication?.issueUrl || (siteConfig.repoUrl && `${siteConfig.repoUrl}/issues/new?template=friend_link.yml`)) && (
                <Button asChild size="sm">
                  <a
                    href={siteConfig.friendApplication?.issueUrl || `${siteConfig.repoUrl}/issues/new?template=friend_link.yml`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-1.5"
                  >
                    <T zh={zh.friends.applyViaGithub} en={en.friends.applyViaGithub} />
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                  </a>
                </Button>
              )}

              {(siteConfig.friendApplication?.prUrl || (siteConfig.repoUrl && `${siteConfig.repoUrl}/tree/main/content/friends`)) && (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={siteConfig.friendApplication?.prUrl || `${siteConfig.repoUrl}/tree/main/content/friends`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-1.5"
                  >
                    <T zh={zh.friends.applyViaPr} en={en.friends.applyViaPr} />
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sponsorship — the target of the article page's "buy me a coffee" tab. */}
      {siteConfig.sponsorship?.enabled !== false && (
        <section id="sponsors" className="scroll-mt-24 space-y-6">
          <div className="space-y-1 pb-2">
            {/* The icon sits outside <T>: Tailwind's preflight makes `svg`
                block-level, so nesting it inside the bilingual span would push
                the text onto its own line. */}
            <div className="flex items-center gap-2.5">
              <Coffee className="h-5 w-5 shrink-0 text-muted-foreground" />
              <T
                as="h2"
                className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground"
                zh={zh.sponsors.title}
                en={en.sponsors.title}
              />
            </div>
            <T
              as="p"
              className="text-sm text-muted-foreground"
              zh={zh.sponsors.description}
              en={en.sponsors.description}
            />
          </div>

          <Sponsorship />

          <T
            as="p"
            className="text-meta text-muted-foreground"
            zh={zh.sponsors.message}
            en={en.sponsors.message}
          />

          <div className="space-y-3 pt-2">
            <T
              as="h3"
              className="text-base font-semibold tracking-tight text-foreground"
              zh={zh.sponsors.thanks}
              en={en.sponsors.thanks}
            />
            <SponsorList sponsors={sponsors} />
          </div>
        </section>
      )}

      {/* Waline Comments Section */}
      <WalineComments path="/friends" />
    </main>
  );
}
