import Reveal from "./Reveal";
import { processSteps } from "@/content/processDetail";
import styles from "./ProcessDetail.module.css";

/** Rich, numbered vertical walkthrough of the four steps (the /process page). */
export default function ProcessDetail() {
  return (
    <section className={`band ${styles.section}`} aria-labelledby="steps-title">
      <div className="container">
        <Reveal>
          <div className={styles.head}>
            <span className="eyebrow">Step by step</span>
            <h2 id="steps-title" className="h2">
              From first hello to live website
            </h2>
            <p className={styles.intro}>
              Four steps, no jargon. Here&apos;s exactly how a project goes from a
              phone call to a site you&apos;re proud of.
            </p>
          </div>
        </Reveal>

        <ol className={styles.steps}>
          {processSteps.map((step, i) => (
            <Reveal as="li" className={styles.step} key={step.title} delay={i * 90}>
              <div className={styles.marker} aria-hidden="true">
                <span className={styles.num}>{i + 1}</span>
              </div>
              <div className={styles.content}>
                <div className={styles.stepHead}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <span className={styles.time}>{step.time}</span>
                </div>
                <p className={styles.stepBody}>{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
