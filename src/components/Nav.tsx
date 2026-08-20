import { nav, site } from "@/content/site";
import styles from "./Nav.module.css";

export default function Nav() {
  return (
    <header className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <a href="#top" className={styles.logo} aria-label={`${site.name} home`}>
          <span className={styles.mark} aria-hidden="true">
            M&amp;M
          </span>
          <span className={styles.wordmark}>{site.name}</span>
        </a>

        <nav className={styles.links} aria-label="Primary">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className={styles.link}>
              {item.label}
            </a>
          ))}
          <a href="#quote" className={`btn btn-white ${styles.cta}`}>
            Get a free quote
          </a>
        </nav>

        {/* Compact CTA shown when the full link row is hidden on small screens */}
        <a href="#quote" className={`btn btn-white ${styles.ctaMobile}`}>
          Free quote
        </a>
      </div>
    </header>
  );
}
