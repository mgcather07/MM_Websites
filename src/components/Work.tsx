import ImageSlot from "./ImageSlot";
import { work } from "@/content/work";
import styles from "./Work.module.css";

export default function Work() {
  return (
    <section id="work" className={`band ${styles.section}`} aria-labelledby="work-title">
      <div className="container">
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.eyebrow}>Our work</span>
            <h2 id="work-title" className={styles.title}>
              Recent builds
            </h2>
          </div>
        </div>

        <div className={styles.grid}>
          {work.map((item) => (
            <article key={item.title} className={styles.item}>
              <div className={styles.thumb}>
                <ImageSlot
                  src={item.image}
                  alt={item.image ? `${item.title} website` : undefined}
                  placeholder="Project screenshot"
                />
              </div>
              <h3 className={styles.itemTitle}>{item.title}</h3>
              <p className={styles.itemMeta}>{item.meta}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
