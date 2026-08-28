"use client";

import { useEffect } from "react";
import { trackPageview } from "@/lib/analytics";

/** Fires one pageview to first-party analytics on mount. Renders nothing. */
export default function PageView() {
  useEffect(() => {
    trackPageview();
  }, []);
  return null;
}
