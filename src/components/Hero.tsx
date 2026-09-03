import Link from "next/link";
import HeroBuild from "./HeroBuild";
import styles from "./Hero.module.css";

const proof = ["Live in 2–3 weeks", "Built to load fast", "You own it"];

export default function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      {/* Decorative ambient glows */}
      <div className="mm-hero-glow mm-hero-glow-a" aria-hidden />
      <div className="mm-hero-glow mm-hero-glow-b" aria-hidden />

      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <h1 id="hero-title" className={`${styles.title} mm-hero-title`}>
            A real website for your small business.{" "}
            <span className="mm-underline">Starting at $500.</span>
          </h1>

          <p className={`${styles.body} mm-hero-body`}>
            With years of experience building for small businesses, we design
            clean, fast websites that make you look professional and help
            customers find you. Every site is custom-built, flat-priced, and
            yours to own — no agency runaround, no monthly surprises.
          </p>

          <div className={`${styles.buttons} mm-hero-cta`}>
            <Link href="/contact" className={`btn btn-white ${styles.primary}`}>
              Get my free quote
              <span className="mm-sheen" aria-hidden />
            </Link>
            <Link href="/work" className={`btn btn-outline ${styles.secondary}`}>
              See our work
            </Link>
          </div>

          <ul className={`${styles.proof} mm-proof`}>
            {proof.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className={`${styles.imageFrame} mm-hero-img`}>
          <HeroBuild />
        </div>
      </div>
    </section>
  );
}
