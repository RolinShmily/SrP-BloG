import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Font-size tokens declared in `tailwind.config.ts` on top of Tailwind's
 * built-in scale.
 *
 * This list exists because of a real bug, not for tidiness. `tailwind-merge`
 * cannot tell a font size from a text colour on its own: it classifies every
 * `text-<something>` it does not recognise as a *colour*. So `text-meta` used to
 * land in the same conflict group as `text-primary-foreground`, and any
 * `cn()` call combining them silently dropped the colour — for example the
 * `variant="default"` pagination button, whose label then inherited the page
 * colour and rendered white-on-white in dark mode.
 *
 * Registering the tokens below as font sizes fixes that at the source, so the
 * pairing stays safe for every `Button` / `Badge` / `Card` that routes its
 * classes through `cn()`.
 *
 * ADDING A TOKEN: append it to `theme.fontSize` in `tailwind.config.ts` AND to
 * this array. `pnpm run verify-content` asserts the two stay in sync, so
 * forgetting this step fails the build instead of producing an invisible label.
 */
export const CUSTOM_FONT_SIZE_TOKENS = ["meta"] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...CUSTOM_FONT_SIZE_TOKENS] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
