import { site } from "@/content/site";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <p>
          © {site.copyrightYear} {site.name} · {site.town}
        </p>
        <p>
          <a href={site.phoneHref}>{site.phone}</a> ·{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </p>
      </div>
    </footer>
  );
}
