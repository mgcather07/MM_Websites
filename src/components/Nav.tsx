"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav, site } from "@/content/site";
import styles from "./Nav.module.css";

export default function Nav() {
  const [tight, setTight] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setTight(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`${styles.nav} mm-nav mm-nav-in ${tight ? "mm-nav-tight" : ""}`}
    >
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo} aria-label={`${site.name} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size logo mark */}
          <img
            className={`${styles.mark} mm-mark`}
            src="/images/logo/mm-mark.png"
            alt=""
            width={61}
            height={32}
          />
          <span className={styles.wordmark}>{site.name}</span>
        </Link>

        {/* Desktop links */}
        <nav className={styles.links} aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`${styles.link} mm-navlink ${
                isActive(item.href) ? styles.active : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contact" className={`btn btn-maroon ${styles.cta}`}>
            Get a free quote
          </Link>
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className={styles.hamburger}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`${styles.bar} ${open ? styles.bar1open : ""}`} />
          <span className={`${styles.bar} ${open ? styles.bar2open : ""}`} />
          <span className={`${styles.bar} ${open ? styles.bar3open : ""}`} />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <div
        id="mobile-menu"
        className={`${styles.mobile} ${open ? styles.mobileOpen : ""}`}
      >
        <nav className={styles.mobileNav} aria-label="Mobile">
          <Link
            href="/"
            aria-current={isActive("/") ? "page" : undefined}
            className={`${styles.mobileLink} ${isActive("/") ? styles.active : ""}`}
          >
            Home
          </Link>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`${styles.mobileLink} ${
                isActive(item.href) ? styles.active : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contact" className={`btn btn-maroon ${styles.mobileCta}`}>
            Get a free quote
          </Link>
        </nav>
      </div>
    </header>
  );
}
