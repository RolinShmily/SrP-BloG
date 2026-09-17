"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Global page entrance transition wrapper.
 *
 * Uses `usePathname()` as a React key to trigger a fluid, Apple-style
 * entrance animation on route navigations without layout shifts or flicker.
 * Query string changes (e.g. tag filtering within `/tags/`) do not change
 * the pathname, keeping page-internal filters completely stable.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      key={pathname}
      className={`page-transition-enter flex-1 flex flex-col ${mounted ? "is-mounted" : ""}`}
    >
      {children}
    </div>
  );
}
