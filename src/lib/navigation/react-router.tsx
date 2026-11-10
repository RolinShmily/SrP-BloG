"use client";

import type { ComponentProps, CSSProperties, ImgHTMLAttributes } from "react";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useSearchParams as useRouterSearchParams,
} from "react-router";

/**
 * React Router implementation of the shared navigation primitives.
 *
 * The Next.js API is emulated one-to-one where components actually use it, so
 * shared components need no per-framework branching.
 */

type RouterLinkProps = ComponentProps<typeof RouterLink>;

export interface LinkProps extends Omit<RouterLinkProps, "to"> {
  /** Next.js-style destination; mapped onto React Router's `to`. */
  href: string;
  to?: RouterLinkProps["to"];
}

/**
 * `next/link` stand-in.
 *
 * React Router names the destination `to`; every shared component (and the
 * Next.js build) uses `href`. Passing `href` through unchanged silently
 * resolved to the current route, so the mapping is load-bearing.
 */
export function Link({ href, to, ...rest }: LinkProps) {
  return <RouterLink to={to ?? href} {...rest} />;
}

interface ImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  src: string;
  alt: string;
  /** Next.js `fill`: cover the nearest positioned ancestor. */
  fill?: boolean;
  /** Next.js `priority`: load eagerly and raise fetch priority. */
  priority?: boolean;
  /** Accepted for API parity; images are already unoptimized in this project. */
  unoptimized?: boolean;
  width?: number | string;
  height?: number | string;
}

/**
 * `next/image` stand-in.
 *
 * Next runs with `images.unoptimized: true`, so the only behaviour worth
 * preserving is the `fill` layout and eager loading for the hero image.
 */
export function Image({
  src,
  alt,
  fill,
  priority,
  unoptimized: _unoptimized,
  width,
  height,
  className,
  style,
  sizes,
  ...rest
}: ImageProps) {
  const fillStyle: CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
    : undefined;

  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={className}
      style={fillStyle ? { ...fillStyle, ...style } : style}
      {...rest}
    />
  );
}

/** Next's `usePathname`, backed by the active location. */
export function usePathname(): string {
  return useLocation().pathname;
}

/** The subset of Next's `useRouter` used by this codebase. */
export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => {},
    prefetch: () => {},
  };
}

/** Next returns the tuple as well; shared components only read the first item. */
export function useSearchParams(): URLSearchParams {
  return useRouterSearchParams()[0];
}

/** Throws the React Router not-found response. */
export function notFound(): never {
  throw new Response("Not Found", { status: 404 });
}
