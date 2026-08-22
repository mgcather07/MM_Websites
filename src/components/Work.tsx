import { existsSync } from "node:fs";
import path from "node:path";
import ImageSlot from "./ImageSlot";
import Reveal from "./Reveal";
import { work, type WorkItem } from "@/content/work";
import styles from "./Work.module.css";

// Resolved at build time: only treat an image as present if the file actually
// exists in /public, so unfilled portfolio slots show the clean placeholder
// instead of a broken-image icon (this component renders server-side).
function resolveImage(image?: string): string | undefined {
  if (!image) return undefined;
  return existsSync(path.join(process.cwd(), "public", image)) ? image : undefined;
}

export default function Work() {
  return (
    <section id="work" className={`band ${styles.section}`} aria-labelledby="work-title">
      <div className="container">
        <Reveal>
          <div className={styles.header}>
            <div className={styles.headerText}>
              <span className={styles.eyebrow}>Our work</span>
              <h2 id="work-title" className={styles.title}>
                Recent builds
              </h2>
            </div>
          </div>
        </Reveal>

        <div className={styles.grid}>
          {work.map((item, i) => (
            <Reveal key={item.title} delay={i * 90} distance={26}>
              <Card item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Card({ item }: { item: WorkItem }) {
  const image = resolveImage(item.image);
  const inner = (
    <>
      <div className={styles.thumb}>
        <ImageSlot
          src={image}
          alt={image ? `${item.title} website` : undefined}
          placeholder="Project screenshot"
        />
      </div>
      <h3 className={styles.itemTitle}>{item.title}</h3>
      <p className={styles.itemMeta}>{item.meta}</p>
    </>
  );

  if (item.url) {
    return (
      <a
        className={`${styles.item} ${styles.linked}`}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${item.title} — visit the live site (opens in a new tab)`}
      >
        {inner}
      </a>
    );
  }

  return <article className={styles.item}>{inner}</article>;
}
