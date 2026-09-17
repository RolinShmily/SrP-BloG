import type { ElementType, HTMLAttributes, ReactNode } from "react";

/**
 * Server-renderable bilingual text node.
 *
 * `output: "export"` pre-renders pages at build time, so a server component
 * cannot read the client-side locale state. Instead both languages are emitted
 * into the DOM and `globals.css` hides the inactive one via the
 * `html[data-locale]` attribute written by the pre-paint inline script.
 *
 * Use `<T>` in server components. Client components should prefer
 * `useLocale().t` so only one language string is shipped to the client.
 */
export interface TProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** Text shown when the active locale is `zh`. */
  zh: ReactNode;
  /** Text shown when the active locale is `en`. */
  en: ReactNode;
  /** Element to render as the wrapper (defaults to `span`). */
  as?: ElementType;
}

export function T({ zh, en, as: Tag = "span", ...rest }: TProps) {
  const Component = Tag as ElementType;
  return (
    <Component {...rest}>
      <span data-i18n="zh">{zh}</span>
      <span data-i18n="en">{en}</span>
    </Component>
  );
}
