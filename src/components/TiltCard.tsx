"use client";

import { useRef } from "react";
import styles from "./TiltCard.module.css";

/**
 * Wraps card content so it subtly tilts toward the cursor and shows a soft
 * light-glow that follows the pointer. Pure transform/opacity, so it's cheap;
 * the tilt is gated to hover-capable pointers in CSS, and disabled under
 * reduce-motion. Falls back to a plain card on touch.
 */
export default function TiltCard({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - py) * 5}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 5}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    el.style.setProperty("--glow", "1");
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glow", "0");
  };

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLElement>}
      className={`${styles.tilt} ${className}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <span className={styles.glow} aria-hidden="true" />
      {children}
    </Tag>
  );
}
