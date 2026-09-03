"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageview } from "@/lib/analytics";

/**
 * Fires one pageview to first-party analytics on first load and again whenever
 * the route changes (the site is multi-page but navigates client-side, so a
 * plain mount-only effect would miss every page after the first).
 */
export default function PageView() {
  const pathname = usePathname();
  useEffect(() => {
    trackPageview();
  }, [pathname]);
  return null;
}
