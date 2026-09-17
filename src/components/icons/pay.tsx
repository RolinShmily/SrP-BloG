/**
 * Payment-method marks for the sponsorship section.
 *
 * Both glyphs are MingCute outline icons (the set the reference theme uses for
 * its Alipay / WeChat Pay cards). They are inlined rather than pulled from an
 * icon package because the project ships no icon runtime: every other brand mark
 * in this directory is a plain component too.
 *
 * MingCute draws each icon as a `fill="none"` shadow path plus one
 * `fill="currentColor"` path; only the latter is kept. The shadow path carries
 * the sub-pixel artefacts MingCute uses to keep the outline crisp, which renders
 * as nothing at all here and would only bloat the bundle.
 */

interface PayMarkProps {
  className?: string;
}

/** Shared shell: 24x24 grid, tinted by the surrounding text colour. */
function Mark({ d, className }: PayMarkProps & { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      aria-hidden="true"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

/** MingCute alipay-line. */
export function AlipayMark({ className }: PayMarkProps) {
  return (
    <Mark
      className={className}
      d="M20.225 17.689A9.99 9.99 0 0 1 12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10a9.95 9.95 0 0 1-1.59 5.414a1 1 0 0 1-.185.275M4 12a8 8 0 1 1 15.089 3.712q-1.24-.573-2.3-1.075q-1.12-.528-2.06-.96c.408-.801.813-1.74 1.21-2.835A1 1 0 0 0 15 9.5h-2V9h3a1 1 0 1 0 0-2h-3V6a1 1 0 1 0-2 0v1H8a1 1 0 0 0 0 2h3v.5H9a1 1 0 1 0 0 2h4.534a19 19 0 0 1-.647 1.384C11.494 12.334 10.267 12 9 12c-1.52 0-3 1.316-3 3c0 1.82 1.632 3 3.5 3c1.02 0 2.148-.359 3.27-1.48c.31-.312.62-.68.928-1.114c.657.297 1.374.634 2.178 1.013c.625.294 1.303.613 2.048.958A8 8 0 0 1 4 12m5 2c.827 0 1.687.194 2.797.608a6 6 0 0 1-.442.497C10.602 15.86 9.98 16 9.5 16C8.368 16 8 15.38 8 15c0-.516.52-1 1-1"
    />
  );
}

/** MingCute wechat-pay-line. */
export function WechatPayMark({ className }: PayMarkProps) {
  return (
    <Mark
      className={className}
      d="M12 5c-4.597 0-8 3.073-8 6.5c0 2.014 1.141 3.872 3.042 5.096c.427.276.648.688.766 1.022c.137.384.19.794.206 1.2c.38-.156.674-.433 1.004-.67v-.001c.15-.108.591-.424 1.168-.315q.875.166 1.814.168c4.597 0 8-3.073 8-6.5c0-.91-.231-1.782-.657-2.578l-9.306 5.922a1 1 0 0 1-1.405-.348l-2-3.5a1 1 0 0 1 1.383-1.353l1.58.947a1 1 0 0 0 .944.046l7.371-3.51C16.463 5.836 14.37 5 12 5M2 11.5C2 6.643 6.656 3 12 3c3.454 0 6.552 1.49 8.362 3.83C21.389 8.16 22 9.764 22 11.5c0 4.857-4.656 8.5-10 8.5q-.981-.001-1.911-.155c-.093.073-.253.205-.45.344C9.07 20.59 8.249 21 7 21a1 1 0 0 1-1-1c0-.389.046-.742.009-1.229c-.014-.174-.03-.366-.103-.527C3.577 16.723 2 14.298 2 11.5"
    />
  );
}
