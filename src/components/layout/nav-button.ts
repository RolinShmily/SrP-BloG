/**
 * Shared style for the compact, bordered icon buttons in the floating header.
 *
 * The header follows the pattern used by mengxiblog.top: a 32px square with a
 * hairline border, no fill, and a `hover:text-primary` accent, so the theme,
 * language and RSS controls read as one consistent cluster.
 */
export const navIconButtonClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
