/**
 * Default resolution for the framework-neutral navigation primitives.
 *
 * - Next.js (via the tsconfig `@nav` path) resolves here, which forwards to
 *   the native Next.js primitives.
 * - Vite overrides `@nav` with `src/lib/navigation/react-router.tsx`.
 * - `tsc` type-checks against the Next.js signatures; both implementations
 *   share the same props surface.
 */
export { Image, Link, notFound, usePathname, useRouter, useSearchParams } from "./next";
