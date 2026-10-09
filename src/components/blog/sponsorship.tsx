import Image from "next/image";
import type { Sponsor } from "@/lib/sponsors";
import { siteConfig } from "@/config/site";
import { T } from "@/components/i18n/t";
import { dictionaries } from "@/i18n";
import { AlipayMark, WechatPayMark } from "@/components/icons/pay";

const zh = dictionaries.zh;
const en = dictionaries.en;

/**
 * The two scannable payment codes.
 *
 * Ported from the reference theme: the code sits behind its payment-mark glyph,
 * blurred and dimmed, and sharpens on hover. That reveal is deliberately gated
 * behind `@media (hover: hover)` in `globals.css` — on a touch device the code
 * is sharp from the start, because a permanently blurred QR code cannot be
 * scanned. The caption under each card carries the label that the hover overlay
 * provides on pointer devices.
 */
export function Sponsorship() {
  const alipayImg = siteConfig.sponsorship?.alipay || "/sponsors/alipay.png";
  const wechatImg = siteConfig.sponsorship?.wechat || "/sponsors/wechat.png";
  const afdianRaw = siteConfig.sponsorship?.afdianSlug || siteConfig.sponsorship?.afdian;
  const afdianUrl = afdianRaw
    ? afdianRaw.startsWith("http://") || afdianRaw.startsWith("https://")
      ? afdianRaw
      : `https://afdian.com/a/${afdianRaw}`
    : undefined;
  const afdianButtonZh = siteConfig.sponsorship?.afdianButtonZh || "/sponsors/afdian-button-zh.svg";
  const afdianButtonEn = siteConfig.sponsorship?.afdianButtonEn || "/sponsors/afdian-button-en.svg";

  const methods = [
    {
      key: "alipay",
      image: alipayImg,
      zh: zh.sponsors.alipay,
      en: en.sponsors.alipay,
      Icon: AlipayMark,
    },
    {
      key: "wechat",
      image: wechatImg,
      zh: zh.sponsors.wechat,
      en: en.sponsors.wechat,
      Icon: WechatPayMark,
    },
  ];

  return (
    <div className="space-y-4">
      {afdianUrl && (
        <div className="flex justify-center sm:justify-start">
          <a
            href={afdianUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={zh.sponsors.afdian}
          >
            <T
              zh={
                <Image
                  src={afdianButtonZh}
                  alt={zh.sponsors.afdian}
                  width={200}
                  height={56}
                  unoptimized
                  className="h-11 w-auto sm:h-12 rounded-[10px] shadow-sm transition-shadow group-hover:shadow-md group-hover:shadow-purple-500/20"
                />
              }
              en={
                <Image
                  src={afdianButtonEn}
                  alt={en.sponsors.afdian}
                  width={220}
                  height={56}
                  unoptimized
                  className="h-11 w-auto sm:h-12 rounded-[10px] shadow-sm transition-shadow group-hover:shadow-md group-hover:shadow-purple-500/20"
                />
              }
            />
          </a>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-start">
        {methods.map(({ key, image, zh: zhLabel, en: enLabel, Icon }) => (
          <figure key={key} className="flex flex-col items-center gap-2">
            <div className="sponsorship-card card-spotlight card-interactive relative overflow-hidden rounded-xl border border-border bg-white dark:bg-zinc-900">
              <div className="sponsorship-card-icon absolute inset-0 z-10 items-center justify-center text-zinc-800 dark:text-zinc-100">
                <Icon className="h-20 w-20" />
              </div>
              <Image
                src={image}
                alt={`${zhLabel} / ${enLabel}`}
                width={400}
                height={400}
                className="sponsorship-card-img block h-auto w-60 max-w-full"
              />
            </div>
            <figcaption className="text-meta text-muted-foreground">
              <T zh={zhLabel} en={enLabel} />
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

interface SponsorListProps {
  sponsors: Sponsor[];
  /**
   * Amount that fills the progress bar behind each card. Only a presentation
   * aid — sponsorship is a gift, not a target, so this is intentionally loose.
   */
  progressMax?: number;
}

/**
 * Contributor roll-call, ported from the reference theme's sponsors grid.
 *
 * Each card carries the amount as a background fill whose width is the amount
 * relative to `progressMax`; the avatar is rendered when the entry has one.
 */
export function SponsorList({ sponsors, progressMax = 520 }: SponsorListProps) {
  if (sponsors.length === 0) {
    return (
      <p className="text-meta text-muted-foreground">
        <T zh={zh.sponsors.empty} en={en.sponsors.empty} />
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sponsors.map((sponsor) => {
        const fill = Math.min(sponsor.amount / progressMax, 1) * 100;

        return (
          <div
            key={sponsor.name}
            className="card-spotlight card-interactive relative h-full overflow-hidden rounded-xl border border-border/70 bg-card/50 hover:border-border hover:bg-card px-4 py-3"
          >
            {/* Amount fill, kept behind the copy so the card still reads as text. */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 z-0 bg-muted"
              style={{ width: `${fill}%` }}
            />

            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                {sponsor.avatar && (
                  <span
                    aria-hidden="true"
                    className="h-8 w-8 shrink-0 rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url(${JSON.stringify(sponsor.avatar)})` }}
                  />
                )}
                <span className="line-clamp-1 font-medium text-foreground font-mono">{sponsor.name}</span>
              </div>

              <div className="text-xs text-muted-foreground">
                <span className="font-mono">{sponsor.date}</span>
                {sponsor.platform && <span> by {sponsor.platform}</span>}
              </div>
            </div>

            <span className="absolute bottom-2 right-4 z-10 font-medium text-foreground font-mono">
              {sponsor.currency === "USD" ? "$" : "¥"}{sponsor.amount}
            </span>
          </div>
        );
      })}
    </div>
  );
}
