import Reveal from "./Reveal";
import styles from "./Faq.module.css";

/** Simple accessible FAQ using native <details>/<summary> (no JS needed). */
export default function Faq({
  heading = "Common questions",
  items,
}: {
  heading?: string;
  items: { q: string; a: string }[];
}) {
  return (
    <section className={`band ${styles.section}`} aria-labelledby="faq-title">
      <div className="container">
        <Reveal>
          <h2 id="faq-title" className={`h2 ${styles.title}`}>
            {heading}
          </h2>
        </Reveal>
        <div className={styles.list}>
          {items.map((item, i) => (
            <Reveal key={item.q} delay={(i % 4) * 60}>
              <details className={styles.item}>
                <summary className={styles.q}>
                  {item.q}
                  <span className={styles.icon} aria-hidden="true" />
                </summary>
                <p className={styles.a}>{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
