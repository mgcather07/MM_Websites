import styles from "./ImageSlot.module.css";

type Props = {
  /** Image path under /public. When omitted, an empty drop slot is shown. */
  src?: string;
  alt?: string;
  /** Placeholder label shown when no image is set. */
  placeholder?: string;
  eager?: boolean;
  className?: string;
};

/**
 * Photo drop slot. The design ships with every image area empty — real photos
 * come from the client. Drop a file in /public and pass `src` to fill a slot.
 */
export default function ImageSlot({
  src,
  alt = "",
  placeholder = "Photo coming soon",
  eager = false,
  className,
}: Props) {
  const cls = className ? `${styles.slot} ${className}` : styles.slot;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- object-fit fill of a fixed-height slot; no layout shift.
      <img
        className={cls}
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  return (
    <div className={`${cls} ${styles.empty}`} role="img" aria-label={placeholder}>
      <span aria-hidden="true">{placeholder}</span>
    </div>
  );
}
