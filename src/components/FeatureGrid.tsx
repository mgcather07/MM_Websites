import Reveal from "./Reveal";
import TiltCard from "./TiltCard";
import styles from "./FeatureGrid.module.css";

type Item = { title: string; body: string };

/**
 * Reusable content section: an eyebrow/heading/intro over a grid of
 * title+body cards. `variant` controls the little marker on each card
 * ("check", "number", or none) and `alt` swaps to the tinted background.
 */
export default function FeatureGrid({
  eyebrow,
  heading,
  intro,
  items,
  columns = 3,
  variant = "plain",
  alt = false,
}: {
  eyebrow?: string;
  heading: string;
  intro?: string;
  items: Item[];
  columns?: 2 | 3 | 4;
  variant?: "check" | "number" | "plain";
  alt?: boolean;
}) {
  return (
    <section className={`band ${styles.section} ${alt ? styles.alt : ""}`}>
      <div className="container">
        <Reveal>
          <div className={styles.head}>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2 className="h2">{heading}</h2>
            {intro && <p className={styles.intro}>{intro}</p>}
          </div>
        </Reveal>
        <div className={`${styles.grid} ${styles[`cols${columns}`]}`}>
          {items.map((item, i) => (
            <Reveal key={item.title} delay={(i % columns) * 60}>
              <TiltCard className={`${styles.card} ${variant !== "plain" ? styles.hasMark : ""}`}>
                {variant === "number" && (
                  <span className={styles.number} aria-hidden="true">
                    {i + 1}
                  </span>
                )}
                {variant === "check" && (
                  <span className={styles.check} aria-hidden="true">
                    ✓
                  </span>
                )}
                <div>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardBody}>{item.body}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
