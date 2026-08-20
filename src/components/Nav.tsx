import { nav, site } from "@/content/site";
import styles from "./Nav.module.css";

export default function Nav() {
  return (
    <header className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <a href="#top" className={styles.logo} aria-label={`${site.name} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size logo mark */}
          <img
            className={styles.mark}
            src="/images/logo/mm-mark.png"
            alt=""
            width={61}
            height={32}
          />
          <span className={styles.wordmark}>{site.name}</span>
        </a>

        <nav className={styles.links} aria-label="Primary">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className={styles.link}>
              {item.label}
            </a>
          ))}
          <a href="#quote" className={`btn btn-maroon ${styles.cta}`}>
            Get a free quote
          </a>
        </nav>

        {/* Compact CTA shown when the full link row is hidden on small screens */}
        <a href="#quote" className={`btn btn-maroon ${styles.ctaMobile}`}>
          Free quote
        </a>
      </div>
    </header>
  );
}
