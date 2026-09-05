import { site } from "@/content/site";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <p>
          © {site.copyrightYear} {site.name} · {site.town}
        </p>
        <p className={styles.contact}>
          <a href={site.phoneHref}>{site.phone}</a> ·{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </p>
        <a
          className={styles.builtBy}
          href="https://rehtacsoftware.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Website built by Rehtac"
        >
          <span>Built by</span>
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size credit mark */}
          <img src="/images/rehtac-mark.png" alt="" width={18} height={18} />
          <span>Rehtac</span>
        </a>
      </div>
    </footer>
  );
}
