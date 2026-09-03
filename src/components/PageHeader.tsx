import Reveal from "./Reveal";
import styles from "./PageHeader.module.css";

/** Intro banner at the top of a subpage: eyebrow, title, and a lead paragraph. */
export default function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <section className={styles.header}>
      <div className="container">
        <Reveal>
          <span className={`eyebrow ${styles.eyebrow}`}>{eyebrow}</span>
          <h1 className={styles.title}>{title}</h1>
          {lead && <p className={styles.lead}>{lead}</p>}
        </Reveal>
      </div>
    </section>
  );
}
