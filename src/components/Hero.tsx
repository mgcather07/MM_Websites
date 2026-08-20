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
            We&apos;re Michael &amp; Mandy — two folks from Gardendale who build
            clean, fast websites for contractors, salons, lawn care crews,
            restaurants, churches and everybody in between. No agency runaround,
            no monthly surprise.
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
            placeholder="Photo of Michael & Mandy, or a laptop showing a finished site"
          />
        </div>
      </div>
    </section>
  );
}
