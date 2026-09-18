"use client";

import React, { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";
import { ArtPlum } from "./art-plum";
import { ArtDots } from "./art-dots";

export type ArtType = "plum" | "dots" | "none";

/**
 * Ambient background art manager:
 * All pages consistently use `ArtPlum` (winter plum branches) for a unified,
 * tranquil aesthetic.
 * Supports explicit URL override: `?art=plum` | `?art=dots` | `?art=none`.
 */
export function AmbientArt() {
  const [queryOverride, setQueryOverride] = useState<ArtType | null>(null);

  useEffect(() => {
    try {
      const param = new URLSearchParams(window.location.search).get("art");
      if (param === "plum" || param === "dots" || param === "none") {
        setQueryOverride(param);
      }
    } catch {
      // ignore in environments without window.location
    }
  }, []);

  if (siteConfig.ambientArt === "none" || queryOverride === "none") {
    return null;
  }

  // 1. Explicit query override takes highest priority
  if (queryOverride === "dots") {
    return <ArtDots key="dots-override" />;
  }
  if (queryOverride === "plum") {
    return <ArtPlum key="plum-override" />;
  }

  // 2. Global static mode override if configured
  if (siteConfig.ambientArt === "dots") {
    return <ArtDots key="dots-static" />;
  }

  // 3. Default: all pages render winter plum branches (ArtPlum)
  return <ArtPlum key="plum" />;
}
