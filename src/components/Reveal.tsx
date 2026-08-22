"use client";

/**
 * Reveal — fades + lifts its children into view once, on scroll.
 * Drop-in for the M&M Websites homepage (Next.js App Router).
 *
 *   <Reveal delay={90}><article className={styles.card}>…</article></Reveal>
 *
 * Notes
 * - Renders a plain <div> (or `as`) so it can sit inside a CSS grid cell.
 * - Uses IntersectionObserver; unobserves after the first reveal.
 * - Honors prefers-reduced-motion by rendering visible immediately.
 * - When it reveals, any `.mm-step-num` descendants get data-shown="true"
 *   so the process numbers pop in with their column.
 * - No animation library needed.
 */

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** ms to stagger this item behind its neighbours */
  delay?: number;
  /** px of upward travel; 24 for cards, 22 for headings */
  distance?: number;
  as?: ElementType;
  className?: string;
};

export default function Reveal({
  children,
  delay = 0,
  distance = 24,
  as: Tag = "div",
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const revealNow = () => {
      setShown(true);
      el.querySelectorAll<HTMLElement>(".mm-step-num").forEach((n) => {
        n.dataset.shown = "true";
      });
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      revealNow();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        io.unobserve(entry.target);
        window.setTimeout(revealNow, delay);
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${distance}px)`,
        transition:
          "opacity 660ms ease-out, transform 660ms cubic-bezier(0.2, 0.7, 0.2, 1)",
        willChange: shown ? undefined : "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}
