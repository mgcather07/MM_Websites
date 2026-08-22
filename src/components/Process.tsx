import Reveal from "./Reveal";
import { process } from "@/content/process";
import styles from "./Process.module.css";

export default function Process() {
  return (
    <section id="process" className={`band ${styles.section}`} aria-labelledby="process-title">
      <div className="container">
        <Reveal>
          <h2 id="process-title" className={`h2 ${styles.title}`}>
            How it works
          </h2>
        </Reveal>

        <ol className={styles.grid}>
          {process.map((step, i) => (
            <Reveal as="li" className={styles.step} key={step.title} delay={i * 110}>
              <span className={`${styles.num} mm-step-num`} aria-hidden="true">
                {i + 1}
              </span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
