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
 * The public surface is kept close to the conventions the content components
 * already use, so they need no router-specific branching.
 */

type RouterLinkProps = ComponentProps<typeof RouterLink>;

export interface LinkProps extends Omit<RouterLinkProps, "to"> {
  /** Shared destination prop; mapped onto React Router's `to`. */
  href: string;
  to?: RouterLinkProps["to"];
}

/**
 * Shared link primitive.
 *
 * React Router names the destination `to`; the shared components use `href`.
 * Passing `href` through unchanged silently resolves to the current route, so
 * the mapping is load-bearing.
 */
export function Link({ href, to, ...rest }: LinkProps) {
  return <RouterLink to={to ?? href} {...rest} />;
}

interface ImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  src: string;
  alt: string;
  /** Cover the nearest positioned ancestor. */
  fill?: boolean;
  /** Load eagerly and raise fetch priority. */
  priority?: boolean;
  /** Accepted for source-component compatibility; images are unoptimized. */
  unoptimized?: boolean;
  width?: number | string;
  height?: number | string;
}

/**
 * Shared image primitive.
 *
 * Images are served unoptimized, so the only behaviours worth preserving are
 * the `fill` layout and eager loading for the article hero image.
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

/** Returns the active pathname. */
export function usePathname(): string {
  return useLocation().pathname;
}

/** The subset of navigation helpers used by this codebase. */
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

/** Returns the current search parameters. */
export function useSearchParams(): URLSearchParams {
  return useRouterSearchParams()[0];
}

/** Throws the React Router not-found response. */
export function notFound(): never {
  throw new Response("Not Found", { status: 404 });
}
