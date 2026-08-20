import ImageSlot from "./ImageSlot";
import styles from "./Hero.module.css";

const proof = ["Live in 2–3 weeks", "Built to load fast", "You own it"];

export default function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <h1 id="hero-title" className={styles.title}>
            A real website for your small business. Starting at $500.
          </h1>

          <p className={styles.body}>
            With years of experience building for small businesses, we design
            clean, fast websites that make you look professional and help
            customers find you. Every site is custom-built, flat-priced, and
            yours to own — no agency runaround, no monthly surprises.
          </p>

          <div className={styles.buttons}>
            <a href="#quote" className={`btn btn-white ${styles.primary}`}>
              Get my free quote
            </a>
            <a href="#work" className={`btn btn-outline ${styles.secondary}`}>
              See our work
            </a>
          </div>

          <ul className={styles.proof}>
            {proof.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className={styles.imageFrame}>
          <ImageSlot
            src="/images/hero/hero.jpg"
            alt="A laptop and phone showing a small-business website built by M&M Websites"
            eager
            placeholder="A finished website on a laptop and phone"
          />
        </div>
      </div>
    </section>
  );
}
