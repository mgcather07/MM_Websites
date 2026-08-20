"use client";

import { useEffect } from "react";

/**
 * Smooth-scrolls same-page anchor links (nav, CTAs) to their section, then
 * strips the hash from the URL. Without this, clicking e.g. "Our work" leaves
 * `#work` in the address bar, so a page refresh jumps back down to that section
 * instead of staying at the top. This keeps the URL clean (always "/").
 */
export default function AnchorScroll() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const link = (e.target as HTMLElement)?.closest?.('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.getElementById(href.slice(1));
      if (!target) return;

      e.preventDefault();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });

      // Keep the URL free of the section hash so refreshes don't jump.
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
