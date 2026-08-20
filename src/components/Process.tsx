import { process } from "@/content/process";
import styles from "./Process.module.css";

export default function Process() {
  return (
    <section id="process" className={`band ${styles.section}`} aria-labelledby="process-title">
      <div className="container">
        <h2 id="process-title" className={`h2 ${styles.title}`}>
          How it works
        </h2>

        <ol className={styles.grid}>
          {process.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.num} aria-hidden="true">
                {i + 1}
              </span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
