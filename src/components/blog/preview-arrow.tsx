import { cn } from "@/lib/utils";

interface PreviewArrowProps {
  className?: string;
}

/**
 * The animated "go there" arrow borrowed from the reference theme's cards.
 *
 * Two pieces move on hover: the tail line unfurls from nothing
 * (`scale-x-0 translate-x-4` → `scale-x-1 translate-x-1`) while the head slides
 * one step to the right. The parent must carry `group`.
 *
 * SVG children default to `transform-box: view-box`, so the Tailwind translate
 * and scale utilities map onto the viewBox units directly and need no
 * `transform-origin` override.
 */
export function PreviewArrow({ className }: PreviewArrowProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
        className="translate-x-4 scale-x-0 transition-all duration-300 ease-in-out group-hover:translate-x-1 group-hover:scale-x-100"
      />
      <polyline
        points="12 5 19 12 12 19"
        className="translate-x-0 transition-transform duration-300 ease-in-out group-hover:translate-x-1"
      />
    </svg>
  );
}
