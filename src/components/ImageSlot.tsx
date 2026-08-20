"use client";

import { useEffect, useState } from "react";
import styles from "./ImageSlot.module.css";

type Props = {
  /** Image path under /public. When omitted (or the file fails to load), an
   *  empty drop slot is shown instead. */
  src?: string;
  alt?: string;
  /** Placeholder label shown when no image is set or it fails to load. */
  placeholder?: string;
  eager?: boolean;
  className?: string;
};

/**
 * Photo drop slot. Real photos come from the client — drop a file in
 * /public/images and reference it here. If a referenced file doesn't exist yet
 * (e.g. a portfolio screenshot not added), the slot shows a neutral placeholder
 * instead of a broken image, so unfilled slots stay tidy.
 */
export default function ImageSlot({
  src,
  alt = "",
  placeholder = "Photo coming soon",
  eager = false,
  className,
}: Props) {
  const [failed, setFailed] = useState(false);

  // Reset the error state if the source changes.
  useEffect(() => setFailed(false), [src]);

  const cls = className ? `${styles.slot} ${className}` : styles.slot;

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- object-fit fill of a fixed-height slot; no layout shift.
      <img
        className={cls}
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={`${cls} ${styles.empty}`} role="img" aria-label={placeholder}>
      <span aria-hidden="true">{placeholder}</span>
    </div>
  );
}
