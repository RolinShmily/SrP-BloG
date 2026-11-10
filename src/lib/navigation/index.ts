/**
 * Framework-neutral navigation primitives shared by the site's components.
 *
 * The implementation targets React Router; the shared `href` prop is kept so
 * content components stay independent of router-specific prop names.
 */
export { Image, Link, notFound, usePathname, useRouter, useSearchParams } from "./react-router";
