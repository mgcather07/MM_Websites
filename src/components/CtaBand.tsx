import Link from "next/link";
import Reveal from "./Reveal";
import styles from "./CtaBand.module.css";

/** Full-width maroon call-to-action that drives visitors to the quote form. */
export default function CtaBand({
  title = "Ready for a website that works as hard as you do?",
  body = "Tell us about your business and we'll send a flat price — usually the same day. No pressure, no sales calls.",
  cta = "Get a free quote",
  href = "/contact",
}: {
  title?: string;
  body?: string;
  cta?: string;
  href?: string;
}) {
  return (
    <section className={styles.band}>
      <div className={`container ${styles.inner}`}>
        <Reveal>
          <div className={styles.copy}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.body}>{body}</p>
          </div>
        </Reveal>
        <Reveal delay={90}>
          <Link href={href} className={`btn btn-white ${styles.cta}`}>
            {cta}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
